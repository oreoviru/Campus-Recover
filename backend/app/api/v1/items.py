"""
Campus Recover — Items API Routes
"""

import math
import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.enums import ItemType, ItemStatus, ItemCategory
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.item_service import item_service

router = APIRouter(prefix="/items", tags=["Items"])


@router.post(
    "",
    response_model=ApiResponse[ItemResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Report a lost or found item",
)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new item report (LOST or FOUND).
    For found items, optional private verification questions and answers can be submitted.
    """
    created_item = item_service.create_item(db=db, item_in=item_in)
    return ApiResponse(
        success=True,
        data=ItemResponse.from_orm_item(created_item),
        message=f"{created_item.type.value.capitalize()} item reported successfully.",
    )


@router.get(
    "",
    response_model=ApiResponse[List[ItemResponse]],
    summary="List items with search, filters, and pagination",
)
def list_items(
    type: Optional[ItemType] = Query(None, description="Filter by LOST or FOUND"),
    category: Optional[ItemCategory] = Query(None, description="Filter by category"),
    status_filter: Optional[ItemStatus] = Query(None, alias="status", description="Filter by item status"),
    search: Optional[str] = Query(None, description="Keyword search in title, description, color, brand"),
    campus_location_id: Optional[uuid.UUID] = Query(None, description="Filter by campus location UUID"),
    date_from: Optional[datetime] = Query(None, description="Filter items after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter items before this timestamp"),
    sort_by: str = Query("created_at", description="Sort field (created_at, date_time, title)"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Search and filter lost & found items.
    Supports full pagination, multi-field filtering, and custom sorting.
    """
    items, total = item_service.list_items(
        db=db,
        item_type=type,
        category=category,
        status=status_filter,
        search=search,
        campus_location_id=campus_location_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
    )

    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return ApiResponse(
        success=True,
        data=[ItemResponse.from_orm_item(item) for item in items],
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get(
    "/{item_id}",
    response_model=ApiResponse[ItemResponse],
    summary="Get item details by ID",
)
def get_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve full details of a specific item report.
    Never exposes private verification answer hashes.
    """
    item = item_service.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    return ApiResponse(
        success=True,
        data=ItemResponse.from_orm_item(item),
    )


@router.put(
    "/{item_id}",
    response_model=ApiResponse[ItemResponse],
    summary="Update an existing item report",
)
def update_item(
    item_id: uuid.UUID,
    item_in: ItemUpdate,
    db: Session = Depends(get_db),
):
    """
    Update item details, characteristics, or status.
    """
    updated = item_service.update_item(db=db, item_id=item_id, item_in=item_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    return ApiResponse(
        success=True,
        data=ItemResponse.from_orm_item(updated),
        message="Item updated successfully.",
    )


@router.delete(
    "/{item_id}",
    response_model=ApiResponse[dict],
    summary="Delete an item report",
)
def delete_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Delete an item report.
    """
    deleted = item_service.delete_item(db=db, item_id=item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    return ApiResponse(
        success=True,
        data={"id": str(item_id)},
        message="Item deleted successfully.",
    )
