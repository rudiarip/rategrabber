from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Card, ScanLog
from backend.schemas import (
    CardResponse,
    CardActivateRequest,
    CardVerifyPinRequest,
    CardUpdateRequest,
)
from backend.config import settings
from backend.services.security import hash_pin, verify_pin
from backend.services.qr_generator import generate_qr_bytes
from backend.services.places_service import build_review_url

router = APIRouter(tags=["Cards"])

def log_scan_event(card_id: int, ip: str, user_agent: str, referrer: str):
    """Background task to record scan without delaying redirect response."""
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        card = db.query(Card).filter(Card.id == card_id).first()
        if card:
            card.total_scans += 1
            log = ScanLog(
                card_id=card_id,
                ip_address=ip[:64] if ip else None,
                user_agent=user_agent[:500] if user_agent else None,
                referrer=referrer[:500] if referrer else None,
                scanned_at=datetime.utcnow()
            )
            db.add(log)
            db.commit()
    except Exception as e:
        print(f"[ScanLog Error] {e}")
        db.rollback()
    finally:
        db.close()

@router.api_route("/c/{code}", methods=["GET", "HEAD"])
async def handle_card_scan(
    code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    CORE SMART ROUTING:
    - 1st Scan (Unactivated): Redirects buyer to /activate/{code} on frontend.
    - Subsequent Scans (Activated): Fast HTTP 302 redirect directly to Google Reviews!
    """
    card = db.query(Card).filter(Card.code == code.upper()).first()
    
    if not card:
        # Card code not found in system
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/not-found?code={code.upper()}",
            status_code=302
        )

    if not card.is_active:
        # Card not yet activated -> Send to React Activation page
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/activate/{card.code}",
            status_code=302
        )

    # Card is activated -> Background log & instant redirect to Google Review form!
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    referrer = request.headers.get("referer", "")
    
    background_tasks.add_task(log_scan_event, card.id, client_ip, user_agent, referrer)
    
    destination = card.review_url or f"https://search.google.com/local/writereview?placeid={card.place_id}"
    return RedirectResponse(url=destination, status_code=302)


@router.get("/api/cards/{code}", response_model=CardResponse)
async def get_card_info(code: str, db: Session = Depends(get_db)):
    """Fetch card details for activation or management screen."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")
    
    res = CardResponse.model_validate(card)
    res.qr_url = f"{settings.BASE_URL}/api/cards/{card.code}/qr"
    res.direct_url = f"{settings.BASE_URL}/c/{card.code}"
    return res


@router.get("/api/cards/{code}/qr")
async def get_card_qr(code: str, db: Session = Depends(get_db)):
    """Returns dynamic QR Code image PNG for a card."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")
    
    card_url = f"{settings.BASE_URL}/c/{card.code}"
    png_bytes = generate_qr_bytes(card_url, format="png", scale=10)
    return Response(content=png_bytes, media_type="image/png")


@router.post("/api/cards/{code}/activate")
async def activate_card(
    code: str,
    payload: CardActivateRequest,
    db: Session = Depends(get_db)
):
    """
    Activates the card with business info and owner security PIN.
    """
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")
    
    if card.is_active:
        raise HTTPException(status_code=400, detail="Kartu ini sudah diaktifkan sebelumnya")

    review_url = build_review_url(payload.place_id)
    hashed = hash_pin(payload.pin)

    card.business_name = payload.business_name
    card.business_address = payload.business_address
    card.place_id = payload.place_id
    card.review_url = review_url
    card.pin_hash = hashed
    card.is_active = True
    card.activated_at = datetime.utcnow()
    card.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(card)

    return {
        "status": "success",
        "message": f"Kartu {card.code} berhasil diaktifkan untuk {card.business_name}",
        "review_url": card.review_url
    }


@router.post("/api/cards/{code}/verify-pin")
async def verify_card_pin(
    code: str,
    payload: CardVerifyPinRequest,
    db: Session = Depends(get_db)
):
    """Verifies owner PIN to access management dashboard."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")
    
    if not card.is_active or not card.pin_hash:
        raise HTTPException(status_code=400, detail="Kartu belum aktif atau belum memiliki PIN")

    if not verify_pin(payload.pin, card.pin_hash):
        raise HTTPException(status_code=401, detail="PIN salah. Silakan coba lagi.")

    return {"status": "success", "message": "PIN valid"}


@router.put("/api/cards/{code}/update")
async def update_card(
    code: str,
    payload: CardUpdateRequest,
    db: Session = Depends(get_db)
):
    """Updates card business info or PIN if correct existing PIN is provided."""
    card = db.query(Card).filter(Card.code == code.upper()).first()
    if not card:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")
    
    if not verify_pin(payload.pin, card.pin_hash):
        raise HTTPException(status_code=401, detail="PIN otorisasi tidak valid")

    if payload.business_name:
        card.business_name = payload.business_name
    if payload.business_address is not None:
        card.business_address = payload.business_address
    if payload.place_id:
        card.place_id = payload.place_id
        card.review_url = build_review_url(payload.place_id)
    if payload.review_url:
        card.review_url = payload.review_url
    if payload.new_pin:
        card.pin_hash = hash_pin(payload.new_pin)

    card.updated_at = datetime.utcnow()
    db.commit()

    return {"status": "success", "message": "Informasi kartu berhasil diperbarui"}
