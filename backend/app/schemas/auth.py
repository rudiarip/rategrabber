from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserProfile(BaseModel):
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

class LoginResponse(BaseModel):
    token: Token
    user: UserProfile
