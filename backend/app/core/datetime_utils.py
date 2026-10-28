from datetime import datetime, timezone, timedelta
from typing import Optional

# Local Timezone Default: Asia/Jakarta (UTC+7 / WIB)
LOCAL_TZ = timezone(timedelta(hours=7))

def now_utc() -> datetime:
    """Returns the current timestamp in UTC (UTC+0)."""
    return datetime.now(timezone.utc)

def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensures a datetime is timezone-aware in UTC (UTC+0).
    If naive datetime is provided, it is assumed to be in UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def to_local_iso(dt: Optional[datetime], tz: timezone = LOCAL_TZ) -> Optional[str]:
    """Converts a UTC datetime from the database into local timezone (+07:00) ISO string."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local_dt = dt.astimezone(tz)
    return local_dt.isoformat()
