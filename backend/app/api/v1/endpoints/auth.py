from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.core.config import settings
from backend.app.models.user import User
from backend.app.models.rbac import UserRole
from backend.app.schemas.auth import LoginRequest, LoginResponse, Token, UserProfile
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates admin or staff user and returns JWT token."""
    login_id = payload.username_or_email.strip()
    user = (
        db.query(User)
        .filter((User.username == login_id) | (User.email == login_id))
        .first()
    )

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username/email atau kata sandi tidak sesuai.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun ini telah dinonaktifkan. Hubungi administrator.",
        )

    role_name = user.role.name if user.role else "User"
    token_str = create_access_token(subject=str(user.id))

    return LoginResponse(
        token=Token(
            access_token=token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        user=UserProfile(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role_id=user.role_id,
            role_name=role_name,
            is_active=user.is_active,
        ),
    )


@router.get("/me", response_model=UserProfile)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile and role."""
    role_name = current_user.role.name if current_user.role else "User"
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role_id=current_user.role_id,
        role_name=role_name,
        is_active=current_user.is_active,
    )
