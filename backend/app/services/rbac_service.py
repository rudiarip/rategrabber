from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.rbac import Menu, Permission, RolePermission, UserRole
from backend.app.models.user import User

def check_user_permission(
    db: Session,
    user: User,
    menu_link: Optional[str] = None,
    permission_logic_name: str = "view"
) -> bool:
    """Checks if a user's role has permission for a specific menu and action.
    Role 1 (Super Admin) always has unrestricted full access!
    """
    if not user or not user.is_active:
        return False

    # Super Admin bypass
    if user.role_id == 1:
        return True

    if not menu_link:
        return True

    # Check database role permissions
    has_perm = (
        db.query(RolePermission)
        .join(Menu, RolePermission.menu_id == Menu.id)
        .join(Permission, RolePermission.permission_id == Permission.id)
        .filter(
            RolePermission.user_role_id == user.role_id,
            Menu.link == menu_link,
            Permission.logic_name == permission_logic_name
        )
        .first()
    )
    return has_perm is not None


def get_user_navigation(db: Session, user: User) -> List[Dict[str, Any]]:
    """Builds the authorized hierarchical navigation tree for the user.
    Only menus where the user has 'view' permission are shown.
    Each item includes all permissions the user holds on that menu.
    """
    is_superadmin = (user.role_id == 1)

    # 1. Fetch role permission mappings: menu_id -> set of permission logic_names
    menu_perms_map: Dict[int, List[str]] = {}
    
    if is_superadmin:
        all_perms = [p.logic_name for p in db.query(Permission).all()]
        all_menus = db.query(Menu).order_no = db.query(Menu).order_by(Menu.order_no.asc()).all()
        for m in all_menus:
            menu_perms_map[m.id] = all_perms
    else:
        role_perms = (
            db.query(RolePermission.menu_id, Permission.logic_name)
            .join(Permission, RolePermission.permission_id == Permission.id)
            .filter(RolePermission.user_role_id == user.role_id)
            .all()
        )
        for m_id, p_logic in role_perms:
            if m_id not in menu_perms_map:
                menu_perms_map[m_id] = []
            menu_perms_map[m_id].append(p_logic)

    # 2. Get all menus sorted by order_no
    all_menus = db.query(Menu).order_by(Menu.order_no.asc()).all()

    # 3. Filter menus: user must have 'view' permission or be a parent with authorized children
    authorized_menu_ids = set()
    for m in all_menus:
        perms = menu_perms_map.get(m.id, [])
        if "view" in perms or is_superadmin:
            authorized_menu_ids.add(m.id)

    # Add parent menu if any child is authorized
    for m in all_menus:
        if m.child_menus_id in authorized_menu_ids:
            authorized_menu_ids.add(m.child_menus_id)

    # 4. Construct tree
    top_level = []
    children_map: Dict[int, List[Dict[str, Any]]] = {}

    for m in all_menus:
        if m.id not in authorized_menu_ids:
            continue

        item = {
            "id": m.id,
            "parent_id": m.child_menus_id,
            "name": m.name,
            "is_parent": m.is_parent,
            "icon": m.icon,
            "link": m.link,
            "order_no": m.order_no,
            "permissions": menu_perms_map.get(m.id, []),
            "children": []
        }

        if m.child_menus_id:
            if m.child_menus_id not in children_map:
                children_map[m.child_menus_id] = []
            children_map[m.child_menus_id].append(item)
        else:
            top_level.append(item)

    # Attach children to parents
    for parent in top_level:
        if parent["id"] in children_map:
            parent["children"] = children_map[parent["id"]]

    return top_level
