import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.datetime_utils import now_utc, to_local_iso
from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User
from backend.app.models.rbac import Permission, RolePermission, Menu
from backend.app.schemas.rbac import PermissionSchema, PermissionCreate, PermissionUpdate

router = APIRouter()

@router.get("", dependencies=[Depends(require_permission("/admin/permissions", "view"))])
def list_all_permissions(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    all_items: bool = Query(False, alias="all"),
    db: Session = Depends(get_db)
):
    """Lists available permissions with search and pagination."""
    query = db.query(Permission).filter(Permission.deleted_at.is_(None))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Permission.name.ilike(s)) | (Permission.logic_name.ilike(s)))

    total = query.count()

    if all_items:
        perms = query.order_by(Permission.id.asc()).all()
        items = [{
            "id": p.id,
            "name": p.name,
            "logic_name": p.logic_name,
            "created_at": to_local_iso(p.created_at),
            "updated_at": to_local_iso(p.updated_at),
        } for p in perms]
        return {"items": items, "total": total, "page": 1, "limit": total, "total_pages": 1}

    offset = (page - 1) * limit
    perms = query.order_by(Permission.id.asc()).offset(offset).limit(limit).all()
    total_pages = max(1, math.ceil(total / limit))

    items = [{
        "id": p.id,
        "name": p.name,
        "logic_name": p.logic_name,
        "created_at": to_local_iso(p.created_at),
        "updated_at": to_local_iso(p.updated_at),
    } for p in perms]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.post("", dependencies=[Depends(require_permission("/admin/permissions", "create"))])
def create_permission(
    payload: PermissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new permission with UTC+0 timestamp."""
    logic = payload.logic_name.strip().lower()
    existing = db.query(Permission).filter(
        (Permission.logic_name == logic) | (Permission.name.ilike(payload.name.strip()))
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Permission dengan nama/logic '{logic}' sudah terdaftar")

    max_id = db.query(func.coalesce(func.max(Permission.id), 0)).scalar()
    new_id = max_id + 1

    perm = Permission(
        id=new_id,
        name=payload.name.strip(),
        logic_name=logic,
        created_at=now_utc(),
        updated_at=now_utc(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(perm)
    db.commit()
    db.refresh(perm)

    # Automatically grant this new permission to Super Admin across all menus
    all_menus = db.query(Menu).all()
    for m in all_menus:
        db.add(RolePermission(
            user_role_id=1,
            menu_id=m.id,
            permission_id=perm.id,
            created_at=now_utc(),
            updated_at=now_utc(),
            created_by=current_user.id,
            updated_by=current_user.id
        ))
    db.commit()

    return {
        "id": perm.id,
        "name": perm.name,
        "logic_name": perm.logic_name,
        "created_at": to_local_iso(perm.created_at),
        "updated_at": to_local_iso(perm.updated_at),
    }


@router.put("/{permission_id}", dependencies=[Depends(require_permission("/admin/permissions", "update"))])
def update_permission(
    permission_id: int,
    payload: PermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing permission with UTC+0 timestamp."""
    perm = db.query(Permission).filter(Permission.id == permission_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission tidak ditemukan")

    if payload.name is not None:
        perm.name = payload.name.strip()
    if payload.logic_name is not None:
        logic = payload.logic_name.strip().lower()
        conflict = db.query(Permission).filter(
            Permission.logic_name == logic,
            Permission.id != permission_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail=f"Logic name '{logic}' sudah digunakan")
        perm.logic_name = logic

    perm.updated_at = now_utc()
    perm.updated_by = current_user.id
    db.commit()
    db.refresh(perm)

    return {
        "id": perm.id,
        "name": perm.name,
        "logic_name": perm.logic_name,
        "created_at": to_local_iso(perm.created_at),
        "updated_at": to_local_iso(perm.updated_at),
    }


@router.delete("/{permission_id}", dependencies=[Depends(require_permission("/admin/permissions", "delete"))])
def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db)
):
    """Deletes a permission."""
    perm = db.query(Permission).filter(Permission.id == permission_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission tidak ditemukan")

    if perm.id in [1, 2, 3, 4]:
        raise HTTPException(
            status_code=400,
            detail="Permission inti sistem (View, Create, Update, Delete) tidak boleh dihapus."
        )

    db.delete(perm)
    db.commit()
    return {"success": True, "message": f"Permission '{perm.name}' berhasil dihapus"}
