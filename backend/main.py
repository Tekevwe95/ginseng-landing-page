from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Ginseng Plus API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["*"])

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

class Order(OrderCreate):
    id: str
    status: OrderStatus
    payment_method: str
    created_at: datetime

orders: dict[str, Order] = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "ginseng-plus-api"}

@app.post("/api/orders", response_model=Order, status_code=201)
def create_order(order: OrderCreate):
    order_id = f"GP-{uuid4().hex[:8].upper()}"
    saved = Order(id=order_id, **order.model_dump(), status=OrderStatus.new, payment_method="pay_on_delivery", created_at=datetime.now(timezone.utc))
    orders[order_id] = saved
    return saved

@app.get("/api/orders/{order_id}", response_model=Order)
def get_order(order_id: str):
    order = orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
