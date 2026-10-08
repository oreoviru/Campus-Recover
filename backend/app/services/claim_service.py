"""
Campus Recover — Claim Service Layer

Encapsulates all business logic, authorization, and fraud prevention for item claims:
- Submitting claims and challenge answers
- Reviewing, approving, rejecting claims
- Protecting private verification answers and finder contact information
- Administrative override and recovery completion
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import Session, joinedload

from app.models.claim import Claim
from app.models.item import Item
from app.models.user import User
from app.models.match import Match
from app.models.enums import ClaimStatus, ItemStatus, ItemType, UserRole, MatchStatus
from app.auth.password import verify_verification_answer
from app.schemas.claim import (
    ClaimCreate,
    ClaimReviewRequest,
    ClaimResponse,
    ClaimantInfo,
    FinderContactInfo,
    ClaimVerificationPrompt,
)
from app.schemas.item import ItemResponse


class ClaimService:
    """Service handling secure ownership claims and review workflows."""

    @staticmethod
    def get_verification_prompt(db: Session, item_id: uuid.UUID) -> ClaimVerificationPrompt:
        """
        Retrieve challenge prompt for an item without exposing answers or hashes.
        """
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID '{item_id}' not found.",
            )

        return ClaimVerificationPrompt(
            item_id=item.id,
            item_title=item.title,
            item_category=item.category.value,
            has_verification_question=bool(item.verification_question),
            verification_question=item.verification_question,
        )

    @staticmethod
    def create_claim(db: Session, claimant: User, claim_in: ClaimCreate) -> Claim:
        """
        Create a new ownership claim for an item report.
        Enforces fraud prevention checks.
        """
        item = db.get(Item, claim_in.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID '{claim_in.item_id}' not found.",
            )

        # Fraud Prevention 1: User cannot claim an item they reported themselves
        if item.user_id == claimant.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot submit an ownership claim on an item you reported.",
            )

        # Fraud Prevention 2: Item must be active or claimed (not closed/recovered)
        if item.status in (ItemStatus.RECOVERED, ItemStatus.CLOSED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This item is marked as '{item.status.value}' and cannot be claimed.",
            )

        # Fraud Prevention 3: User cannot have multiple simultaneous PENDING claims for same item
        existing_pending = db.scalars(
            select(Claim).where(
                Claim.item_id == item.id,
                Claim.claimant_id == claimant.id,
                Claim.status == ClaimStatus.PENDING,
            )
        ).first()

        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active pending claim under review for this item.",
            )

        # Initialize claim
        new_claim = Claim(
            item_id=item.id,
            claimant_id=claimant.id,
            verification_question=item.verification_question,
            verification_answer_hash=item.verification_answer_hash,
            submitted_answer=claim_in.submitted_answer.strip(),
            status=ClaimStatus.PENDING,
            admin_notes=None,
        )

        db.add(new_claim)
        db.commit()
        db.refresh(new_claim)

        # Trigger notification to finder
        try:
            from app.services.notification_service import notification_service
            notification_service.notify_claim_submitted(db, new_claim, item, claimant)
        except Exception:
            pass

        return new_claim

    @staticmethod
    def get_claim(db: Session, claim_id: uuid.UUID) -> Optional[Claim]:
        """Fetch single claim by ID with eager loading."""
        stmt = (
            select(Claim)
            .options(
                joinedload(Claim.claimant),
                joinedload(Claim.item).joinedload(Item.user),
                joinedload(Claim.item).joinedload(Item.campus_location),
            )
            .where(Claim.id == claim_id)
        )
        return db.scalar(stmt)

    @staticmethod
    def list_my_claims(
        db: Session,
        claimant_id: uuid.UUID,
        status_filter: Optional[ClaimStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Claim], int]:
        """List claims submitted by the current user."""
        query = (
            select(Claim)
            .options(
                joinedload(Claim.claimant),
                joinedload(Claim.item).joinedload(Item.user),
                joinedload(Claim.item).joinedload(Item.campus_location),
            )
            .where(Claim.claimant_id == claimant_id)
        )
        count_query = select(func.count(Claim.id)).where(Claim.claimant_id == claimant_id)

        if status_filter:
            query = query.where(Claim.status == status_filter)
            count_query = count_query.where(Claim.status == status_filter)

        total = db.scalar(count_query) or 0
        offset = (page - 1) * per_page
        query = query.order_by(desc(Claim.created_at)).offset(offset).limit(per_page)

        items = db.scalars(query).unique().all()
        return list(items), total

    @staticmethod
    def list_incoming_claims(
        db: Session,
        finder_id: uuid.UUID,
        status_filter: Optional[ClaimStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Claim], int]:
        """List claims submitted by others on items reported by this finder."""
        query = (
            select(Claim)
            .join(Claim.item)
            .options(
                joinedload(Claim.claimant),
                joinedload(Claim.item).joinedload(Item.user),
                joinedload(Claim.item).joinedload(Item.campus_location),
            )
            .where(Item.user_id == finder_id)
        )
        count_query = (
            select(func.count(Claim.id))
            .join(Claim.item)
            .where(Item.user_id == finder_id)
        )

        if status_filter:
            query = query.where(Claim.status == status_filter)
            count_query = count_query.where(Claim.status == status_filter)

        total = db.scalar(count_query) or 0
        offset = (page - 1) * per_page
        query = query.order_by(desc(Claim.created_at)).offset(offset).limit(per_page)

        items = db.scalars(query).unique().all()
        return list(items), total

    @staticmethod
    def list_admin_claims(
        db: Session,
        status_filter: Optional[ClaimStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Claim], int]:
        """Admin queue of all campus claims."""
        query = select(Claim).options(
            joinedload(Claim.claimant),
            joinedload(Claim.item).joinedload(Item.user),
            joinedload(Claim.item).joinedload(Item.campus_location),
        )
        count_query = select(func.count(Claim.id))

        if status_filter:
            query = query.where(Claim.status == status_filter)
            count_query = count_query.where(Claim.status == status_filter)

        total = db.scalar(count_query) or 0
        offset = (page - 1) * per_page
        query = query.order_by(desc(Claim.created_at)).offset(offset).limit(per_page)

        items = db.scalars(query).unique().all()
        return list(items), total

    @staticmethod
    def list_item_claims(db: Session, item_id: uuid.UUID) -> List[Claim]:
        """List all claims for a given item."""
        query = (
            select(Claim)
            .options(
                joinedload(Claim.claimant),
                joinedload(Claim.item).joinedload(Item.user),
                joinedload(Claim.item).joinedload(Item.campus_location),
            )
            .where(Claim.item_id == item_id)
            .order_by(desc(Claim.created_at))
        )
        return list(db.scalars(query).unique().all())

    @staticmethod
    def review_claim(
        db: Session,
        claim_id: uuid.UUID,
        reviewer: User,
        review_in: ClaimReviewRequest,
    ) -> Claim:
        """
        Review, approve, or reject an ownership claim.
        Only the item finder or an administrator can review.
        """
        claim = ClaimService.get_claim(db, claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim with ID '{claim_id}' not found.",
            )

        # Authorization: Must be finder or Admin
        is_finder = claim.item and claim.item.user_id == reviewer.id
        is_admin = reviewer.role == UserRole.ADMIN

        if not (is_finder or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to review this claim.",
            )

        # Review workflow updates
        claim.status = review_in.status
        notes = review_in.admin_notes or review_in.review_notes
        if notes:
            claim.admin_notes = notes.strip()

        claim.updated_at = datetime.now(timezone.utc)

        # If approved, update item status to CLAIMED
        if review_in.status == ClaimStatus.APPROVED and claim.item:
            claim.item.status = ItemStatus.CLAIMED
            claim.item.updated_at = datetime.now(timezone.utc)

        # If rejected and item was previously marked claimed by this, revert to ACTIVE if no other approved claim
        elif review_in.status == ClaimStatus.REJECTED and claim.item:
            other_approved = db.scalars(
                select(Claim).where(
                    Claim.item_id == claim.item.id,
                    Claim.status == ClaimStatus.APPROVED,
                    Claim.id != claim.id,
                )
            ).first()
            if not other_approved and claim.item.status == ItemStatus.CLAIMED:
                claim.item.status = ItemStatus.ACTIVE
                claim.item.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(claim)

        # Trigger notification to claimant
        try:
            from app.services.notification_service import notification_service
            if review_in.status == ClaimStatus.APPROVED and claim.item:
                notification_service.notify_claim_approved(db, claim, claim.item)
            elif review_in.status == ClaimStatus.REJECTED and claim.item:
                notification_service.notify_claim_rejected(
                    db, claim, claim.item, notes=review_in.admin_notes or review_in.review_notes
                )
        except Exception:
            pass

        return claim

    @staticmethod
    def mark_recovered(db: Session, claim_id: uuid.UUID, user: User) -> Claim:
        """
        Mark item as officially RECOVERED following physical handover.
        Authorized for: Claimant, Finder, or Admin on an APPROVED claim.
        """
        claim = ClaimService.get_claim(db, claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim with ID '{claim_id}' not found.",
            )

        is_claimant = claim.claimant_id == user.id
        is_finder = claim.item and claim.item.user_id == user.id
        is_admin = user.role == UserRole.ADMIN

        if not (is_claimant or is_finder or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to confirm recovery of this item.",
            )

        if claim.status != ClaimStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved claims can be confirmed as recovered.",
            )

        if claim.item:
            claim.item.status = ItemStatus.RECOVERED
            claim.item.updated_at = datetime.now(timezone.utc)

            # Update corresponding Match record to CONFIRMED if present
            try:
                match_records = db.scalars(
                    select(Match).where(
                        or_(
                            Match.lost_item_id == claim.item.id,
                            Match.found_item_id == claim.item.id,
                        )
                    )
                ).all()
                for m in match_records:
                    m.status = MatchStatus.CONFIRMED
            except Exception:
                pass

        claim.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(claim)

        # Trigger notification to claimant and finder
        try:
            from app.services.notification_service import notification_service
            if claim.item:
                notification_service.notify_item_recovered(db, claim, claim.item)
        except Exception:
            pass

        return claim

    @staticmethod
    def build_claim_response(claim: Claim, viewer: Optional[User] = None) -> ClaimResponse:
        """
        Transform ORM Claim into ClaimResponse with strict security checks:
        - NEVER expose verification_answer_hash
        - NEVER expose finder contact information before approval
        """
        is_claimant = bool(viewer and viewer.id == claim.claimant_id)
        is_finder = bool(viewer and claim.item and viewer.id == claim.item.user_id)
        is_admin = bool(viewer and viewer.role == UserRole.ADMIN)

        # Auto-verification check (only visible to Finder and Admin)
        auto_passed: Optional[bool] = None
        if (is_finder or is_admin) and claim.verification_answer_hash:
            auto_passed = verify_verification_answer(
                claim.submitted_answer, claim.verification_answer_hash
            )

        # STRICT FINDER CONTACT ENCAPSULATION
        # Finder contact info is ONLY visible after claim is APPROVED (or if viewer is finder/admin)
        finder_contact: Optional[FinderContactInfo] = None
        if claim.item and claim.item.user:
            if claim.status == ClaimStatus.APPROVED or is_finder or is_admin:
                finder_contact = FinderContactInfo(
                    id=claim.item.user.id,
                    name=claim.item.user.name,
                    email=claim.item.user.email,
                )

        # Claimant info
        claimant_info: Optional[ClaimantInfo] = None
        if claim.claimant:
            claimant_info = ClaimantInfo(
                id=claim.claimant.id,
                name=claim.claimant.name,
                email=claim.claimant.email,
                student_id=claim.claimant.student_id if (is_finder or is_admin or is_claimant) else None,
            )

        # Action flags
        can_review = (is_finder or is_admin) and claim.status == ClaimStatus.PENDING
        can_mark_recovered = (
            (is_claimant or is_finder or is_admin)
            and claim.status == ClaimStatus.APPROVED
            and bool(claim.item and claim.item.status != ItemStatus.RECOVERED)
        )

        return ClaimResponse(
            id=claim.id,
            item_id=claim.item_id,
            claimant_id=claim.claimant_id,
            status=claim.status,
            verification_question=claim.verification_question,
            submitted_answer=claim.submitted_answer,
            admin_notes=claim.admin_notes,
            review_notes=claim.admin_notes,
            auto_verification_passed=auto_passed,
            created_at=claim.created_at,
            updated_at=claim.updated_at,
            item=ItemResponse.from_orm_item(claim.item) if claim.item else None,
            claimant=claimant_info,
            finder_contact=finder_contact,
            can_review=can_review,
            can_mark_recovered=can_mark_recovered,
        )


claim_service = ClaimService()
