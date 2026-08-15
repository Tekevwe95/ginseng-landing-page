from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class OrderRecord(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30))
    whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    state: Mapped[str] = mapped_column(String(80))
    city: Mapped[str] = mapped_column(String(80))
    address: Mapped[str] = mapped_column(String(500))
    package: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="new")
    payment_method: Mapped[str] = mapped_column(String(30), default="pay_on_delivery")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    endpoint: Mapped[str] = mapped_column(Text, unique=True)
    p256dh: Mapped[str] = mapped_column(Text)
    auth: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
