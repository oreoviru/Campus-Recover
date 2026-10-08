"""
Campus Recover — Item Service Layer

Encapsulates all database queries and business logic for Items.
Routes call this service and never interact with SQLAlchemy queries directly.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple, List

from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import Session, joinedload

from app.models.item import Item
from app.models.enums import ItemType, ItemStatus, ItemCategory
from app.schemas.item import ItemCreate, ItemUpdate
from app.auth.password import hash_verification_answer


class ItemService:
    """Service class for Item CRUD operations."""

    @staticmethod
    def create_item(db: Session, item_in: ItemCreate) -> Item:
        """
        Create a new lost or found item report.
        If verification answer is supplied (found items), it is securely hashed.
        """
        answer_hash = None
        if item_in.verification_answer:
            answer_hash = hash_verification_answer(item_in.verification_answer)

        db_item = Item(
            user_id=item_in.user_id,
            type=item_in.type,
            title=item_in.title,
            description=item_in.description,
            category=item_in.category,
            subcategory=item_in.subcategory,
            color=item_in.color,
            brand=item_in.brand,
            serial_number=item_in.serial_number,
            distinguishing_marks=item_in.distinguishing_marks,
            location_name=item_in.location_name,
            campus_location_id=item_in.campus_location_id,
            latitude=item_in.latitude,
            longitude=item_in.longitude,
            date_time=item_in.date_time,
            image_url=item_in.image_url,
            status=ItemStatus.ACTIVE,
            verification_question=item_in.verification_question,
            verification_answer_hash=answer_hash,
        )

        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # Trigger AI Matching Engine (Independent Service - not in API routes)
        try:
            from app.ai.engine import matching_engine_service
            matching_engine_service.process_new_item(db=db, new_item=db_item)
        except Exception as e:
            # Matching runs asynchronously/robustly without failing item creation
            import logging
            logging.getLogger(__name__).error(f"Error executing AI matching engine for item {db_item.id}: {e}")

        return db_item

    @staticmethod
    def get_item(db: Session, item_id: uuid.UUID) -> Optional[Item]:
        """Fetch a single item by ID with eager loading of relations."""
        stmt = (
            select(Item)
            .options(
                joinedload(Item.user),
                joinedload(Item.campus_location),
            )
            .where(Item.id == item_id)
        )
        return db.scalar(stmt)

    @staticmethod
    def list_items(
        db: Session,
        item_type: Optional[ItemType] = None,
        category: Optional[ItemCategory] = None,
        status: Optional[ItemStatus] = None,
        search: Optional[str] = None,
        campus_location_id: Optional[uuid.UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        per_page: int = 20,
        user_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[Item], int]:
        """
        List items with comprehensive filters, search, sorting, and pagination.
        Returns a tuple of (items_list, total_count).
        """
        # Base query with relations loaded
        query = select(Item).options(
            joinedload(Item.user),
            joinedload(Item.campus_location),
        )
        count_query = select(func.count(Item.id))

        # Filter criteria
        filters = []

        if user_id:
            filters.append(Item.user_id == user_id)

        if item_type:
            filters.append(Item.type == item_type)
        if category:
            filters.append(Item.category == category)
        if status:
            filters.append(Item.status == status)
        if campus_location_id:
            filters.append(Item.campus_location_id == campus_location_id)
        if date_from:
            filters.append(Item.date_time >= date_from)
        if date_to:
            filters.append(Item.date_time <= date_to)
        if search:
            search_term = f"%{search.strip()}%"
            filters.append(
                or_(
                    Item.title.ilike(search_term),
                    Item.description.ilike(search_term),
                    Item.brand.ilike(search_term),
                    Item.color.ilike(search_term),
                    Item.location_name.ilike(search_term),
                )
            )

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        # Count total matching rows
        total = db.scalar(count_query) or 0

        # Sorting
        sort_column = getattr(Item, sort_by, Item.created_at)
        order_func = desc if sort_order.lower() == "desc" else asc
        query = query.order_by(order_func(sort_column))

        # Pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        items = db.scalars(query).unique().all()
        return list(items), total

    @staticmethod
    def update_item(
        db: Session,
        item_id: uuid.UUID,
        item_in: ItemUpdate,
    ) -> Optional[Item]:
        """Update an existing item's fields."""
        db_item = db.get(Item, item_id)
        if not db_item:
            return None

        update_data = item_in.model_dump(exclude_unset=True)
        if "title" in update_data or "description" in update_data:
            db_item.text_embedding = None
        if "image_url" in update_data:
            db_item.image_embedding = None

        for field, value in update_data.items():
            setattr(db_item, field, value)

        db_item.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_item)

        # Rerun matching if active
        try:
            from app.ai.engine import matching_engine_service
            if db_item.status == ItemStatus.ACTIVE:
                matching_engine_service.process_new_item(db=db, new_item=db_item)
        except Exception:
            pass

        return db_item

    @staticmethod
    def delete_item(db: Session, item_id: uuid.UUID) -> bool:
        """Delete an item by ID."""
        db_item = db.get(Item, item_id)
        if not db_item:
            return False

        db.delete(db_item)
        db.commit()
        return True


item_service = ItemService()
