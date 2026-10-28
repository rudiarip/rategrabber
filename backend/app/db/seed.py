import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.core.config import settings
from backend.app.models.rbac import UserRole, Permission, Menu, RolePermission
from backend.app.models.user import User
from backend.app.models.card import Card, ScanLog

SYSTEM_UUID = uuid.UUID("11111111-1111-1111-1111-111111111111")

PERMISSIONS_DATA = [
    (1, "View", "view"),
    (2, "Create", "create"),
    (3, "Update", "update"),
    (4, "Delete", "delete"),
    (5, "Publish", "publish"),
    (6, "Approve", "approve"),
    (7, "Reject", "reject"),
    (8, "Close", "close"),
    (9, "Submit", "submit"),
    (10, "Terminate", "terminate"),
    (11, "Unpublish", "unpublish"),
]

ROLES_DATA = [
    (1, "Super Admin"),
    (2, "Admin"),
    (3, "Staff"),
]

MENUS_DATA = [
    {"id": 1, "parent_id": None, "name": "Dashboard", "is_parent": False, "icon": "LayoutDashboard", "link": "/admin/dashboard", "order_no": 1},
    {"id": 2, "parent_id": None, "name": "Barcode & Kartu", "is_parent": True, "icon": "QrCode", "link": None, "order_no": 2},
    {"id": 3, "parent_id": 2, "name": "Daftar Kartu", "is_parent": False, "icon": "ListFilter", "link": "/admin/cards", "order_no": 3},
    {"id": 4, "parent_id": 2, "name": "Batch Generator", "is_parent": False, "icon": "Layers", "link": "/admin/generator", "order_no": 4},
    {"id": 5, "parent_id": None, "name": "Statistik & Logs", "is_parent": False, "icon": "BarChart3", "link": "/admin/analytics", "order_no": 5},
    {"id": 6, "parent_id": None, "name": "Manajemen Akses", "is_parent": True, "icon": "ShieldCheck", "link": None, "order_no": 6},
    {"id": 7, "parent_id": 6, "name": "Pengguna", "is_parent": False, "icon": "Users", "link": "/admin/users", "order_no": 7},
    {"id": 8, "parent_id": 6, "name": "Role & Hak Akses", "is_parent": False, "icon": "KeyRound", "link": "/admin/roles", "order_no": 8},
    {"id": 9, "parent_id": 6, "name": "Menu Sistem", "is_parent": False, "icon": "Menu", "link": "/admin/menus", "order_no": 9},
    {"id": 10, "parent_id": 6, "name": "Kelola Izin", "is_parent": False, "icon": "LockKeyhole", "link": "/admin/permissions", "order_no": 10},
]

def seed_db():
    print("[INIT] Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Roles
        print("[SEED] Seeding Roles...")
        for r_id, r_name in ROLES_DATA:
            role = db.query(UserRole).filter(UserRole.id == r_id).first()
            if not role:
                db.add(UserRole(id=r_id, name=r_name))
        db.commit()

        # 2. Seed Permissions
        print("[SEED] Seeding Permissions...")
        for p_id, p_name, p_logic in PERMISSIONS_DATA:
            perm = db.query(Permission).filter(Permission.id == p_id).first()
            if not perm:
                db.add(Permission(
                    id=p_id,
                    name=p_name,
                    logic_name=p_logic,
                    created_by=SYSTEM_UUID,
                    updated_by=SYSTEM_UUID
                ))
        db.commit()

        # 3. Seed Menus
        print("[SEED] Seeding Menus...")
        for m in MENUS_DATA:
            menu = db.query(Menu).filter(Menu.id == m["id"]).first()
            if not menu:
                db.add(Menu(
                    id=m["id"],
                    child_menus_id=m["parent_id"],
                    name=m["name"],
                    is_parent=m["is_parent"],
                    icon=m["icon"],
                    link=m["link"],
                    order_no=m["order_no"],
                    created_by=SYSTEM_UUID,
                    updated_by=SYSTEM_UUID
                ))
        db.commit()

        # 4. Seed Super Admin Role Permissions (Full unrestricted access across all menus and permissions)
        print("[SEED] Seeding Super Admin (Role 1) Permissions...")
        all_menus = db.query(Menu).all()
        all_permissions = db.query(Permission).all()
        
        for m in all_menus:
            for p in all_permissions:
                exists = db.query(RolePermission).filter(
                    RolePermission.user_role_id == 1,
                    RolePermission.menu_id == m.id,
                    RolePermission.permission_id == p.id
                ).first()
                if not exists:
                    db.add(RolePermission(
                        id=uuid.uuid4(),
                        user_role_id=1,
                        menu_id=m.id,
                        permission_id=p.id,
                        created_by=SYSTEM_UUID,
                        updated_by=SYSTEM_UUID
                    ))
        db.commit()

        # 5. Seed Initial Super Admin User
        print("[SEED] Seeding Super Admin User...")
        superadmin = db.query(User).filter(
            (User.username == settings.DEFAULT_SUPERADMIN_USERNAME) | 
            (User.email == settings.DEFAULT_SUPERADMIN_EMAIL)
        ).first()

        if not superadmin:
            superadmin = User(
                id=SYSTEM_UUID,
                username=settings.DEFAULT_SUPERADMIN_USERNAME,
                email=settings.DEFAULT_SUPERADMIN_EMAIL,
                full_name="Super Administrator",
                phone="+6281234567890",
                password=get_password_hash(settings.DEFAULT_SUPERADMIN_PASSWORD),
                role_id=1,  # Super Admin
                is_active=True,
                created_by=SYSTEM_UUID,
                updated_by=SYSTEM_UUID
            )
            db.add(superadmin)
            db.commit()
            print(f"[OK] Super Admin user created: {settings.DEFAULT_SUPERADMIN_USERNAME} / {settings.DEFAULT_SUPERADMIN_PASSWORD}")
        else:
            if not superadmin.full_name:
                superadmin.full_name = "Super Administrator"
            if not superadmin.phone:
                superadmin.phone = "+6281234567890"
            db.commit()
            print(f"[INFO] Super Admin user already exists: {superadmin.username}")

        print("[SUCCESS] Database seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
