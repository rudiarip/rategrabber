import httpx
from typing import List, Dict, Any
from backend.app.core.config import settings

def build_review_url(place_id: str) -> str:
    """Builds the direct Google Maps 5-star review modal URL."""
    return f"https://search.google.com/local/writereview?placeid={place_id}"

async def search_places(query: str) -> Dict[str, Any]:
    """Searches real business places via Google Places API (New & Legacy).
    Returns only genuine Google Maps places.
    """
    clean_query = query.strip()
    if not clean_query:
        return {"mode": "live", "results": []}

    api_key = (settings.GOOGLE_PLACES_API_KEY or "").strip()
    if not api_key:
        return {
            "mode": "live",
            "results": [],
            "error": "GOOGLE_PLACES_API_KEY belum dikonfigurasi di file .env."
        }

    # 1. Primary: Google Places API (New) Text Search
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress"
            }
            payload = {
                "textQuery": clean_query,
                "languageCode": "id"
            }
            resp = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers=headers,
                json=payload
            )
            data = resp.json()

            if resp.status_code == 200:
                results = []
                for p in data.get("places", [])[:10]:
                    pid = p.get("id")
                    if not pid:
                        continue
                    name = p.get("displayName", {}).get("text", "")
                    addr = p.get("formattedAddress", "")
                    results.append({
                        "place_id": pid,
                        "name": name,
                        "address": addr,
                        "review_url": build_review_url(pid)
                    })
                return {"mode": "live", "results": results}
    except Exception as e:
        print(f"[Places API New Exception] {e}")

    # 2. Secondary fallback: Legacy Places Text Search
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {
                "query": clean_query,
                "key": api_key,
                "language": "id"
            }
            resp = await client.get(url, params=params)
            data = resp.json()
            if data.get("status") in ["OK", "ZERO_RESULTS"]:
                results = []
                for item in data.get("results", [])[:10]:
                    pid = item.get("place_id")
                    results.append({
                        "place_id": pid,
                        "name": item.get("name"),
                        "address": item.get("formatted_address", ""),
                        "review_url": build_review_url(pid)
                    })
                return {"mode": "live", "results": results}
    except Exception as e:
        print(f"[Places API Legacy Exception] {e}")

    return {"mode": "live", "results": []}
