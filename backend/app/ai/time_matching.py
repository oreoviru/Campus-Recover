"""
Campus Recover — Time Matching Service

Evaluates temporal proximity and causal directionality between
when an item was lost and when it was found.
"""

from datetime import datetime, timezone
from typing import Tuple, Any, Optional

from app.models.enums import ItemType


class TimeMatchingService:
    """
    Independent service for temporal similarity and sequence validation.
    Understands that an item must logically be lost before (or around) the
    time it is turned in as found, with tolerance for student estimation inaccuracies.
    """

    @staticmethod
    def ensure_utc(dt: datetime) -> datetime:
        """Ensure datetime object is timezone-aware in UTC."""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def compute_time_score(
        self,
        lost_time: datetime,
        found_time: datetime,
    ) -> Tuple[float, dict]:
        """
        Compute temporal compatibility score between lost timestamp and found timestamp.
        Returns (time_score, details).
        """
        utc_lost = self.ensure_utc(lost_time)
        utc_found = self.ensure_utc(found_time)

        diff_seconds = (utc_found - utc_lost).total_seconds()
        diff_hours = diff_seconds / 3600.0
        diff_days = diff_hours / 24.0

        is_found_after_lost = diff_hours >= 0

        if is_found_after_lost:
            # Expected sequence: lost first, found later
            if diff_hours <= 12:
                # Within 12 hours
                score = 1.00
            elif diff_hours <= 24:
                # Within 24 hours
                score = 0.95 - 0.05 * ((diff_hours - 12.0) / 12.0)
            elif diff_days <= 3:
                # 1 to 3 days
                score = 0.90 - 0.10 * ((diff_days - 1.0) / 2.0)
            elif diff_days <= 7:
                # 3 to 7 days
                score = 0.80 - 0.15 * ((diff_days - 3.0) / 4.0)
            elif diff_days <= 14:
                # 1 to 2 weeks
                score = 0.65 - 0.20 * ((diff_days - 7.0) / 7.0)
            elif diff_days <= 30:
                # 2 weeks to 1 month
                score = 0.45 - 0.20 * ((diff_days - 14.0) / 16.0)
            elif diff_days <= 60:
                # 1 to 2 months
                score = 0.25 - 0.15 * ((diff_days - 30.0) / 30.0)
            else:
                score = max(0.02, 0.10 - 0.08 * (min(180.0, diff_days) - 60.0) / 120.0)
        else:
            # Found time reported earlier than lost time (estimation discrepancy)
            abs_hours = abs(diff_hours)
            if abs_hours <= 3.0:
                # Up to 3h discrepancy: slight penalty for reporting fuzziness
                score = 0.85
            elif abs_hours <= 12.0:
                # Up to 12h discrepancy
                score = 0.50
            elif abs_hours <= 24.0:
                # Up to 1 day discrepancy
                score = 0.20
            else:
                # More than 24 hours inverted: very improbable match
                score = 0.05

        score = round(max(0.0, min(1.0, score)), 4)

        details = {
            "lost_time": utc_lost.isoformat(),
            "found_time": utc_found.isoformat(),
            "difference_hours": round(diff_hours, 2),
            "difference_days": round(diff_days, 2),
            "is_causally_valid": is_found_after_lost or abs(diff_hours) <= 3.0,
            "raw_score": score,
        }

        return score, details

    def compare_items(self, item_a: Any, item_b: Any) -> Tuple[float, dict]:
        """
        Compare timestamps of two items, automatically identifying which
        is LOST and which is FOUND based on their item types.
        """
        type_a = getattr(item_a, "type", None)
        type_b = getattr(item_b, "type", None)
        time_a = getattr(item_a, "date_time", None)
        time_b = getattr(item_b, "date_time", None)

        if not time_a or not time_b:
            return 0.5, {"reason": "Missing timestamp on one or both items"}

        # Identify lost vs found
        if type_a == ItemType.LOST and type_b == ItemType.FOUND:
            lost_time = time_a
            found_time = time_b
        elif type_a == ItemType.FOUND and type_b == ItemType.LOST:
            lost_time = time_b
            found_time = time_a
        else:
            # Symmetrical comparison if same type or unspecified
            earlier = min(time_a, time_b)
            later = max(time_a, time_b)
            lost_time = earlier
            found_time = later

        return self.compute_time_score(lost_time, found_time)


# Global default instance
time_matching_service = TimeMatchingService()
