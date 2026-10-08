"""
Campus Recover — Map & Geospatial Service Layer (Phase 10)

Provides:
- Privacy-aware coordinate generalization for sensitive/valuable items
- Map marker query filtering and bounding box searches
- Lost vs Found cluster hotspot density analytics
- Proximity search and Haversine distance calculations
"""

import math
import uuid
import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, joinedload

from app.models.item import Item
from app.models.campus_location import CampusLocation
from app.models.user import User
from app.models.enums import ItemType, ItemCategory, ItemStatus, UserRole
from app.schemas.location import MapItemMarker, CampusHotspot, NearbyItemResponse
from app.ai.location_matching import LocationMatchingService

logger = logging.getLogger(__name__)

# Categories requiring privacy-safe location generalization for unverified public viewers
SENSITIVE_CATEGORIES = {
    ItemCategory.ELECTRONICS,
    ItemCategory.DOCUMENTS,
    ItemCategory.KEYS,
    ItemCategory.ACCESSORIES,
}

# Campus default coordinates (Rishihood University, Sonipat, Haryana)
CAMPUS_DEFAULT_LAT = 28.9832
CAMPUS_DEFAULT_LON = 77.0908


class MapService:
    """Service layer for geospatial queries, hotspot aggregation, and privacy shielding."""

    @staticmethod
    def format_distance(distance_meters: float) -> str:
        """Format distance into human-readable string."""
        if distance_meters < 1000:
            return f"{int(round(distance_meters))} m"
        km = distance_meters / 1000.0
        return f"{km:.1f} km"

    @staticmethod
    def sanitize_item_for_map(item: Item, viewer: Optional[User] = None) -> Optional[MapItemMarker]:
        """
        Produce a MapItemMarker with strict privacy enforcement:
        - Never expose exact pinpoint coordinates or sensitive room details of valuable items publicly.
        - Authorized report owners and admins see full pinpoint precision.
        """
        # Determine base coordinates
        item_lat = item.latitude
        item_lon = item.longitude

        # Fallback to campus location center if item has no raw coordinates
        if (item_lat is None or item_lon is None) and item.campus_location:
            item_lat = item.campus_location.latitude
            item_lon = item.campus_location.longitude

        # If still no coordinates, cannot place on map
        if item_lat is None or item_lon is None:
            return None

        is_owner = bool(viewer and viewer.id == item.user_id)
        is_admin = bool(viewer and viewer.role == UserRole.ADMIN)
        is_sensitive = item.category in SENSITIVE_CATEGORIES

        is_generalized = False
        display_lat = float(item_lat)
        display_lon = float(item_lon)
        display_loc_name = item.location_name

        # Apply privacy shield for sensitive items to public / non-owner viewers
        if is_sensitive and not (is_owner or is_admin):
            is_generalized = True

            if item.campus_location:
                # Snap to campus building center instead of exact room/desk
                display_lat = float(item.campus_location.latitude)
                display_lon = float(item.campus_location.longitude)
                display_loc_name = f"{item.campus_location.name} (General Area)"
            else:
                # Deterministic coordinate grid rounding (~100m blur)
                display_lat = round(display_lat, 3)
                display_lon = round(display_lon, 3)
                display_loc_name = "Campus Vicinity (Approximate Area)"

        campus_loc_name = item.campus_location.name if item.campus_location else None

        return MapItemMarker(
            id=item.id,
            title=item.title,
            description=item.description,
            type=item.type,
            category=item.category,
            status=item.status,
            image_url=item.image_url,
            latitude=display_lat,
            longitude=display_lon,
            is_generalized_location=is_generalized,
            campus_location_id=item.campus_location_id,
            campus_location_name=campus_loc_name,
            location_name=display_loc_name,
            date_time=item.date_time,
            created_at=item.created_at,
        )

    @staticmethod
    def get_map_items(
        db: Session,
        item_type: Optional[ItemType] = None,
        category: Optional[ItemCategory] = None,
        status: Optional[ItemStatus] = ItemStatus.ACTIVE,
        campus_location_id: Optional[uuid.UUID] = None,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
        viewer: Optional[User] = None,
    ) -> List[MapItemMarker]:
        """
        Query all items matching filters with geospatial coordinates.
        Applies privacy sanitization.
        """
        query = (
            select(Item)
            .options(joinedload(Item.campus_location))
            .where(
                # Must have direct coordinates or belong to a campus location with coordinates
                (Item.latitude.isnot(None) & Item.longitude.isnot(None))
                | Item.campus_location_id.isnot(None)
            )
        )

        if status:
            query = query.where(Item.status == status)
        if item_type:
            query = query.where(Item.type == item_type)
        if category:
            query = query.where(Item.category == category)
        if campus_location_id:
            query = query.where(Item.campus_location_id == campus_location_id)

        # Coordinate bounding box filtering if provided
        if min_lat is not None and max_lat is not None:
            query = query.where(Item.latitude >= min_lat, Item.latitude <= max_lat)
        if min_lon is not None and max_lon is not None:
            query = query.where(Item.longitude >= min_lon, Item.longitude <= max_lon)

        items = db.scalars(query).unique().all()

        markers: List[MapItemMarker] = []
        for item in items:
            marker = MapService.sanitize_item_for_map(item, viewer=viewer)
            if marker:
                markers.append(marker)

        return markers

    @staticmethod
    def get_campus_hotspots(db: Session) -> List[CampusHotspot]:
        """
        Aggregate loss and recovery density across all campus locations.
        Calculates lost vs found distribution and density scores.
        """
        # Fetch active locations with their items
        locations = db.scalars(
            select(CampusLocation)
            .options(joinedload(CampusLocation.items))
            .where(CampusLocation.is_active == True)  # noqa: E712
        ).unique().all()

        hotspots: List[CampusHotspot] = []
        max_total = 1

        for loc in locations:
            active_items = [it for it in loc.items if it.status == ItemStatus.ACTIVE]
            lost_items = [it for it in active_items if it.type == ItemType.LOST]
            found_items = [it for it in active_items if it.type == ItemType.FOUND]

            total = len(active_items)
            if total > max_total:
                max_total = total

            # Extract top categories
            cat_counts: Dict[str, int] = {}
            for it in active_items:
                cat_val = it.category.value if hasattr(it.category, "value") else str(it.category)
                cat_counts[cat_val] = cat_counts.get(cat_val, 0) + 1

            top_cats = sorted(cat_counts.keys(), key=lambda c: cat_counts[c], reverse=True)[:3]

            hotspots.append(
                CampusHotspot(
                    id=loc.id,
                    name=loc.name,
                    building=loc.building,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    lost_count=len(lost_items),
                    found_count=len(found_items),
                    total_count=total,
                    density_score=0.0,  # Computed below
                    top_categories=top_cats,
                )
            )

        # Normalize density score (0.0 - 1.0)
        for h in hotspots:
            h.density_score = round(min(1.0, h.total_count / float(max_total)), 2)

        # Sort hotspots by total count descending
        hotspots.sort(key=lambda h: h.total_count, reverse=True)
        return hotspots

    @staticmethod
    def get_nearby_items(
        db: Session,
        latitude: float,
        longitude: float,
        radius_meters: float = 1000.0,
        item_type: Optional[ItemType] = None,
        category: Optional[ItemCategory] = None,
        limit: int = 25,
        viewer: Optional[User] = None,
    ) -> List[NearbyItemResponse]:
        """
        Find items within radius_meters of target coordinate, sorted by proximity.
        """
        all_markers = MapService.get_map_items(
            db=db,
            item_type=item_type,
            category=category,
            status=ItemStatus.ACTIVE,
            viewer=viewer,
        )

        nearby: List[NearbyItemResponse] = []
        for marker in all_markers:
            dist = LocationMatchingService.haversine_distance(
                latitude, longitude, marker.latitude, marker.longitude
            )
            if dist <= radius_meters:
                score = LocationMatchingService.distance_to_score(dist)
                nearby.append(
                    NearbyItemResponse(
                        item=marker,
                        distance_meters=round(dist, 1),
                        distance_display=MapService.format_distance(dist),
                        proximity_score=round(score, 3),
                    )
                )

        # Sort nearest first
        nearby.sort(key=lambda x: x.distance_meters)
        return nearby[:limit]


map_service = MapService()
