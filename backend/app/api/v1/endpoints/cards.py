import secrets
import string
import math
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash, verify_password
from backend.app.core.datetime_utils import now_utc, to_utc, to_local_iso
from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User
from backend.app.models.card import Card, ScanLog
from backend.app.schemas.card import CardCreate, CardBatchCreate, CardActivate, CardUpdate, CardOut
from backend.app.services.qr_generator import generate_qr_bytes, generate_batch_zip
from backend.app.services.places_service import build_review_url

router = APIRouter()

def generate_random_code(length: int = 6) -> str:
    """Generates an uppercase alphanumeric code."""
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('0', '').replace('O', '').replace('1', '').replace('I', '')
    return ''.join(secrets.choice(chars) for _ in range(length))

def format_card_response(card: Card) -> dict:
    return {
        "id": card.id,
        "code": card.code,
        "batch_id": card.batch_id,
        "is_active": card.is_active,
        "business_name": card.business_name,
        "business_address": card.business_address,
        "place_id": card.place_id,
        "review_url": card.review_url,
        "total_scans": card.total_scans,
        "created_at": to_local_iso(card.created_at),
        "activated_at": to_local_iso(card.activated_at),
        "updated_at": to_local_iso(card.updated_at),
        "qr_svg_url": f"{settings.BASE_URL}/api/v1/cards/{card.code}/qr/svg",
        "qr_png_url": f"{settings.BASE_URL}/api/v1/cards/{card.code}/qr/png",
        "target_scan_url": f"{settings.BASE_URL}/c/{card.code}",
    }


# ==========================================
# PUBLIC ENDPOINTS (No Auth Required)
# ==========================================

@router.get("/{code}/qr/{format}")
def get_card_qr(code: str, format: str = "png", db: Session = Depends(get_db)):
    """Serves the generated QR Code image directly in PNG or SVG format."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")

    scan_url = f"{settings.BASE_URL}/c/{card.code}"
    fmt = format.lower()
    if fmt == "svg":
        media_type = "image/svg+xml"
        qr_bytes = generate_qr_bytes(scan_url, format="svg", scale=10)
    else:
        media_type = "image/png"
        qr_bytes = generate_qr_bytes(scan_url, format="png", scale=12)

    return Response(content=qr_bytes, media_type=media_type)


@router.get("/public/{code}")
def get_public_card_info(code: str, db: Session = Depends(get_db)):
    """Returns public info about card activation state."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")

    return {
        "code": card.code,
        "is_active": card.is_active,
        "business_name": card.business_name if card.is_active else None,
        "business_address": card.business_address if card.is_active else None,
        "activated_at": to_local_iso(card.activated_at) if card.is_active else None,
    }


