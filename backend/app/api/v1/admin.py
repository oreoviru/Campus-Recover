"""
Campus Recover — Admin API Routes (Phase 11)

Strictly role-protected endpoints for the campus administration console:
- High-level KPIs and recovery rates
- Multi-modal analytics charts telemetry
- User administration and account suspension
- Item reports catalog and deletion
- Centralized claims moderation
- Campus locations management
- Suspicious activity detection and manual overrides
"""

import math
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.models.enums import UserRole, ItemType, ItemStatus, ItemCategory, ClaimStatus
from app.schemas.admin import (
    AdminOverviewStats,
    AdminChartsData,
    AdminUserSummary,
    AdminUserStatusUpdate,
    AdminReportSummary,
    AdminClaimSummary,
    AdminLocationSummary,
    AdminLocationCreate,
    AdminLocationUpdate,
    AdminSuspiciousItem,
)
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.admin_service import admin_service

router = APIRouter(
    prefix="/admin",
    tags=["Administration Console"],
    dependencies=[Depends(require_admin)],  # STRICT ROLE-BASED ACCESS ENFORCEMENT
)


# ----------------------------------------------------------------------
# 1. Executive Metrics & KPIs
# ----------------------------------------------------------------------
@router.get(
    "/stats",
    response_model=ApiResponse[AdminOverviewStats],
    summary="Get aggregated campus lost & found metrics",
)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Returns total users, lost reports, found reports, recovered items,
    recovery rate (%), pending claims count, and suspicious report alerts.
    """
    stats = admin_service.get_overview_stats(db=db)
    return ApiResponse(
        success=True,
        data=stats,
        message="Overview statistics computed successfully.",
    )


# ----------------------------------------------------------------------
# 2. Charts & Analytics
# ----------------------------------------------------------------------
@router.get(
    "/charts",
    response_model=ApiResponse[AdminChartsData],
    summary="Get time-series & categorical chart telemetry",
)
def get_admin_charts(
    days: int = Query(14, ge=7, le=90, description="Timeline window in days"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Returns chart telemetry datasets:
    - Lost vs Found breakdown
    - Reports volume over time
    - Category distribution
    - Campus landmark density
    - Recovery lifecycle status breakdown
    """
    charts = admin_service.get_charts_data(db=db, days=days)
    return ApiResponse(
        success=True,
        data=charts,
        message="Chart telemetry retrieved.",
    )


