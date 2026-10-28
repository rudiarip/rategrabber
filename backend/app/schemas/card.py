from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CardBase(BaseModel):
    code: str
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    place_id: Optional[str] = None
    review_url: Optional[str] = None

class CardCreate(BaseModel):
    custom_code: Optional[str] = Field(None, min_length=4, max_length=32)
    batch_id: Optional[str] = None

class CardBatchCreate(BaseModel):
    count: int = Field(..., ge=1, le=500, description="Jumlah kartu yang ingin digenerate (1 - 500)")
    batch_name: Optional[str] = None

class CardActivate(BaseModel):
    code: str
    business_name: str
    business_address: Optional[str] = ""
    place_id: str
    review_url: Optional[str] = None
    admin_pin: str

class CardUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    place_id: Optional[str] = None
    review_url: Optional[str] = None
    new_pin: Optional[str] = None
    current_pin: Optional[str] = None

class CardOut(BaseModel):
    id: int
    code: str
    batch_id: Optional[str] = None
    is_active: bool
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    place_id: Optional[str] = None
    review_url: Optional[str] = None
    total_scans: int
    created_at: datetime
    activated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    qr_svg_url: str = ""
    qr_png_url: str = ""
    target_scan_url: str = ""

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_cards: int
    active_cards: int
    inactive_cards: int
    total_scans: int
    recent_scans: List[dict] = []
