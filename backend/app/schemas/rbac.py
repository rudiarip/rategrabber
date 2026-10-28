from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

class PermissionSchema(BaseModel):
    id: int
    name: str
    logic_name: str

    class Config:
        from_attributes = True

class PermissionCreate(BaseModel):
    name: str
    logic_name: str

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    logic_name: Optional[str] = None

class MenuCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    is_parent: bool = False
    icon: Optional[str] = None
    link: Optional[str] = None
    order_no: int = 0

class MenuUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    is_parent: Optional[bool] = None
    icon: Optional[str] = None
    link: Optional[str] = None
    order_no: Optional[int] = None

class MenuOut(BaseModel):
    id: int
    name: str
    is_parent: bool
    icon: Optional[str] = None
    link: Optional[str] = None
    order_no: int
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True

class UserRoleSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class MenuNavigationItem(BaseModel):
    id: int
    name: str
    is_parent: bool
    icon: Optional[str] = None
    link: Optional[str] = None
    order_no: int
    parent_id: Optional[int] = None
    permissions: List[str] = []  # e.g. ["view", "create", "update", "delete"]
    children: List["MenuNavigationItem"] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role_id: int
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserDetail(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: int
    role_name: str
    is_active: bool

    class Config:
        from_attributes = True

class RolePermissionUpdate(BaseModel):
    menu_id: int
    permission_ids: List[int]
