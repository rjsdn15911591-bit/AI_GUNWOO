import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class MonthlyUsage(Base):
    __tablename__ = "monthly_usage"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    year_month: Mapped[str] = mapped_column(String(7), nullable=False)
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    limit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("user_id", "year_month", name="unique_user_year_month"),
        Index("idx_monthly_usage_user_year_month", "user_id", "year_month"),
    )
