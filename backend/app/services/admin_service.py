"""
Campus Recover — Admin Service (Phase 11)

Coordinates all administrative operations:
- High-level metric aggregation (KPIs, recovery rate)
- Time-series and categorical charting queries
- User lifecycle management (suspension, role reviews)
- Item report moderation and administrative deletion
- Full claims mediation queue
- Campus location CRUD
- Algorithmic suspicious activity detection
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple, Dict, Any, Set
from collections import defaultdict

from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.user import User
from app.models.item import Item
from app.models.claim import Claim
from app.models.campus_location import CampusLocation
from app.models.enums import UserRole, ItemType, ItemStatus, ItemCategory, ClaimStatus
from app.schemas.admin import (
    AdminOverviewStats,
    AdminChartsData,
    ChartDataReportOverTime,
    ChartDataCategory,
    ChartDataLocation,
    ChartDataRecoveryBreakdown,
    AdminUserSummary,
    AdminReportSummary,
    AdminClaimSummary,
    AdminLocationSummary,
    AdminLocationCreate,
    AdminLocationUpdate,
    AdminSuspiciousItem,
)


class AdminService:
    """Central administrative logic and telemetry calculation."""

    def __init__(self):
        # Set of manually dismissed or flagged items (in-memory tracking)
        self.dismissed_item_ids: Set[str] = set()
        self.manually_flagged_items: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # 1. Executive Metrics & KPIs
    # ------------------------------------------------------------------
    def get_overview_stats(self, db: Session) -> AdminOverviewStats:
        """
        Aggregate total users, lost reports, found reports, recovered items,
        recovery rate percentage, pending claims, and suspicious activity.
        """
        total_users = db.scalar(select(func.count(User.id))) or 0
        total_lost = db.scalar(select(func.count(Item.id)).where(Item.type == ItemType.LOST)) or 0
        total_found = db.scalar(select(func.count(Item.id)).where(Item.type == ItemType.FOUND)) or 0
        total_recovered = db.scalar(select(func.count(Item.id)).where(Item.status == ItemStatus.RECOVERED)) or 0
        
        # Recovery rate: percentage of total lost reports recovered (or total items recovered)
        if total_lost > 0:
            recovery_rate = round((total_recovered / total_lost) * 100, 1)
        elif (total_lost + total_found) > 0:
            recovery_rate = round((total_recovered / (total_lost + total_found)) * 100, 1)
        else:
            recovery_rate = 0.0

        pending_claims = db.scalar(select(func.count(Claim.id)).where(Claim.status == ClaimStatus.PENDING)) or 0

        # Run suspicious detector count
        suspicious_items = self.get_suspicious_activity(db)
        suspicious_count = len(suspicious_items)

        return AdminOverviewStats(
            total_users=total_users,
            total_lost_reports=total_lost,
            total_found_reports=total_found,
            total_recovered_items=total_recovered,
            recovery_rate=min(recovery_rate, 100.0),
            pending_claims=pending_claims,
            suspicious_reports=suspicious_count,
        )

    # ------------------------------------------------------------------
    # 2. Charts & Analytics Telemetry
    # ------------------------------------------------------------------
    def get_charts_data(self, db: Session, days: int = 14) -> AdminChartsData:
        """
        Produce consolidated time-series and categorical datasets for Recharts.
        """
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # A. Lost vs Found Breakdown
        total_lost = db.scalar(select(func.count(Item.id)).where(Item.type == ItemType.LOST)) or 0
        total_found = db.scalar(select(func.count(Item.id)).where(Item.type == ItemType.FOUND)) or 0
        total_items = total_lost + total_found
        total_recovered = db.scalar(select(func.count(Item.id)).where(Item.status == ItemStatus.RECOVERED)) or 0
        overall_rec_rate = round((total_recovered / max(total_lost, 1)) * 100, 1)

        lost_vs_found = {
            "lost": total_lost,
            "found": total_found,
            "total": total_items,
            "recovered": total_recovered,
            "recovery_rate": min(overall_rec_rate, 100.0),
        }

        # B. Reports Over Time (past `days` days)
        # Pre-seed continuous date buckets for smooth chart display
        daily_counts: Dict[str, Dict[str, int]] = {}
        for d in range(days):
            day_dt = start_date + timedelta(days=d + 1)
            key = day_dt.strftime("%b %d")
            daily_counts[key] = {"lost": 0, "found": 0, "total": 0}

        # Query recent items
        recent_items = db.scalars(
            select(Item).where(Item.created_at >= start_date).order_by(Item.created_at.asc())
        ).all()

        for item in recent_items:
            day_str = item.created_at.strftime("%b %d")
            if day_str in daily_counts:
                if item.type == ItemType.LOST:
                    daily_counts[day_str]["lost"] += 1
                else:
                    daily_counts[day_str]["found"] += 1
                daily_counts[day_str]["total"] += 1

        reports_over_time = [
            ChartDataReportOverTime(
                date=k,
                lost=v["lost"],
                found=v["found"],
                total=v["total"],
            )
            for k, v in daily_counts.items()
        ]

        # C. Category Distribution
        cat_counts = defaultdict(lambda: {"lost": 0, "found": 0, "total": 0})
        all_items = db.scalars(select(Item)).all()
        for it in all_items:
            cat_name = it.category.value if hasattr(it.category, "value") else str(it.category)
            if it.type == ItemType.LOST:
                cat_counts[cat_name]["lost"] += 1
            else:
                cat_counts[cat_name]["found"] += 1
            cat_counts[cat_name]["total"] += 1

        # Order categories by total descending
        categories_data = [
            ChartDataCategory(
                category=cat,
                lost=counts["lost"],
                found=counts["found"],
                total=counts["total"],
            )
            for cat, counts in sorted(cat_counts.items(), key=lambda x: x[1]["total"], reverse=True)
        ]

        # D. Campus Locations Distribution
        loc_counts = defaultdict(lambda: {"lost": 0, "found": 0, "total": 0})
        locations_map = {
            loc.id: loc.name for loc in db.scalars(select(CampusLocation)).all()
        }

        for it in all_items:
            loc_label = "Unassigned / Other"
            if it.campus_location_id and it.campus_location_id in locations_map:
                loc_label = locations_map[it.campus_location_id]
            elif it.location_name:
                loc_label = it.location_name[:30]

            if it.type == ItemType.LOST:
                loc_counts[loc_label]["lost"] += 1
            else:
                loc_counts[loc_label]["found"] += 1
            loc_counts[loc_label]["total"] += 1

        campus_locations_data = [
            ChartDataLocation(
                location_name=loc_name,
                lost=counts["lost"],
                found=counts["found"],
                total=counts["total"],
            )
            for loc_name, counts in sorted(loc_counts.items(), key=lambda x: x[1]["total"], reverse=True)[:10]
        ]

        # E. Recovery & Resolution Status Breakdown
        status_palette = {
            ItemStatus.ACTIVE.value: "#38bdf8",     # Cyan
            ItemStatus.MATCHED.value: "#a855f7",    # Purple
            ItemStatus.CLAIMED.value: "#f59e0b",    # Amber
            ItemStatus.RECOVERED.value: "#10b981",  # Emerald
            ItemStatus.CLOSED.value: "#64748b",     # Slate
        }
        status_counts = defaultdict(int)
        for it in all_items:
            s_val = it.status.value if hasattr(it.status, "value") else str(it.status)
            status_counts[s_val] += 1

        recovery_breakdown = [
            ChartDataRecoveryBreakdown(
                status=st,
                count=cnt,
                color=status_palette.get(st, "#94a3b8"),
            )
            for st, cnt in status_counts.items()
        ]

        return AdminChartsData(
            lost_vs_found=lost_vs_found,
            reports_over_time=reports_over_time,
            categories=categories_data,
            campus_locations=campus_locations_data,
            recovery_breakdown=recovery_breakdown,
            overall_recovery_rate=min(overall_rec_rate, 100.0),
        )

    # ------------------------------------------------------------------
    # 3. User Administration & Actions
    # ------------------------------------------------------------------
    def list_users(
        self,
        db: Session,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AdminUserSummary], int]:
        """List registered users with report/claim volume and active state."""
        query = select(User)

        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    User.name.ilike(term),
                    User.email.ilike(term),
                    User.student_id.ilike(term),
                )
            )

        if role:
            query = query.where(User.role == role)

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        total_count = db.scalar(select(func.count()).select_from(query.subquery())) or 0

        users = db.scalars(
            query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        ).all()

        # Compute items and claims count per user
        results: List[AdminUserSummary] = []
        for u in users:
            items_count = db.scalar(
                select(func.count(Item.id)).where(Item.user_id == u.id)
            ) or 0
            claims_count = db.scalar(
                select(func.count(Claim.id)).where(Claim.claimant_id == u.id)
            ) or 0

            results.append(
                AdminUserSummary(
                    id=u.id,
                    name=u.name,
                    email=u.email,
                    role=u.role,
                    student_id=u.student_id,
                    is_active=u.is_active,
                    created_at=u.created_at,
                    items_count=items_count,
                    claims_count=claims_count,
                )
            )

        return results, total_count

    def toggle_user_status(
        self,
        db: Session,
        user_id: uuid.UUID,
        is_active: bool,
        current_admin_id: uuid.UUID,
        reason: Optional[str] = None,
    ) -> User:
        """
        Suspend or reactivate a user account.
        Prevents admins from suspending their own accounts.
        """
        if user_id == current_admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot suspend their own account.",
            )

        user = db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' not found.",
            )

        user.is_active = is_active
        db.commit()
        db.refresh(user)
        return user

    # ------------------------------------------------------------------
    # 4. Reports Moderation & Admin Actions
    # ------------------------------------------------------------------
    def list_reports(
        self,
        db: Session,
        search: Optional[str] = None,
        type: Optional[ItemType] = None,
        category: Optional[ItemCategory] = None,
        status_filter: Optional[ItemStatus] = None,
        is_suspicious_filter: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AdminReportSummary], int]:
        """Fetch all lost and found item reports with admin moderation data."""
        query = select(Item).options(
            joinedload(Item.user),
            joinedload(Item.campus_location),
            joinedload(Item.claims),
        )

        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Item.title.ilike(term),
                    Item.description.ilike(term),
                    Item.location_name.ilike(term),
                )
            )

        if type:
            query = query.where(Item.type == type)

        if category:
            query = query.where(Item.category == category)

        if status_filter:
            query = query.where(Item.status == status_filter)

        total_count = db.scalar(select(func.count()).select_from(query.subquery())) or 0

        items = db.scalars(
            query.order_by(Item.created_at.desc()).offset(skip).limit(limit)
        ).unique().all()

        suspicious_list = self.get_suspicious_activity(db)
        suspicious_map = {str(s.item_id): s.reason for s in suspicious_list if s.item_id}

        results: List[AdminReportSummary] = []
        for it in items:
            item_id_str = str(it.id)
            is_susp = item_id_str in suspicious_map
            susp_reason = suspicious_map.get(item_id_str)

            if is_suspicious_filter is not None and is_susp != is_suspicious_filter:
                continue

            results.append(
                AdminReportSummary(
                    id=it.id,
                    type=it.type,
                    title=it.title,
                    description=it.description,
                    category=it.category,
                    status=it.status,
                    location_name=it.location_name,
                    campus_location_name=it.campus_location.name if it.campus_location else None,
                    campus_location_id=it.campus_location_id,
                    image_url=it.image_url,
                    user_id=it.user_id,
                    user_name=it.user.name if it.user else "Anonymous / Staff",
                    user_email=it.user.email if it.user else None,
                    date_time=it.date_time,
                    created_at=it.created_at,
                    claims_count=len(it.claims),
                    matches_count=len(it.lost_matches) if it.type == ItemType.LOST else len(it.found_matches),
                    is_suspicious=is_susp,
                    suspicious_reason=susp_reason,
                )
            )

        return results, total_count

    def delete_report(
        self,
        db: Session,
        item_id: uuid.UUID,
        reason: Optional[str] = None,
    ) -> bool:
        """Permanently delete an item report and cascade associated matches/claims."""
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID '{item_id}' not found.",
            )

        db.delete(item)
        db.commit()
        return True

    # ------------------------------------------------------------------
    # 5. Claims Administration & Review
    # ------------------------------------------------------------------
    def list_claims(
        self,
        db: Session,
        status_filter: Optional[ClaimStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AdminClaimSummary], int]:
        """Fetch claims across all items for administrative oversight."""
        query = select(Claim).options(
            joinedload(Claim.item).joinedload(Item.user),
            joinedload(Claim.claimant),
        )

        if status_filter:
            query = query.where(Claim.status == status_filter)

        total_count = db.scalar(select(func.count()).select_from(query.subquery())) or 0

        claims = db.scalars(
            query.order_by(Claim.created_at.desc()).offset(skip).limit(limit)
        ).unique().all()

        results: List[AdminClaimSummary] = []
        for c in claims:
            finder_user = c.item.user if c.item and c.item.user else None

            results.append(
                AdminClaimSummary(
                    id=c.id,
                    item_id=c.item_id,
                    item_title=c.item.title if c.item else "Unknown Item",
                    item_type=c.item.type if c.item else ItemType.FOUND,
                    item_category=c.item.category if c.item else ItemCategory.OTHER,
                    claimant_id=c.claimant_id,
                    claimant_name=c.claimant.name if c.claimant else "Unknown Claimant",
                    claimant_email=c.claimant.email if c.claimant else "unknown@university.edu",
                    finder_id=finder_user.id if finder_user else None,
                    finder_name=finder_user.name if finder_user else "Campus Security / Lost Desk",
                    finder_email=finder_user.email if finder_user else None,
                    verification_question=c.verification_question or (c.item.verification_question if c.item else None),
                    submitted_answer=c.submitted_answer,
                    status=c.status,
                    admin_notes=c.admin_notes,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                )
            )

        return results, total_count

    def review_claim(
        self,
        db: Session,
        claim_id: uuid.UUID,
        new_status: ClaimStatus,
        admin_notes: Optional[str] = None,
    ) -> Claim:
        """Approve or reject a claim on behalf of campus administrators."""
        claim = db.get(Claim, claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim with ID '{claim_id}' not found.",
            )

        claim.status = new_status
        if admin_notes:
            claim.admin_notes = admin_notes

        # If approved, update item status to CLAIMED
        if new_status == ClaimStatus.APPROVED and claim.item:
            claim.item.status = ItemStatus.CLAIMED

        db.commit()
        db.refresh(claim)
        return claim

    # ------------------------------------------------------------------
    # 6. Campus Locations Management
    # ------------------------------------------------------------------
    def list_locations(self, db: Session) -> List[AdminLocationSummary]:
        """Fetch all campus locations with report density count."""
        locations = db.scalars(
            select(CampusLocation).order_by(CampusLocation.name.asc())
        ).all()

        results: List[AdminLocationSummary] = []
        for loc in locations:
            item_count = db.scalar(
                select(func.count(Item.id)).where(Item.campus_location_id == loc.id)
            ) or 0

            results.append(
                AdminLocationSummary(
                    id=loc.id,
                    name=loc.name,
                    description=loc.description,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    building=loc.building,
                    floor=loc.floor,
                    is_active=loc.is_active,
                    created_at=loc.created_at,
                    items_count=item_count,
                )
            )

        return results

    def create_location(
        self,
        db: Session,
        loc_in: AdminLocationCreate,
    ) -> CampusLocation:
        """Add a new campus landmark location."""
        new_loc = CampusLocation(
            name=loc_in.name.strip(),
            description=loc_in.description.strip() if loc_in.description else None,
            latitude=loc_in.latitude,
            longitude=loc_in.longitude,
            building=loc_in.building.strip() if loc_in.building else None,
            floor=loc_in.floor.strip() if loc_in.floor else None,
            is_active=loc_in.is_active,
        )
        db.add(new_loc)
        db.commit()
        db.refresh(new_loc)
        return new_loc

    def update_location(
        self,
        db: Session,
        location_id: uuid.UUID,
        loc_in: AdminLocationUpdate,
    ) -> CampusLocation:
        """Modify an existing campus location."""
        loc = db.get(CampusLocation, location_id)
        if not loc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Campus location with ID '{location_id}' not found.",
            )

        if loc_in.name is not None:
            loc.name = loc_in.name.strip()
        if loc_in.description is not None:
            loc.description = loc_in.description.strip() if loc_in.description else None
        if loc_in.latitude is not None:
            loc.latitude = loc_in.latitude
        if loc_in.longitude is not None:
            loc.longitude = loc_in.longitude
        if loc_in.building is not None:
            loc.building = loc_in.building.strip() if loc_in.building else None
        if loc_in.floor is not None:
            loc.floor = loc_in.floor.strip() if loc_in.floor else None
        if loc_in.is_active is not None:
            loc.is_active = loc_in.is_active

        db.commit()
        db.refresh(loc)
        return loc

    def delete_location(
        self,
        db: Session,
        location_id: uuid.UUID,
    ) -> bool:
        """Deactivate or remove a campus location."""
        loc = db.get(CampusLocation, location_id)
        if not loc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Campus location with ID '{location_id}' not found.",
            )

        # Check if items are tied to it
        items_count = db.scalar(
            select(func.count(Item.id)).where(Item.campus_location_id == location_id)
        ) or 0

        if items_count > 0:
            # Soft-deactivate if items are linked to preserve referential history
            loc.is_active = False
            db.commit()
        else:
            db.delete(loc)
            db.commit()

        return True

    # ------------------------------------------------------------------
    # 7. Suspicious Activity Detection & Review
    # ------------------------------------------------------------------
    def get_suspicious_activity(self, db: Session) -> List[AdminSuspiciousItem]:
        """
        Scan for fraudulent, anomalous, or suspicious campus reports:
        1. Duplicate reports submitted in a short window.
        2. High-frequency claimants with rejected claims.
        3. High-value electronics with minimal descriptions or placeholder text.
        4. Items with multiple conflicting claims.
        5. Manually flagged reports.
        """
        suspicious: List[AdminSuspiciousItem] = []
        now = datetime.now(timezone.utc)

        # 1. Manually flagged items
        for it_id_str, reason in self.manually_flagged_items.items():
            if it_id_str in self.dismissed_item_ids:
                continue
            try:
                it_uuid = uuid.UUID(it_id_str)
                item = db.get(Item, it_uuid)
                if item:
                    suspicious.append(
                        AdminSuspiciousItem(
                            id=f"flagged_{it_id_str}",
                            item_id=item.id,
                            item_title=item.title,
                            item_type=item.type,
                            item_category=item.category,
                            user_id=item.user_id,
                            user_name=item.user.name if item.user else "Staff",
                            user_email=item.user.email if item.user else None,
                            reason=f"Admin Manual Flag: {reason}",
                            severity="HIGH",
                            created_at=item.created_at,
                            details={"manual": True, "reason": reason},
                        )
                    )
            except Exception:
                continue

        # 2. High-frequency rejected claimants
        rejected_counts = db.execute(
            select(Claim.claimant_id, func.count(Claim.id))
            .where(Claim.status == ClaimStatus.REJECTED)
            .group_by(Claim.claimant_id)
            .having(func.count(Claim.id) >= 2)
        ).all()

        for claimant_id, count in rejected_counts:
            claimant = db.get(User, claimant_id)
            if claimant:
                suspicious.append(
                    AdminSuspiciousItem(
                        id=f"user_repeat_rejected_{claimant.id}",
                        user_id=claimant.id,
                        user_name=claimant.name,
                        user_email=claimant.email,
                        reason=f"High Dispute Risk: User has {count} rejected claims.",
                        severity="HIGH" if count >= 3 else "MEDIUM",
                        created_at=claimant.created_at,
                        details={"rejected_claims": count, "user_role": claimant.role.value},
                    )
                )

        # 3. High-value items with low detail or suspicious brevity
        suspicious_keywords = {"test", "asdf", "fake", "giveaway", "money", "sample"}
        items = db.scalars(
            select(Item).options(joinedload(Item.user), joinedload(Item.claims)).order_by(Item.created_at.desc()).limit(100)
        ).unique().all()

        for it in items:
            if str(it.id) in self.dismissed_item_ids:
                continue

            # A. Spam keywords
            lower_text = f"{it.title} {it.description}".lower()
            found_spams = [kw for kw in suspicious_keywords if kw in lower_text.split()]
            if found_spams:
                suspicious.append(
                    AdminSuspiciousItem(
                        id=f"spam_{it.id}",
                        item_id=it.id,
                        item_title=it.title,
                        item_type=it.type,
                        item_category=it.category,
                        user_id=it.user_id,
                        user_name=it.user.name if it.user else "Anonymous",
                        user_email=it.user.email if it.user else None,
                        reason=f"Spam Heuristic: Contains test/placeholder words ({', '.join(found_spams)}).",
                        severity="HIGH",
                        created_at=it.created_at,
                        details={"matched_keywords": found_spams},
                    )
                )
                continue

            # B. High-value items without photo or description < 15 chars
            is_high_value = it.category in (ItemCategory.ELECTRONICS, ItemCategory.DOCUMENTS)
            if is_high_value and len(it.description.strip()) < 15 and not it.image_url:
                suspicious.append(
                    AdminSuspiciousItem(
                        id=f"low_detail_{it.id}",
                        item_id=it.id,
                        item_title=it.title,
                        item_type=it.type,
                        item_category=it.category,
                        user_id=it.user_id,
                        user_name=it.user.name if it.user else "Anonymous",
                        user_email=it.user.email if it.user else None,
                        reason="Missing Identifying Detail: High-value item with very brief description and no image.",
                        severity="MEDIUM",
                        created_at=it.created_at,
                        details={"description_length": len(it.description.strip()), "has_image": bool(it.image_url)},
                    )
                )
                continue

            # C. Multiple conflicting pending claims on a single found item
            if it.type == ItemType.FOUND and len(it.claims) >= 2:
                pending_claims = [c for c in it.claims if c.status == ClaimStatus.PENDING]
                if len(pending_claims) >= 2:
                    suspicious.append(
                        AdminSuspiciousItem(
                            id=f"dispute_{it.id}",
                            item_id=it.id,
                            item_title=it.title,
                            item_type=it.type,
                            item_category=it.category,
                            user_id=it.user_id,
                            user_name=it.user.name if it.user else "Staff",
                            user_email=it.user.email if it.user else None,
                            reason=f"Ownership Dispute: {len(pending_claims)} concurrent pending claims submitted for this found item.",
                            severity="HIGH",
                            created_at=it.created_at,
                            details={"pending_claims_count": len(pending_claims)},
                        )
                    )

        return suspicious

    def dismiss_suspicious_flag(self, item_id: str) -> bool:
        """Mark a suspicious finding as verified/dismissed by administrator."""
        self.dismissed_item_ids.add(str(item_id))
        if str(item_id) in self.manually_flagged_items:
            del self.manually_flagged_items[str(item_id)]
        return True

    def flag_item_suspicious(self, item_id: str, reason: str) -> bool:
        """Manually mark an item report as suspicious."""
        self.manually_flagged_items[str(item_id)] = reason
        if str(item_id) in self.dismissed_item_ids:
            self.dismissed_item_ids.remove(str(item_id))
        return True


admin_service = AdminService()
