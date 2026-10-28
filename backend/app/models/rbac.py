import uuid
from sqlalchemy import Column, String, Boolean, DateTime, SmallInteger, Integer, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID

class UserRole(Base):
    __tablename__ = "mt_user_roles"

    id = Column(SmallInteger, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)

    # Relationships
    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(SmallInteger, primary_key=True)
    name = Column(String(255), nullable=False)
    logic_name = Column(String(255), nullable=False, unique=True)
    
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(GUID, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    created_by = Column(GUID, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    updated_by = Column(GUID, nullable=False)

    # Relationships
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class Menu(Base):
    __tablename__ = "menus"

    id = Column(SmallInteger, primary_key=True)
    child_menus_id = Column(SmallInteger, ForeignKey("menus.id", ondelete="SET NULL"), nullable=True)  # self-referencing parent
    name = Column(String(255), nullable=False)
    is_parent = Column(Boolean, nullable=False, default=False)
    icon = Column(String(255), nullable=True)
    link = Column(String(500), nullable=True)
    order_no = Column(Integer, default=0)
    
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(GUID, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    created_by = Column(GUID, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    updated_by = Column(GUID, nullable=False)

    # Relationships
    parent = relationship("Menu", remote_side=[id], backref="children")
    role_permissions = relationship("RolePermission", back_populates="menu", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_role_id = Column(SmallInteger, ForeignKey("mt_user_roles.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_id = Column(SmallInteger, ForeignKey("menus.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(SmallInteger, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)

    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(GUID, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    created_by = Column(GUID, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    updated_by = Column(GUID, nullable=False)

    # Unique constraint
    __table_args__ = (
        UniqueConstraint("user_role_id", "menu_id", "permission_id", name="uq_role_menu_permission"),
    )

    # Relationships
    role = relationship("UserRole", back_populates="role_permissions")
    menu = relationship("Menu", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")
