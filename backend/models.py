from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    batch_id = Column(String(64), index=True, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    business_name = Column(String(255), nullable=True)
    business_address = Column(String(500), nullable=True)
    place_id = Column(String(255), nullable=True)
    review_url = Column(Text, nullable=True)
    pin_hash = Column(String(255), nullable=True)
    total_scans = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    activated_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scan_logs = relationship("ScanLog", back_populates="card", cascade="all, delete-orphan")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False, index=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)
    scanned_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    card = relationship("Card", back_populates="scan_logs")
