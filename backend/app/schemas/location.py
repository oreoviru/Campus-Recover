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
