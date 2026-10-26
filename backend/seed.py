from datetime import datetime
from backend.database import SessionLocal, engine, Base
from backend.models import Card

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if MMHBWS already exists
        existing = db.query(Card).filter(Card.code == "MMHBWS").first()
        if not existing:
            card = Card(
                code="MMHBWS",
                batch_id="BATCH-DEMO-01",
                is_active=False,
                total_scans=0,
                created_at=datetime.utcnow()
            )
            db.add(card)
            db.commit()
            print("Successfully seeded card: MMHBWS (Unactivated)")
        else:
            print("Card MMHBWS already exists.")

        # Also seed another sample card that is already activated to test direct review redirect
        existing_active = db.query(Card).filter(Card.code == "KAFE01").first()
        if not existing_active:
            active_card = Card(
                code="KAFE01",
                batch_id="BATCH-DEMO-01",
                is_active=True,
                business_name="Kopi Kenangan - Grand Indonesia",
                business_address="Grand Indonesia West Mall Lt. LG, Jakarta Pusat",
                place_id="ChIJd_SAMPLE_KENANGAN_03",
                review_url="https://search.google.com/local/writereview?placeid=ChIJd_SAMPLE_KENANGAN_03",
                total_scans=12,
                created_at=datetime.utcnow(),
                activated_at=datetime.utcnow()
            )
            db.add(active_card)
            db.commit()
            print("Successfully seeded card: KAFE01 (Active)")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
