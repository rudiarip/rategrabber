from fastapi import APIRouter, Query
from backend.app.services.places_service import search_places

router = APIRouter()

@router.get("/search")
async def search_google_places(q: str = Query(..., min_length=2, description="Nama bisnis / tempat")):
    """Searches real business places from Google Places."""
    return await search_places(q)
