from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base
from backend.routes import cards, places, admin

# Create tables if not present
Base.metadata.create_all(bind=engine)

# Auto-seed initial demo cards if DB is empty
def init_db():
    from backend.database import SessionLocal
    from backend.models import Card
    from datetime import datetime
    db = SessionLocal()
    try:
        if not db.query(Card).filter(Card.code == "MMHBWS").first():
            db.add(Card(
                code="MMHBWS",
                batch_id="BATCH-DEMO-01",
                is_active=False,
                total_scans=0,
                created_at=datetime.utcnow()
            ))
            db.commit()
    except Exception as e:
        print(f"[Init DB Notice] {e}")
    finally:
        db.close()

init_db()

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API untuk Sistem Smart NFC & QR Google Review Card dengan Auto-Aktivasi",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev & production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(cards.router)
app.include_router(places.router)
app.include_router(admin.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "places_mode": "live" if settings.GOOGLE_PLACES_API_KEY else "demo",
        "base_url": settings.BASE_URL,
        "frontend_url": settings.FRONTEND_URL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
