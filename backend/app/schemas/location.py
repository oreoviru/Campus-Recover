"""
Campus Recover — Campus Location Schemas
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CampusLocationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    building: Optional[str] = Field(None, max_length=100)
    floor: Optional[str] = Field(None, max_length=50)


class CampusLocationCreate(CampusLocationBase):
    pass


class CampusLocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    building: Optional[str] = Field(None, max_length=100)
    floor: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class CampusLocationResponse(CampusLocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    created_at: datetime


from app.models.enums import ItemType, ItemCategory, ItemStatus
from typing import List


class MapItemMarker(BaseModel):
    """Privacy-safe item marker for campus map display."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    type: ItemType
    category: ItemCategory
    status: ItemStatus
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    is_generalized_location: bool = False
    campus_location_id: Optional[uuid.UUID] = None
    campus_location_name: Optional[str] = None
    location_name: Optional[str] = None
    date_time: datetime
    created_at: datetime


class CampusHotspot(BaseModel):
    """Aggregated campus hotspot showing cluster of lost vs found reports."""
    id: uuid.UUID
    name: str
    building: Optional[str] = None
    latitude: float
    longitude: float
    lost_count: int
    found_count: int
    total_count: int
    density_score: float  # Normalized 0.0 - 1.0 for heatmap rendering
    top_categories: List[str] = []


class NearbyItemResponse(BaseModel):
    """Item record paired with computed geospatial distance from target coordinate."""
    item: MapItemMarker
    distance_meters: float
    distance_display: str
    proximity_score: float

