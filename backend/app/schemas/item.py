"""
Campus Recover — Item Schemas
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.models.enums import ItemType, ItemStatus, ItemCategory
from app.schemas.user import UserSummary
from app.schemas.location import CampusLocationResponse


class ItemBase(BaseModel):
    title: str = Field(min_length=2, max_length=255, description="Item title/name")
    description: str = Field(min_length=5, description="Detailed item description")
    category: ItemCategory = Field(description="Primary category")
    subcategory: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    serial_number: Optional[str] = Field(None, max_length=100)
    distinguishing_marks: Optional[str] = None

    location_name: Optional[str] = Field(None, max_length=255)
    campus_location_id: Optional[uuid.UUID] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

    date_time: datetime = Field(description="Date and time when lost or found")
    image_url: Optional[str] = Field(None, max_length=500)


class ItemCreate(ItemBase):
    type: ItemType = Field(description="LOST or FOUND")
    user_id: Optional[uuid.UUID] = Field(None, description="Reporter user UUID")

    # Private verification challenge (Found items only)
    verification_question: Optional[str] = Field(
        None,
        max_length=500,
        description="Private question for verifying ownership (e.g. 'What is on the sticker?')",
    )
    verification_answer: Optional[str] = Field(
        None,
        max_length=500,
        description="Private answer that the claimant must match",
    )

    @model_validator(mode="after")
    def validate_verification(self) -> "ItemCreate":
        if self.verification_question and not self.verification_answer:
            raise ValueError("Verification answer must be provided when a verification question is specified.")
        return self


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[ItemCategory] = None
    subcategory: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    serial_number: Optional[str] = Field(None, max_length=100)
    distinguishing_marks: Optional[str] = None
    location_name: Optional[str] = Field(None, max_length=255)
    campus_location_id: Optional[uuid.UUID] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    date_time: Optional[datetime] = None
    image_url: Optional[str] = Field(None, max_length=500)
    status: Optional[ItemStatus] = None


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    type: ItemType
    status: ItemStatus
    has_verification_question: bool = False
    created_at: datetime
    updated_at: datetime

    # Related models
    user: Optional[UserSummary] = None
    campus_location: Optional[CampusLocationResponse] = None

    @classmethod
    def from_orm_item(cls, item: Any) -> "ItemResponse":
        """Convert ORM Item to ItemResponse, computing has_verification_question safely."""
        return cls(
            id=item.id,
            user_id=item.user_id,
            type=item.type,
            title=item.title,
            description=item.description,
            category=item.category,
            subcategory=item.subcategory,
            color=item.color,
            brand=item.brand,
            serial_number=item.serial_number,
            distinguishing_marks=item.distinguishing_marks,
            location_name=item.location_name,
            campus_location_id=item.campus_location_id,
            latitude=item.latitude,
            longitude=item.longitude,
            date_time=item.date_time,
            image_url=item.image_url,
            status=item.status,
            has_verification_question=bool(item.verification_question),
            created_at=item.created_at,
            updated_at=item.updated_at,
            user=item.user,
            campus_location=item.campus_location,
        )


class ItemListResponse(BaseModel):
    items: List[ItemResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
