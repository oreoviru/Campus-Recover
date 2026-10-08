"""
Campus Recover — Campus Locations & Map API Routes (Phase 10)

Provides:
- Campus buildings & pre-configured landmarks registry
- Map item marker discovery with privacy-safe coordinate shielding
- Campus lost & found cluster hotspot density calculations
- Proximity search with Haversine distance calculations
"""

import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user
from app.models.campus_location import CampusLocation
from app.models.user import User
from app.models.enums import ItemType, ItemCategory, ItemStatus
from app.schemas.location import (
    CampusLocationResponse,
    MapItemMarker,
    CampusHotspot,
    NearbyItemResponse,
)
from app.schemas.common import ApiResponse
from app.services.map_service import map_service

router = APIRouter(prefix="/locations", tags=["Locations & Campus Map"])


@router.get(
    "",
    response_model=ApiResponse[List[CampusLocationResponse]],
    summary="List all active campus locations",
)
def list_locations(
    search: Optional[str] = Query(None, description="Search locations by name or building"),
    db: Session = Depends(get_db),
):
    """
    Return all active campus locations for use in report forms and map filtering.
    """
    query = select(CampusLocation).where(CampusLocation.is_active == True)  # noqa: E712

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            CampusLocation.name.ilike(term) | CampusLocation.building.ilike(term)
        )

    query = query.order_by(CampusLocation.name)
    locations = db.scalars(query).all()

    return ApiResponse(
        success=True,
        data=[CampusLocationResponse.model_validate(loc) for loc in locations],
        message="Campus locations retrieved.",
    )


@router.get(
    "/map/items",
    response_model=ApiResponse[List[MapItemMarker]],
    summary="Get privacy-safe item markers for campus map",
)
def get_map_items(
    type: Optional[ItemType] = Query(None, description="Filter by LOST or FOUND"),
    category: Optional[ItemCategory] = Query(None, description="Filter by item category"),
    status: Optional[ItemStatus] = Query(ItemStatus.ACTIVE, description="Filter by status (default ACTIVE)"),
    campus_location_id: Optional[uuid.UUID] = Query(None, description="Filter by campus location UUID"),
    min_lat: Optional[float] = Query(None, description="Bounding box min latitude"),
    max_lat: Optional[float] = Query(None, description="Bounding box max latitude"),
    min_lon: Optional[float] = Query(None, description="Bounding box min longitude"),
    max_lon: Optional[float] = Query(None, description="Bounding box max longitude"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve item markers for campus map rendering.
    PRIVACY ENFORCEMENT: Sensitive categories (electronics, wallets, jewelry, keys)
    are generalized for public viewers. Exact coordinates are preserved only for
    the item owner or staff administrators.
    """
    markers = map_service.get_map_items(
        db=db,
        item_type=type,
        category=category,
        status=status,
        campus_location_id=campus_location_id,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        viewer=current_user,
    )

    return ApiResponse(
        success=True,
        data=markers,
        message=f"Retrieved {len(markers)} map markers.",
    )


@router.get(
    "/hotspots",
    response_model=ApiResponse[List[CampusHotspot]],
    summary="Get campus loss and recovery density hotspots",
)
def get_campus_hotspots(
    db: Session = Depends(get_db),
):
    """
    Calculate loss vs recovery cluster density across campus landmarks.
    Returns sorted hotspots with density scores (0.0 to 1.0) and top item categories.
    """
    hotspots = map_service.get_campus_hotspots(db=db)
    return ApiResponse(
        success=True,
        data=hotspots,
        message="Campus hotspots calculated successfully.",
    )


@router.get(
    "/nearby",
    response_model=ApiResponse[List[NearbyItemResponse]],
    summary="Search nearby items within radius using Haversine distance",
)
def get_nearby_items(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Center latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Center longitude"),
    radius_meters: float = Query(1000.0, ge=10.0, le=50000.0, description="Search radius in meters"),
    type: Optional[ItemType] = Query(None, description="Filter by LOST or FOUND"),
    category: Optional[ItemCategory] = Query(None, description="Filter by category"),
    limit: int = Query(25, ge=1, le=100, description="Max items to return"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Find items near a GPS coordinate or campus building.
    Returns items sorted from nearest to furthest with precise distance in meters.
    """
    nearby = map_service.get_nearby_items(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        item_type=type,
        category=category,
        limit=limit,
        viewer=current_user,
    )

    return ApiResponse(
        success=True,
        data=nearby,
        message=f"Found {len(nearby)} nearby items within {int(radius_meters)}m.",
    )


@router.get(
    "/{location_id}",
    response_model=ApiResponse[CampusLocationResponse],
    summary="Get location details by ID",
)
def get_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve a single campus location by its UUID."""
    location = db.get(CampusLocation, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location '{location_id}' not found.",
        )
    return ApiResponse(
        success=True,
        data=CampusLocationResponse.model_validate(location),
        message="Location retrieved.",
    )
