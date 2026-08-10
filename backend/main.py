import os
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models import OrderRecord

app = FastAPI(title="Ginseng Plus API", version="1.4.0")

configured_origins = os.getenv("CORS_ORIGINS", "")
cors_origins = {x.strip().rstrip("/") for x in configured_origins.split(",") if x.strip()}
cors_origins.update({"https://megastorewellness.vercel.app", "http://localhost:3000"})
app.add_middleware(CORSMiddleware, allow_origins=sorted(cors_origins), allow_credentials=False, allow_methods=["GET", "POST", "PATCH", "OPTIONS"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")

class OrderStatus(str, Enum):
    new = "new"
    confirmed = "confirmed"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"

class OrderCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    whatsapp: Optional[str] = Field(default=None, max_length=30)
    state: str = Field(min_length=2, max_length=80)
    city: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=5, max_length=500)
    package: str = Field(min_length=2, max_length=120)

class OrderResponse(OrderCreate):
    id: str
    status: OrderStatus
    payment_method: str
    created_at: datetime

class StatusUpdate(BaseModel):
    status: OrderStatus

def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def require_admin(x_admin_token: str | None = Header(default=None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")

def to_response(row: OrderRecord) -> OrderResponse:
    return OrderResponse(id=row.id, name=row.name, phone=row.phone, whatsapp=row.whatsapp, state=row.state, city=row.city, address=row.address, package=row.package, status=row.status, payment_method=row.payment_method, created_at=row.created_at)

@app.get("/")
def root():
    return {"service": "Ginseng Plus API", "status": "online", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "ginseng-plus-api"}

@app.post("/api/orders", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, session: Session = Depends(db)):
    order_id = f"GP-{uuid4().hex[:8].upper()}"
    row = OrderRecord(id=order_id, **order.model_dump(), status=OrderStatus.new.value, payment_method="pay_on_delivery")
    try:
        session.add(row)
        session.commit()
        session.refresh(row)
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Could not save order. Please try again.")
    return to_response(row)

@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, session: Session = Depends(db)):
    row = session.get(OrderRecord, order_id)
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return to_response(row)

@app.get("/api/admin/orders", response_model=list[OrderResponse], dependencies=[Depends(require_admin)])
def list_orders(session: Session = Depends(db)):
    rows = session.scalars(select(OrderRecord).order_by(OrderRecord.created_at.desc())).all()
    return [to_response(row) for row in rows]

@app.patch("/api/admin/orders/{order_id}/status", response_model=OrderResponse, dependencies=[Depends(require_admin)])
def update_status(order_id: str, update: StatusUpdate, session: Session = Depends(db)):
    row = session.get(OrderRecord, order_id)
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    row.status = update.status.value
    session.commit()
    session.refresh(row)
    return to_response(row)
