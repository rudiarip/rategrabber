import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User
from backend.app.models.rbac import UserRole, Permission, Menu, RolePermission
from backend.app.schemas.rbac import UserRoleSchema, PermissionSchema, RolePermissionUpdate

router = APIRouter()

@router.get("", response_model=List[UserRoleSchema], dependencies=[Depends(require_permission("/admin/roles", "view"))])
def list_roles(db: Session = Depends(get_db)):
    """Returns list of user roles."""
    return db.query(UserRole).all()

@router.get("/permissions", response_model=List[PermissionSchema], dependencies=[Depends(require_permission("/admin/roles", "view"))])
def list_permissions(db: Session = Depends(get_db)):
    """Returns list of all available system permissions."""
    return db.query(Permission).order_by(Permission.id.asc()).all()

@router.get("/matrix/{role_id}", dependencies=[Depends(require_permission("/admin/roles", "view"))])
def get_role_permission_matrix(role_id: int, db: Session = Depends(get_db)):
    """Returns the permission matrix for a specific role across all menus."""
    role = db.query(UserRole).filter(UserRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    menus = db.query(Menu).order_by(Menu.order_no.asc()).all()
    permissions = db.query(Permission).order_by(Permission.id.asc()).all()
    
    role_perms = (
        db.query(RolePermission)
        .filter(RolePermission.user_role_id == role_id)
        .all()
    )
    granted_set = {(rp.menu_id, rp.permission_id) for rp in role_perms}

    matrix = []
    for m in menus:
        menu_perms = []
        for p in permissions:
            is_granted = (m.id, p.id) in granted_set or (role_id == 1)
            menu_perms.append({
                "permission_id": p.id,
                "permission_name": p.name,
                "logic_name": p.logic_name,
                "granted": is_granted
            })
        matrix.append({
            "menu_id": m.id,
            "menu_name": m.name,
            "is_parent": m.is_parent,
            "link": m.link,
            "permissions": menu_perms
        })

    return {
        "role_id": role.id,
        "role_name": role.name,
        "matrix": matrix
    }

@router.post("/matrix/{role_id}", dependencies=[Depends(require_permission("/admin/roles", "update"))])
def update_role_permissions(
    role_id: int,
    payload: List[RolePermissionUpdate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates role permissions matrix for a role."""
    if role_id == 1 and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Tidak dapat mengubah izin Super Admin")

    role = db.query(UserRole).filter(UserRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    # Clear and replace updated menu permissions
    for item in payload:
        db.query(RolePermission).filter(
            RolePermission.user_role_id == role_id,
            RolePermission.menu_id == item.menu_id
        ).delete()

        for pid in item.permission_ids:
            db.add(RolePermission(
                id=uuid.uuid4(),
                user_role_id=role_id,
                menu_id=item.menu_id,
                permission_id=pid,
                created_by=current_user.id,
                updated_by=current_user.id
            ))

    db.commit()
    return {"success": True, "message": "Izin role berhasil diperbarui"}
