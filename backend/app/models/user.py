import uuid
from sqlalchemy import Column, String, Boolean, DateTime, SmallInteger, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID

class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    password = Column(String(255), nullable=False)
    role_id = Column(SmallInteger, ForeignKey("mt_user_roles.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(GUID, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    created_by = Column(GUID, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    updated_by = Column(GUID, nullable=True)

    # Relationship
    role = relationship("UserRole", back_populates="users")
