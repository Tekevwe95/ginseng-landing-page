import hashlib
import hmac
import json
import os
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pywebpush import WebPushException, webpush
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models import OrderRecord, PushSubscription
from status_history import OrderStatusHistory

app = FastAPI(title="Ginseng Plus API", version="1.8.2")

configured_origins = os.getenv("CORS_ORIGINS", "")
cors_origins = {x.strip().rstrip("/") for x in configured_origins.split(",") if x.strip()}
cors_origins.update({"https://megastorewellness.vercel.app", "https://megastorewellness.vercel.app/", "http://localhost:3000"})
app.add_middleware(CORSMiddleware, allow_origins=sorted(cors_origins), allow_credentials=False, allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
META_APP_SECRET = os.getenv("META_APP_SECRET")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:admin@megastorewellness.vercel.app")

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

class HistoryResponse(BaseModel):
    status: OrderStatus
    changed_at: datetime

class StatusUpdate(BaseModel):
    status: OrderStatus

class PushSubscriptionIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=4000)
    p256dh: str = Field(min_length=10, max_length=1000)
    auth: str = Field(min_length=5, max_length=1000)

def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def require_admin(x_admin_token: str | None = Header(default=None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    if not hmac.compare_digest(x_admin_token or "", ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid admin token")

def to_response(row: OrderRecord) -> OrderResponse:
    return OrderResponse(id=row.id, name=row.name, phone=row.phone, whatsapp=row.whatsapp, state=row.state, city=row.city, address=row.address, package=row.package, status=row.status, payment_method=row.payment_method, created_at=row.created_at)

def add_history(session: Session, order_id: str, status: str):
    session.add(OrderStatusHistory(order_id=order_id, status=status))

def backfill_history():
    session = SessionLocal()
    try:
        rows = session.scalars(select(OrderRecord)).all()
        changed = False
        for row in rows:
            exists = session.scalar(select(OrderStatusHistory.id).where(OrderStatusHistory.order_id == row.id).limit(1))
            if exists is None:
                session.add(OrderStatusHistory(order_id=row.id, status=row.status))
                changed = True
        if changed:
            session.commit()
    finally:
        session.close()

backfill_history()

@app.get("/")
def root():
    return {"service": "Ginseng Plus API", "status": "online", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "ginseng-plus-api"}

@app.get("/api/admin/push/public-key", dependencies=[Depends(require_admin)])
def get_push_public_key():
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Web Push is not configured yet: VAPID_PUBLIC_KEY is missing on Render")
    if not VAPID_PRIVATE_KEY:
        raise HTTPException(status_code=503, detail="Web Push is not configured yet: VAPID_PRIVATE_KEY is missing on Render")
    return {"publicKey": VAPID_PUBLIC_KEY}

@app.post("/api/admin/push/subscribe", dependencies=[Depends(require_admin)])
def subscribe_push(subscription: PushSubscriptionIn, session: Session = Depends(db)):
    existing = session.scalar(select(PushSubscription).where(PushSubscription.endpoint == subscription.endpoint))
    if existing:
        existing.p256dh = subscription.p256dh
        existing.auth = subscription.auth
    else:
        session.add(PushSubscription(id=uuid4().hex, **subscription.model_dump()))
    session.commit()
    return {"status": "subscribed"}

@app.delete("/api/admin/push/subscribe", dependencies=[Depends(require_admin)])
def unsubscribe_push(subscription: PushSubscriptionIn, session: Session = Depends(db)):
    session.execute(delete(PushSubscription).where(PushSubscription.endpoint == subscription.endpoint))
    session.commit()
    return {"status": "unsubscribed"}

def send_push_payload(payload: str):
    if not (VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY):
        raise RuntimeError("VAPID_PRIVATE_KEY and/or VAPID_PUBLIC_KEY is missing on Render")
    session = SessionLocal()
    sent = 0
    failed = []
    stale = []
    try:
        subscriptions = session.scalars(select(PushSubscription)).all()
        if not subscriptions:
            raise RuntimeError("No Web Push subscription is saved. Enable notifications from the admin dashboard first.")
        for sub in subscriptions:
            try:
                webpush(subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}}, data=payload, vapid_private_key=VAPID_PRIVATE_KEY, vapid_claims={"sub": VAPID_SUBJECT})
                sent += 1
            except WebPushException as exc:
                response = getattr(exc, "response", None)
                status = getattr(response, "status_code", None)
                failed.append({"status": status, "error": str(exc)})
                if status in (404, 410):
                    stale.append(sub.id)
        if stale:
            session.execute(delete(PushSubscription).where(PushSubscription.id.in_(stale)))
            session.commit()
    finally:
        session.close()
    return {"sent": sent, "failed": failed, "subscriptions": len(subscriptions)}

def send_order_push(order: OrderRecord):
    try:
        order_url = f"/admin/?order={order.id}"
        send_push_payload(json.dumps({"title": "🔔 New MegaStore Wellness Order", "body": f"{order.id} · {order.package} · {order.name}", "url": order_url, "orderId": order.id}))
    except Exception:
        pass

@app.post("/api/admin/push/test", dependencies=[Depends(require_admin)])
def test_push():
    try:
        result = send_push_payload(json.dumps({"title": "🔔 MegaStore Wellness Test", "body": "Web Push is working. New orders will appear here.", "url": "/admin/"}))
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

@app.get("/webhooks/whatsapp")
def verify_whatsapp_webhook(hub_mode: str | None = Query(default=None, alias="hub.mode"), hub_verify_token: str | None = Query(default=None, alias="hub.verify_token"), hub_challenge: str | None = Query(default=None, alias="hub.challenge")):
    if not WHATSAPP_VERIFY_TOKEN:
        raise HTTPException(status_code=503, detail="WhatsApp webhook verification is not configured")
    if hub_mode == "subscribe" and hmac.compare_digest(hub_verify_token or "", WHATSAPP_VERIFY_TOKEN):
        return int(hub_challenge or "0") if (hub_challenge or "").isdigit() else hub_challenge
    raise HTTPException(status_code=403, detail="Webhook verification failed")

@app.post("/webhooks/whatsapp")
async def receive_whatsapp_webhook(request: Request):
    raw_body = await request.body()
    if META_APP_SECRET:
        signature = request.headers.get("x-hub-signature-256", "")
        expected = "sha256=" + hmac.new(META_APP_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=403, detail="Invalid webhook signature")
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc
    return {"status": "ok", "received": payload.get("object", "whatsapp_business_account")}

@app.post("/api/orders", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, session: Session = Depends(db)):
    order_id = f"GP-{uuid4().hex[:8].upper()}"
    row = OrderRecord(id=order_id, **order.model_dump(), status=OrderStatus.new.value, payment_method="pay_on_delivery")
    try:
        session.add(row)
        session.flush()
        add_history(session, order_id, OrderStatus.new.value)
        session.commit()
        session.refresh(row)
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Could not save order. Please try again.")
    send_order_push(row)
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

@app.delete("/api/admin/orders", dependencies=[Depends(require_admin)])
def clear_orders(session: Session = Depends(db)):
    order_count = len(session.scalars(select(OrderRecord.id)).all())
    try:
        session.execute(delete(OrderStatusHistory))
        session.execute(delete(OrderRecord))
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Could not clear orders")
    return {"status": "cleared", "deleted": order_count}

@app.get("/api/admin/orders/{order_id}/history", response_model=list[HistoryResponse], dependencies=[Depends(require_admin)])
def get_order_history(order_id: str, session: Session = Depends(db)):
    if not session.get(OrderRecord, order_id):
        raise HTTPException(status_code=404, detail="Order not found")
    rows = session.scalars(select(OrderStatusHistory).where(OrderStatusHistory.order_id == order_id).order_by(OrderStatusHistory.changed_at.asc())).all()
    return [HistoryResponse(status=row.status, changed_at=row.changed_at) for row in rows]

@app.patch("/api/admin/orders/{order_id}/status", response_model=OrderResponse, dependencies=[Depends(require_admin)])
def update_status(order_id: str, update: StatusUpdate, session: Session = Depends(db)):
    row = session.get(OrderRecord, order_id)
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    if row.status != update.status.value:
        row.status = update.status.value
        add_history(session, order_id, update.status.value)
        session.commit()
        session.refresh(row)
    return to_response(row)