# ----------------------------------------------------------------------
# 3. User Administration
# ----------------------------------------------------------------------
@router.get(
    "/users",
    response_model=ApiResponse[List[AdminUserSummary]],
    summary="List all registered accounts",
)
def list_admin_users(
    search: Optional[str] = Query(None, description="Search by name, email, or student ID"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active/suspended status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(25, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Browse student and staff accounts with items reported and claims submitted.
    """
    skip = (page - 1) * per_page
    users, total = admin_service.list_users(
        db=db,
        search=search,
        role=role,
        is_active=is_active,
        skip=skip,
        limit=per_page,
    )

    total_pages = math.ceil(total / per_page) if total > 0 else 1
    meta = PaginationMeta(
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )

    return ApiResponse(
        success=True,
        data=users,
        meta=meta,
        message=f"Retrieved {len(users)} users.",
    )


@router.post(
    "/users/{user_id}/toggle-status",
    response_model=ApiResponse[AdminUserSummary],
    summary="Suspend or reactivate a user account",
)
def toggle_user_status(
    user_id: uuid.UUID,
    payload: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Suspend or reactivate a user. Suspended users cannot authenticate or report items.
    Prevents self-suspension by the executing administrator.
    """
    user = admin_service.toggle_user_status(
        db=db,
        user_id=user_id,
        is_active=payload.is_active,
        current_admin_id=admin_user.id,
        reason=payload.reason,
    )
    
    summary, _ = admin_service.list_users(db=db, search=user.email, limit=1)
    user_summary = summary[0] if summary else AdminUserSummary.model_validate(user)

    action_label = "activated" if payload.is_active else "suspended"
    return ApiResponse(
        success=True,
        data=user_summary,
        message=f"User {user.email} has been {action_label}.",
    )


# ----------------------------------------------------------------------
# 4. Reports Moderation & Deletion
# ----------------------------------------------------------------------
@router.get(
    "/reports",
    response_model=ApiResponse[List[AdminReportSummary]],
    summary="List all lost & found reports for moderation",
)
def list_admin_reports(
    search: Optional[str] = Query(None, description="Search by title, description, or location"),
    type: Optional[ItemType] = Query(None, description="Filter by LOST or FOUND"),
    category: Optional[ItemCategory] = Query(None, description="Filter by item category"),
    status: Optional[ItemStatus] = Query(None, description="Filter by item status"),
    is_suspicious: Optional[bool] = Query(None, description="Filter by suspicious flag"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(25, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    List reports with reporter identification, claim counts, and suspicious markers.
    """
    skip = (page - 1) * per_page
    reports, total = admin_service.list_reports(
        db=db,
        search=search,
        type=type,
        category=category,
        status_filter=status,
        is_suspicious_filter=is_suspicious,
        skip=skip,
        limit=per_page,
    )

    total_pages = math.ceil(total / per_page) if total > 0 else 1
    meta = PaginationMeta(
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )

    return ApiResponse(
        success=True,
        data=reports,
        meta=meta,
        message=f"Retrieved {len(reports)} reports.",
    )


@router.delete(
    "/reports/{item_id}",
    response_model=ApiResponse[dict],
    summary="Permanently delete an item report",
)
def delete_admin_report(
    item_id: uuid.UUID,
    reason: Optional[str] = Query(None, description="Deletion rationale / audit note"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Permanently delete an item report, removing all associated AI matches and claims.
    """
    admin_service.delete_report(db=db, item_id=item_id, reason=reason)
    return ApiResponse(
        success=True,
        data={"item_id": str(item_id)},
        message="Report permanently deleted by administrator.",
    )


# ----------------------------------------------------------------------
# 5. Claims Administration
# ----------------------------------------------------------------------
@router.get(
    "/claims",
    response_model=ApiResponse[List[AdminClaimSummary]],
    summary="List all claims across all campus reports",
)
def list_admin_claims(
    status: Optional[ClaimStatus] = Query(None, description="Filter by claim status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(25, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Review claims submitted by claimants with answer verifications and contact details.
    """
    skip = (page - 1) * per_page
    claims, total = admin_service.list_claims(
        db=db,
        status_filter=status,
        skip=skip,
        limit=per_page,
    )

    total_pages = math.ceil(total / per_page) if total > 0 else 1
    meta = PaginationMeta(
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )

    return ApiResponse(
        success=True,
        data=claims,
        meta=meta,
        message=f"Retrieved {len(claims)} claims.",
    )


@router.post(
    "/claims/{claim_id}/approve",
    response_model=ApiResponse[dict],
    summary="Approve claim and authorize custody handover",
)
def approve_admin_claim(
    claim_id: uuid.UUID,
    notes: Optional[str] = Query(None, description="Approval notes"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Directly approve a claim on behalf of campus administration.
    Marks item status as CLAIMED and unmasks finder contact details.
    """
    updated_claim = admin_service.review_claim(
        db=db,
        claim_id=claim_id,
        new_status=ClaimStatus.APPROVED,
        admin_notes=notes or f"Approved by administrator {admin_user.name}.",
    )
    return ApiResponse(
        success=True,
        data={"claim_id": str(updated_claim.id), "status": updated_claim.status.value},
        message="Claim approved successfully.",
    )


@router.post(
    "/claims/{claim_id}/reject",
    response_model=ApiResponse[dict],
    summary="Reject claim",
)
def reject_admin_claim(
    claim_id: uuid.UUID,
    notes: Optional[str] = Query(None, description="Rejection reason"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Reject an invalid or fraudulent claim.
    """
    updated_claim = admin_service.review_claim(
        db=db,
        claim_id=claim_id,
        new_status=ClaimStatus.REJECTED,
        admin_notes=notes or f"Rejected by administrator {admin_user.name}.",
    )
    return ApiResponse(
        success=True,
        data={"claim_id": str(updated_claim.id), "status": updated_claim.status.value},
        message="Claim rejected.",
    )


# ----------------------------------------------------------------------
# 6. Campus Locations Management
# ----------------------------------------------------------------------
@router.get(
    "/locations",
    response_model=ApiResponse[List[AdminLocationSummary]],
    summary="List all campus locations with item counts",
)
def list_admin_locations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Fetch all active and inactive campus locations with report density count.
    """
    locations = admin_service.list_locations(db=db)
    return ApiResponse(
        success=True,
        data=locations,
        message=f"Retrieved {len(locations)} campus locations.",
    )


@router.post(
    "/locations",
    response_model=ApiResponse[AdminLocationSummary],
    status_code=status.HTTP_201_CREATED,
    summary="Add a new campus landmark location",
)
def create_admin_location(
    location_in: AdminLocationCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Register a new official university landmark with GPS coordinates.
    """
    new_loc = admin_service.create_location(db=db, loc_in=location_in)
    summary = AdminLocationSummary(
        id=new_loc.id,
        name=new_loc.name,
        description=new_loc.description,
        latitude=new_loc.latitude,
        longitude=new_loc.longitude,
        building=new_loc.building,
        floor=new_loc.floor,
        is_active=new_loc.is_active,
        created_at=new_loc.created_at,
        items_count=0,
    )
    return ApiResponse(
        success=True,
        data=summary,
        message=f"Campus location '{new_loc.name}' created successfully.",
    )


@router.put(
    "/locations/{location_id}",
    response_model=ApiResponse[AdminLocationSummary],
    summary="Update an existing campus location",
)
def update_admin_location(
    location_id: uuid.UUID,
    location_in: AdminLocationUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Modify campus landmark coordinates, descriptions, or active status.
    """
    updated_loc = admin_service.update_location(
        db=db, location_id=location_id, loc_in=location_in
    )
    summary = AdminLocationSummary(
        id=updated_loc.id,
        name=updated_loc.name,
        description=updated_loc.description,
        latitude=updated_loc.latitude,
        longitude=updated_loc.longitude,
        building=updated_loc.building,
        floor=updated_loc.floor,
        is_active=updated_loc.is_active,
        created_at=updated_loc.created_at,
        items_count=0,
    )
    return ApiResponse(
        success=True,
        data=summary,
        message=f"Campus location '{updated_loc.name}' updated successfully.",
    )


@router.delete(
    "/locations/{location_id}",
    response_model=ApiResponse[dict],
    summary="Delete or deactivate campus location",
)
def delete_admin_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Remove or deactivate a campus location.
    Soft-deactivates if items are linked to preserve audit trail.
    """
    admin_service.delete_location(db=db, location_id=location_id)
    return ApiResponse(
        success=True,
        data={"location_id": str(location_id)},
        message="Location successfully removed or deactivated.",
    )


# ----------------------------------------------------------------------
# 7. Suspicious Activity Review
# ----------------------------------------------------------------------
@router.get(
    "/suspicious",
    response_model=ApiResponse[List[AdminSuspiciousItem]],
    summary="Review suspicious activities and fraudulent patterns",
)
def get_suspicious_activity(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Returns heuristically identified suspicious items, claimants with
    repeated disputes, spam keywords, or high-value reports with low detail.
    """
    suspicious = admin_service.get_suspicious_activity(db=db)
    return ApiResponse(
        success=True,
        data=suspicious,
        message=f"Identified {len(suspicious)} suspicious activities.",
    )


@router.post(
    "/suspicious/{item_id}/dismiss",
    response_model=ApiResponse[dict],
    summary="Dismiss suspicious flag",
)
def dismiss_suspicious(
    item_id: str,
    admin_user: User = Depends(require_admin),
):
    """
    Dismiss a suspicious flag after administrative review.
    """
    admin_service.dismiss_suspicious_flag(item_id=item_id)
    return ApiResponse(
        success=True,
        data={"item_id": item_id},
        message="Suspicious flag dismissed.",
    )


@router.post(
    "/suspicious/{item_id}/flag",
    response_model=ApiResponse[dict],
    summary="Manually flag report as suspicious",
)
def flag_suspicious(
    item_id: str,
    reason: str = Query("Admin manual review flag", description="Reason for flagging"),
    admin_user: User = Depends(require_admin),
):
    """
    Manually add a report to the suspicious activity review queue.
    """
    admin_service.flag_item_suspicious(item_id=item_id, reason=reason)
    return ApiResponse(
        success=True,
        data={"item_id": item_id, "reason": reason},
        message="Item report flagged as suspicious.",
    )
