"""
Campus Recover — Admin API Schemas (Phase 11)

Data contracts for the Campus Recover administrator console:
- High-level KPIs and analytics
- Time-series and categorical chart telemetry
- User administration & suspension
- Report lifecycle moderation & deletion
- Claim oversight & review
- Campus location configuration
- Suspicious activity detection & mitigation
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import UserRole, ItemType, ItemStatus, ItemCategory, ClaimStatus


# --- 1. Overview KPIs & Stats ---

class AdminOverviewStats(BaseModel):
    """Core executive metrics for the administrative dashboard."""
    total_users: int = Field(..., description="Total registered accounts (students, staff, admins)")
    total_lost_reports: int = Field(..., description="All items reported as LOST")
    total_found_reports: int = Field(..., description="All items reported as FOUND")
    total_recovered_items: int = Field(..., description="Items marked as physically RECOVERED")
    recovery_rate: float = Field(..., description="Percentage of lost items recovered")
    pending_claims: int = Field(..., description="Active claims awaiting verification or approval")
    suspicious_reports: int = Field(..., description="Total items or activities flagged as suspicious")

    model_config = ConfigDict(from_attributes=True)


# --- 2. Chart Telemetry Schemas ---

class ChartDataReportOverTime(BaseModel):
    """Daily reports volume split by report type."""
    date: str
    lost: int
    found: int
    total: int


class ChartDataCategory(BaseModel):
    """Volume of reports across categories."""
    category: str
    lost: int
    found: int
    total: int


class ChartDataLocation(BaseModel):
    """Geographic distribution across campus landmarks."""
    location_name: str
    lost: int
    found: int
    total: int


class ChartDataRecoveryBreakdown(BaseModel):
    """Item resolution lifecycle breakdown."""
    status: str
    count: int
    color: Optional[str] = None


class AdminChartsData(BaseModel):
    """Consolidated chart payloads for Recharts visualization."""
    lost_vs_found: Dict[str, Any]
    reports_over_time: List[ChartDataReportOverTime]
    categories: List[ChartDataCategory]
    campus_locations: List[ChartDataLocation]
    recovery_breakdown: List[ChartDataRecoveryBreakdown]
    overall_recovery_rate: float


# --- 3. User Administration ---

class AdminUserSummary(BaseModel):
    """User representation for admin user management."""
    id: uuid.UUID
    name: str
    email: str
    role: UserRole
    student_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    items_count: int = 0
    claims_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserStatusUpdate(BaseModel):
    """Payload to toggle user suspension or activate account."""
    is_active: bool
    reason: Optional[str] = None


# --- 4. Report Moderation ---

class AdminReportSummary(BaseModel):
    """Item representation for admin reports catalog."""
    id: uuid.UUID
    type: ItemType
    title: str
    description: str
    category: ItemCategory
    status: ItemStatus
    location_name: Optional[str] = None
    campus_location_name: Optional[str] = None
    campus_location_id: Optional[uuid.UUID] = None
    image_url: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    date_time: datetime
    created_at: datetime
    claims_count: int = 0
    matches_count: int = 0
    is_suspicious: bool = False
    suspicious_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- 5. Claims Administration ---

class AdminClaimSummary(BaseModel):
    """Full claim record for admin dispute mediation."""
    id: uuid.UUID
    item_id: uuid.UUID
    item_title: str
    item_type: ItemType
    item_category: ItemCategory
    claimant_id: uuid.UUID
    claimant_name: str
    claimant_email: str
    finder_id: Optional[uuid.UUID] = None
    finder_name: Optional[str] = None
    finder_email: Optional[str] = None
    verification_question: Optional[str] = None
    submitted_answer: str
    status: ClaimStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- 6. Campus Location Management ---

class AdminLocationCreate(BaseModel):
    """Payload for creating a new campus landmark."""
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    building: Optional[str] = None
    floor: Optional[str] = None
    is_active: bool = True


class AdminLocationUpdate(BaseModel):
    """Payload for modifying an existing campus landmark."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    building: Optional[str] = None
    floor: Optional[str] = None
    is_active: Optional[bool] = None


class AdminLocationSummary(BaseModel):
    """Campus location with attached item count."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    building: Optional[str] = None
    floor: Optional[str] = None
    is_active: bool
    created_at: datetime
    items_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- 7. Suspicious Activity Review ---

class AdminSuspiciousItem(BaseModel):
    """Suspicious item report or claimant profile flagged for review."""
    id: str
    item_id: Optional[uuid.UUID] = None
    item_title: Optional[str] = None
    item_type: Optional[ItemType] = None
    item_category: Optional[ItemCategory] = None
    user_id: Optional[uuid.UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    reason: str
    severity: str = "MEDIUM"  # "HIGH", "MEDIUM", "LOW"
    created_at: datetime
    details: Dict[str, Any] = Field(default_factory=dict)
