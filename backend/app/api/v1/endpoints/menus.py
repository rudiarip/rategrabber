import math
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.datetime_utils import now_utc, to_local_iso
from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User
from backend.app.models.rbac import Menu, RolePermission, Permission
from backend.app.schemas.rbac import MenuCreate, MenuUpdate, MenuOut
from backend.app.services.rbac_service import get_user_navigation

router = APIRouter()

@router.get("/my-navigation", response_model=List[Dict[str, Any]])
def get_my_navigation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the personalized dynamic menu tree loaded according to the user's role permissions."""
    return get_user_navigation(db, current_user)


@router.get("", dependencies=[Depends(require_permission("/admin/menus", "view"))])
def list_all_menus(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    all_items: bool = Query(False, alias="all"),
    db: Session = Depends(get_db)
):
    """Lists configured system menus with search and pagination."""
    query = db.query(Menu).filter(Menu.deleted_at.is_(None))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Menu.name.ilike(s)) | (Menu.link.ilike(s)) | (Menu.icon.ilike(s)))

    total = query.count()

    if all_items:
        menus = query.order_by(Menu.order_no.asc()).all()
        items = [{
            "id": m.id,
            "name": m.name,
            "is_parent": m.is_parent,
            "icon": m.icon,
            "link": m.link,
            "order_no": m.order_no,
            "parent_id": m.child_menus_id,
            "created_at": to_local_iso(m.created_at),
            "updated_at": to_local_iso(m.updated_at),
        } for m in menus]
        return {"items": items, "total": total, "page": 1, "limit": total, "total_pages": 1}

    offset = (page - 1) * limit
    menus = query.order_by(Menu.order_no.asc()).offset(offset).limit(limit).all()
    total_pages = max(1, math.ceil(total / limit))

    items = [{
        "id": m.id,
        "name": m.name,
        "is_parent": m.is_parent,
        "icon": m.icon,
        "link": m.link,
        "order_no": m.order_no,
        "parent_id": m.child_menus_id,
        "created_at": to_local_iso(m.created_at),
        "updated_at": to_local_iso(m.updated_at),
    } for m in menus]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.post("", dependencies=[Depends(require_permission("/admin/menus", "create"))])
def create_menu(
    payload: MenuCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new menu item with UTC+0 timestamp."""
    max_id = db.query(func.coalesce(func.max(Menu.id), 0)).scalar()
    new_id = max_id + 1

    menu = Menu(
        id=new_id,
        name=payload.name.strip(),
        child_menus_id=payload.parent_id,
        is_parent=payload.is_parent,
        icon=payload.icon.strip() if payload.icon else None,
        link=payload.link.strip() if payload.link else None,
        order_no=payload.order_no,
        created_at=now_utc(),
        updated_at=now_utc(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)

    # Super Admin automatically gets all permissions on this new menu
    all_perms = db.query(Permission).all()
    for p in all_perms:
        db.add(RolePermission(
            user_role_id=1,
            menu_id=menu.id,
            permission_id=p.id,
            created_at=now_utc(),
            updated_at=now_utc(),
            created_by=current_user.id,
            updated_by=current_user.id
        ))
    db.commit()

    return {
        "id": menu.id,
        "name": menu.name,
        "is_parent": menu.is_parent,
        "icon": menu.icon,
        "link": menu.link,
        "order_no": menu.order_no,
        "parent_id": menu.child_menus_id,
        "created_at": to_local_iso(menu.created_at),
        "updated_at": to_local_iso(menu.updated_at),
    }


@router.put("/{menu_id}", dependencies=[Depends(require_permission("/admin/menus", "update"))])
def update_menu(
    menu_id: int,
    payload: MenuUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing menu item with UTC+0 timestamp."""
    menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")

    if payload.name is not None:
        menu.name = payload.name.strip()
    if payload.parent_id is not None:
        menu.child_menus_id = payload.parent_id if payload.parent_id > 0 else None
    if payload.is_parent is not None:
        menu.is_parent = payload.is_parent
    if payload.icon is not None:
        menu.icon = payload.icon.strip() if payload.icon else None
    if payload.link is not None:
        menu.link = payload.link.strip() if payload.link else None
    if payload.order_no is not None:
        menu.order_no = payload.order_no

    menu.updated_at = now_utc()
    menu.updated_by = current_user.id
    db.commit()
    db.refresh(menu)

    return {
        "id": menu.id,
        "name": menu.name,
        "is_parent": menu.is_parent,
        "icon": menu.icon,
        "link": menu.link,
        "order_no": menu.order_no,
        "parent_id": menu.child_menus_id,
        "created_at": to_local_iso(menu.created_at),
        "updated_at": to_local_iso(menu.updated_at),
    }


@router.delete("/{menu_id}", dependencies=[Depends(require_permission("/admin/menus", "delete"))])
def delete_menu(
    menu_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a menu item."""
    menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")

    children_count = db.query(Menu).filter(Menu.child_menus_id == menu_id, Menu.deleted_at.is_(None)).count()
    if children_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Tidak dapat menghapus menu ini karena memiliki {children_count} submenu anak."
        )

    db.delete(menu)
    db.commit()
    return {"success": True, "message": f"Menu '{menu.name}' berhasil dihapus"}
