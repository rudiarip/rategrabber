from datetime import datetime, timezone
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.datetime_utils import now_utc
from backend.app.core.database import engine, Base, get_db
from backend.app.models.card import Card, ScanLog
from backend.app.api.v1.api import api_router
from backend.app.db.seed import seed_db

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistem Kartu Pintar Google Review NFC & QR Code dengan RBAC, JWT, dan Auto-Aktivasi Dinamis"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure schema and initial seed
@app.on_event("startup")
def on_startup():
    try:
        print("⚡ Checking & initializing database schema...")
        Base.metadata.create_all(bind=engine)
        seed_db()
    except Exception as e:
        print(f"⚠️ Startup database init warning: {e}")

# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==============================================================================
# FAST 302 SMART REDIRECT ROUTE (/c/{code})
# This is the URL encoded into physical NFC chips and printed on QR codes.
# ==============================================================================
@app.get("/c/{code}")
def smart_redirect(code: str, request: Request, db: Session = Depends(get_db)):
    """Fast HTTP 302 redirect:
    - If unactivated: Redirects customer to activation portal
    - If activated: Logs scan in background and redirects immediately to Google Review modal
    """
    clean_code = code.strip().upper()
    card = db.query(Card).filter(Card.code == clean_code).first()

    if not card:
        raise HTTPException(
            status_code=404,
            detail=f"Kartu TapStar dengan kode '{clean_code}' tidak ditemukan di sistem."
        )

    # 1. First-time scan (unactivated) -> Go to Activation View
    if not card.is_active:
        activation_url = f"{settings.FRONTEND_URL}/activate/{card.code}"
        return RedirectResponse(url=activation_url, status_code=302)

    # 2. Subsequent scans (activated) -> Log scan & direct to Google 5-star review page
    try:
        # Client IP (detecting proxy / reverse proxy headers)
        client_ip = request.headers.get("X-Forwarded-For") or (request.client.host if request.client else None)
        if client_ip and "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

        user_agent = request.headers.get("User-Agent", "")[:500]
        referrer = request.headers.get("Referer", "")[:500]

        log_entry = ScanLog(
            card_id=card.id,
            ip_address=client_ip,
            user_agent=user_agent,
            referrer=referrer,
            scanned_at=now_utc(),
        )
        db.add(log_entry)
        card.total_scans = (card.total_scans or 0) + 1
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Scan Log Error] {e}")

    # Fallback review URL if none set
    target_url = card.review_url or f"{settings.FRONTEND_URL}/activate/{card.code}"
    return RedirectResponse(url=target_url, status_code=302)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
