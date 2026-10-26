import random
import string
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Card, ScanLog
from backend.schemas import (
    CardResponse,
    BatchGenerateRequest,
    BatchGenerateResponse,
    AdminOverviewResponse,
    ScanLogResponse,
)
from backend.config import settings
from backend.services.qr_generator import generate_batch_zip

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

def generate_unique_code(existing_codes: set, length: int = 6, prefix: str = "") -> str:
    """Generates an unambiguous uppercase alphanumeric code (omitting confusing chars like 0/O, 1/I)."""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    needed_len = max(2, length - len(prefix))
    for _ in range(100):
        code = prefix + "".join(random.choices(chars, k=needed_len))
        if code not in existing_codes:
            existing_codes.add(code)
            return code
    # Fallback to UUID segment
    return prefix + uuid.uuid4().hex[:6].upper()

@router.get("/overview", response_model=AdminOverviewResponse)
async def get_overview_stats(db: Session = Depends(get_db)):
    """Fetch high-level statistics for Admin Dashboard."""
    total_cards = db.query(Card).count()
    active_cards = db.query(Card).filter(Card.is_active == True).count()
    inactive_cards = total_cards - active_cards
    
    # Calculate sum of scans
    total_scans = db.query(ScanLog).count()
    
    # Latest 10 scan logs
    recent_logs = (
        db.query(ScanLog)
        .order_by(desc(ScanLog.scanned_at))
        .limit(10)
        .all()
    )

    return AdminOverviewResponse(
        total_cards=total_cards,
        active_cards=active_cards,
        inactive_cards=inactive_cards,
        total_scans=total_scans,
        recent_scans=[ScanLogResponse.model_validate(log) for log in recent_logs]
    )


@router.get("/cards")
async def list_cards(
    status: Optional[str] = Query(None, description="'active', 'inactive', or empty for all"),
    search: Optional[str] = Query(None, description="Search by code or business name"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """List generated cards with filters and pagination."""
    query = db.query(Card)

    if status == "active":
        query = query.filter(Card.is_active == True)
    elif status == "inactive":
        query = query.filter(Card.is_active == False)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Card.code.ilike(search_term)) | 
            (Card.business_name.ilike(search_term)) |
            (Card.batch_id.ilike(search_term))
        )

    total_count = query.count()
    cards = (
        query.order_by(desc(Card.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    card_items = []
    for c in cards:
        item = CardResponse.model_validate(c)
        item.qr_url = f"{settings.BASE_URL}/api/cards/{c.code}/qr"
        item.direct_url = f"{settings.BASE_URL}/c/{c.code}"
        card_items.append(item)

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "cards": card_items
    }


@router.post("/cards/generate", response_model=BatchGenerateResponse)
async def generate_card_batch(
    payload: BatchGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Mass generate blank unactivated cards with unique codes and dynamic URLs.
    """
    batch_id = payload.batch_name.strip() if payload.batch_name else f"BATCH-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    
    # Pre-fetch existing codes to prevent collision
    all_codes = set(code[0] for code in db.query(Card.code).all())
    
    new_cards = []
    now = datetime.utcnow()
    clean_prefix = payload.prefix.strip().upper()

    for _ in range(payload.count):
        code = generate_unique_code(all_codes, length=6, prefix=clean_prefix)
        card = Card(
            code=code,
            batch_id=batch_id,
            is_active=False,
            total_scans=0,
            created_at=now,
            updated_at=now
        )
        new_cards.append(card)

    db.add_all(new_cards)
    db.commit()

    card_responses = []
    for c in new_cards:
        db.refresh(c)
        item = CardResponse.model_validate(c)
        item.qr_url = f"{settings.BASE_URL}/api/cards/{c.code}/qr"
        item.direct_url = f"{settings.BASE_URL}/c/{c.code}"
        card_responses.append(item)

    return BatchGenerateResponse(
        batch_id=batch_id,
        count=len(new_cards),
        created_at=now,
        cards=card_responses
    )


@router.get("/cards/download-batch/{batch_id}")
async def download_batch_zip(batch_id: str, db: Session = Depends(get_db)):
    """
    Download ZIP containing high-res PNG/SVG QR codes and NFC encoding CSV.
    """
    cards = db.query(Card).filter(Card.batch_id == batch_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' tidak ditemukan")

    cards_data = [
        {"code": c.code, "batch_id": c.batch_id}
        for c in cards
    ]
    
    zip_bytes = generate_batch_zip(cards_data)
    
    filename = f"qrcodes_{batch_id}.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/cards/{card_id}/reset")
async def reset_card(card_id: int, db: Session = Depends(get_db)):
    """Reset an activated card back to unactivated blank state."""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")

    card.is_active = False
    card.business_name = None
    card.business_address = None
    card.place_id = None
    card.review_url = None
    card.pin_hash = None
    card.activated_at = None
    card.updated_at = datetime.utcnow()
    db.commit()

    return {"status": "success", "message": f"Kartu {card.code} telah direset ke status unactivated"}


@router.delete("/cards/{card_id}")
async def delete_card(card_id: int, db: Session = Depends(get_db)):
    """Permanently delete a card."""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")

    code = card.code
    db.delete(card)
    db.commit()

    return {"status": "success", "message": f"Kartu {code} berhasil dihapus"}
