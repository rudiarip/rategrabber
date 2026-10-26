from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class CardBase(BaseModel):
    code: str
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    place_id: Optional[str] = None
    review_url: Optional[str] = None
    is_active: bool = False

class CardResponse(CardBase):
    id: int
    batch_id: Optional[str] = None
    total_scans: int = 0
    created_at: datetime
    activated_at: Optional[datetime] = None
    qr_url: Optional[str] = None
    direct_url: Optional[str] = None

    class Config:
        from_attributes = True

class CardActivateRequest(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255)
    business_address: Optional[str] = None
    place_id: str = Field(..., min_length=3)
    pin: str = Field(..., min_length=4, max_length=20, description="PIN or password to protect settings")

class CardVerifyPinRequest(BaseModel):
    pin: str

class CardUpdateRequest(BaseModel):
    pin: str = Field(..., description="Current PIN to authorize update")
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    place_id: Optional[str] = None
    review_url: Optional[str] = None
    new_pin: Optional[str] = None

class BatchGenerateRequest(BaseModel):
    count: int = Field(default=10, ge=1, le=500, description="Number of cards to generate (max 500)")
    prefix: Optional[str] = Field(default="", max_length=6)
    batch_name: Optional[str] = None

class BatchGenerateResponse(BaseModel):
    batch_id: str
    count: int
    created_at: datetime
    cards: List[CardResponse]

class PlaceSearchResult(BaseModel):
    place_id: str
    name: str
    address: str
    review_url: str

class ScanLogResponse(BaseModel):
    id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    scanned_at: datetime

    class Config:
        from_attributes = True

class AdminOverviewResponse(BaseModel):
    total_cards: int
    active_cards: int
    inactive_cards: int
    total_scans: int
    recent_scans: List[ScanLogResponse] = []
