from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, menus, cards, roles, users, stats, places, permissions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(menus.router, prefix="/menus", tags=["Menus & Navigation"])
api_router.include_router(cards.router, prefix="/cards", tags=["Cards & Generator"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles & RBAC"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions CRUD"])
api_router.include_router(users.router, prefix="/users", tags=["Users Management"])
api_router.include_router(stats.router, prefix="/stats", tags=["Dashboard & Analytics"])
api_router.include_router(places.router, prefix="/places", tags=["Google Places"])
