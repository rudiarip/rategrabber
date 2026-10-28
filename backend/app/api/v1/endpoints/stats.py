import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.datetime_utils import to_local_iso
from backend.app.api.deps import require_permission
from backend.app.models.card import Card, ScanLog

router = APIRouter()

@router.get("/dashboard", dependencies=[Depends(require_permission("/admin/dashboard", "view"))])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns analytics and summary metrics for the dashboard."""
    total_cards = db.query(Card).count()
    active_cards = db.query(Card).filter(Card.is_active == True).count()
    inactive_cards = total_cards - active_cards
    
    total_scans_sum = db.query(func.coalesce(func.sum(Card.total_scans), 0)).scalar()

    # Recent scan activity
    recent_logs = (
        db.query(ScanLog, Card.code, Card.business_name)
        .join(Card, ScanLog.card_id == Card.id)
        .order_by(ScanLog.scanned_at.desc())
        .limit(10)
        .all()
    )

    recent_scans = []
    for log, code, b_name in recent_logs:
        recent_scans.append({
            "id": log.id,
            "card_code": code,
            "business_name": b_name,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "scanned_at": to_local_iso(log.scanned_at),
        })

    return {
        "total_cards": total_cards,
        "active_cards": active_cards,
        "inactive_cards": inactive_cards,
        "total_scans": total_scans_sum,
        "recent_scans": recent_scans,
    }


@router.get("/logs", dependencies=[Depends(require_permission("/admin/analytics", "view"))])
def get_paginated_scan_logs(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah data per halaman"),
    db: Session = Depends(get_db)
):
    """Returns paginated and searchable scan logs with UTC+7 conversion."""
    query = (
        db.query(ScanLog, Card.code, Card.business_name)
        .join(Card, ScanLog.card_id == Card.id)
    )

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Card.code.ilike(s)) |
            (Card.business_name.ilike(s)) |
            (ScanLog.ip_address.ilike(s)) |
            (ScanLog.user_agent.ilike(s))
        )

    total = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(ScanLog.scanned_at.desc()).offset(offset).limit(limit).all()
    total_pages = max(1, math.ceil(total / limit))

    results = []
    for log, code, b_name in logs:
        results.append({
            "id": log.id,
            "card_code": code,
            "business_name": b_name,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "scanned_at": to_local_iso(log.scanned_at),
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }
