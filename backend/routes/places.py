from fastapi import APIRouter, Query
from backend.services.places_service import search_places

router = APIRouter(prefix="/api/places", tags=["Google Places"])

@router.get("/search")
async def search_google_places(
    q: str = Query(..., min_length=1, description="Business name or address to search")
):
    """
    Search business places via Google Places API (or instant interactive demo fallback).
    """
    return await search_places(q)
