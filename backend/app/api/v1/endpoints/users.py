import uuid
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.core.datetime_utils import now_utc, to_local_iso
from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User
from backend.app.models.rbac import UserRole
from backend.app.schemas.rbac import UserDetail, UserCreate, UserUpdate

router = APIRouter()

@router.get("", dependencies=[Depends(require_permission("/admin/users", "view"))])
def list_users(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah data per halaman"),
    db: Session = Depends(get_db)
):
    """Returns paginated and searchable list of users with their roles."""
    query = db.query(User).join(UserRole, User.role_id == UserRole.id).filter(User.deleted_at.is_(None))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.username.ilike(s)) | 
            (User.email.ilike(s)) | 
            (User.full_name.ilike(s)) | 
            (User.phone.ilike(s)) | 
            (UserRole.name.ilike(s))
        )

    total = query.count()
    offset = (page - 1) * limit
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    total_pages = max(1, math.ceil(total / limit))

    results = []
    for u in users:
        results.append({
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role_id": u.role_id,
            "role_name": u.role.name if u.role else "Unknown",
            "is_active": u.is_active,
            "created_at": to_local_iso(u.created_at),
            "updated_at": to_local_iso(u.updated_at),
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.post("", response_model=UserDetail, dependencies=[Depends(require_permission("/admin/users", "create"))])
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new user with UTC+0 timestamp."""
    existing = db.query(User).filter(
        (User.username == payload.username.strip()) | 
        (User.email == payload.email.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username atau email sudah terdaftar")

    role = db.query(UserRole).filter(UserRole.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role tidak valid")

    new_user = User(
        id=uuid.uuid4(),
        username=payload.username.strip(),
        email=payload.email.strip(),
        full_name=payload.full_name.strip() if payload.full_name else None,
        phone=payload.phone.strip() if payload.phone else None,
        password=get_password_hash(payload.password),
        role_id=payload.role_id,
        is_active=True,
        created_at=now_utc(),
        updated_at=now_utc(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserDetail(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        phone=new_user.phone,
        role_id=new_user.role_id,
        role_name=role.name,
        is_active=new_user.is_active
    )

@router.put("/{user_id}", response_model=UserDetail, dependencies=[Depends(require_permission("/admin/users", "update"))])
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user information with UTC+0 timestamp."""
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")

    if payload.username is not None:
        user.username = payload.username.strip()
    if payload.email is not None:
        user.email = payload.email.strip()
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip() if payload.full_name else None
    if payload.phone is not None:
        user.phone = payload.phone.strip() if payload.phone else None
    if payload.password:
        user.password = get_password_hash(payload.password)
    if payload.role_id is not None:
        user.role_id = payload.role_id
    if payload.is_active is not None:
        user.is_active = payload.is_active

    user.updated_at = now_utc()
    user.updated_by = current_user.id
    db.commit()
    db.refresh(user)

    return UserDetail(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role_id=user.role_id,
        role_name=user.role.name if user.role else "Unknown",
        is_active=user.is_active
    )

@router.delete("/{user_id}", dependencies=[Depends(require_permission("/admin/users", "delete"))])
def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft deletes user."""
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus akun Anda sendiri")

    user.is_active = False
    user.deleted_at = now_utc()
    user.deleted_by = current_user.id
    db.commit()
    return {"success": True, "message": "Pengguna berhasil dihapus"}