@router.post("/activate")
def activate_card(payload: CardActivate, db: Session = Depends(get_db)):
    """Public customer self-activation endpoint. Stores timestamp in UTC (UTC+0)."""
    card = db.query(Card).filter(Card.code == payload.code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kode kartu tidak terdaftar di sistem TapStar")

    if card.is_active:
        raise HTTPException(
            status_code=400,
            detail="Kartu ini sudah aktif sebelumnya. Jika ingin mengubah lokasi, gunakan PIN pengaman di menu update."
        )

    if len(payload.admin_pin.strip()) < 4:
        raise HTTPException(status_code=400, detail="PIN pengaman minimal 4 digit angka")

    rev_url = payload.review_url or build_review_url(payload.place_id)

    card.is_active = True
    card.business_name = payload.business_name.strip()
    card.business_address = (payload.business_address or "").strip()
    card.place_id = payload.place_id.strip()
    card.review_url = rev_url
    card.pin_hash = get_password_hash(payload.admin_pin.strip())
    # Always store in UTC (UTC+0)
    card.activated_at = now_utc()
    card.updated_at = now_utc()

    db.commit()
    db.refresh(card)

    return {
        "success": True,
        "message": f"Kartu {card.code} berhasil diaktifkan untuk {card.business_name}!",
        "card": format_card_response(card)
    }


# ==========================================
# PROTECTED ADMIN ENDPOINTS (RBAC Guarded)
# ==========================================

@router.get("", dependencies=[Depends(require_permission("/admin/cards", "view"))])
def list_cards(
    search: Optional[str] = None,
    batch_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1, description="Halaman saat ini"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah data per halaman"),
    db: Session = Depends(get_db)
):
    """Lists cards with lightweight server-side pagination, search, and filtering."""
    query = db.query(Card)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Card.code.ilike(s)) | (Card.business_name.ilike(s)) | (Card.batch_id.ilike(s)))

    if batch_id:
        query = query.filter(Card.batch_id == batch_id)

    if status_filter == "active":
        query = query.filter(Card.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(Card.is_active == False)

    total = query.count()
    offset = (page - 1) * limit
    cards = query.order_by(Card.created_at.desc()).offset(offset).limit(limit).all()
    total_pages = max(1, math.ceil(total / limit))

    formatted_items = [format_card_response(c) for c in cards]

    return {
        "items": formatted_items,
        "cards": formatted_items,  # backward compatibility
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.post("", dependencies=[Depends(require_permission("/admin/cards", "create"))])
def create_single_card(payload: CardCreate, db: Session = Depends(get_db)):
    """Creates a single new card."""
    code = (payload.custom_code or generate_random_code()).upper()
    existing = db.query(Card).filter(Card.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Kode {code} sudah digunakan")

    card = Card(
        code=code,
        batch_id=payload.batch_id or "MANUAL",
        is_active=False,
        created_at=now_utc(),
        updated_at=now_utc()
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return format_card_response(card)


@router.post("/batch", dependencies=[Depends(require_permission("/admin/generator", "create"))])
def generate_batch(payload: CardBatchCreate, db: Session = Depends(get_db)):
    """Generates a batch of new unactivated cards."""
    count = payload.count
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_name = payload.batch_name.strip() if payload.batch_name else f"BATCH_{timestamp}"

    new_cards = []
    generated_codes = set()

    existing_codes = set(c[0] for c in db.query(Card.code).all())

    curr_time = now_utc()
    for _ in range(count):
        while True:
            code = generate_random_code(6)
            if code not in existing_codes and code not in generated_codes:
                generated_codes.add(code)
                break

        card = Card(
            code=code,
            batch_id=batch_name,
            is_active=False,
            created_at=curr_time,
            updated_at=curr_time
        )
        db.add(card)
        new_cards.append(card)

    db.commit()

    return {
        "success": True,
        "batch_id": batch_name,
        "total_generated": len(new_cards),
        "download_zip_url": f"{settings.BASE_URL}/api/v1/cards/batch/{batch_name}/zip",
    }


@router.get("/batch/{batch_id}/zip", dependencies=[Depends(require_permission("/admin/generator", "view"))])
def download_batch_zip(batch_id: str, db: Session = Depends(get_db)):
    """Downloads ZIP package containing high-res PNG, vector SVG, and NFC encoding CSV for the batch."""
    cards = db.query(Card).filter(Card.batch_id == batch_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail="Batch tidak ditemukan")

    card_dicts = [{"code": c.code, "batch_id": c.batch_id} for c in cards]
    zip_bytes = generate_batch_zip(card_dicts)

    filename = f"TapStar_{batch_id}.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.put("/{code}", dependencies=[Depends(require_permission("/admin/cards", "update"))])
def update_card(code: str, payload: CardUpdate, db: Session = Depends(get_db)):
    """Updates card details or resets PIN."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")

    if payload.business_name is not None:
        card.business_name = payload.business_name
    if payload.business_address is not None:
        card.business_address = payload.business_address
    if payload.place_id is not None:
        card.place_id = payload.place_id
    if payload.review_url is not None:
        card.review_url = payload.review_url
    if payload.new_pin:
        card.pin_hash = get_password_hash(payload.new_pin.strip())

    card.updated_at = now_utc()
    db.commit()
    db.refresh(card)
    return format_card_response(card)


@router.delete("/{code}", dependencies=[Depends(require_permission("/admin/cards", "delete"))])
def delete_card(code: str, db: Session = Depends(get_db)):
    """Deletes a card and its scan logs."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")

    db.delete(card)
    db.commit()
    return {"success": True, "message": f"Kartu {code} berhasil dihapus"}
