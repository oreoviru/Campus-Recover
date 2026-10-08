"""
Campus Recover — Location Matching Service

Calculates geospatial distance via Haversine formula and semantic
building/room similarity to score location proximity.
"""

import math
import re
from typing import Optional, Tuple, Any

from app.config import settings


class LocationMatchingService:
    """
    Independent service for spatial comparison between lost and found locations.
    Evaluates:
      1. GPS coordinate proximity (Haversine formula with smooth distance decay)
      2. Campus facility / building identity match
      3. Specific room / landmark text similarity
    """

    EARTH_RADIUS_METERS = 6371000.0  # Mean radius of Earth

    @classmethod
    def haversine_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
    ) -> float:
        """
        Calculate the great-circle distance between two GPS points in meters.
        """
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return cls.EARTH_RADIUS_METERS * c

    @staticmethod
    def distance_to_score(distance_meters: float) -> float:
        """
        Convert geospatial distance in meters to a normalized score [0.0, 1.0].
        Decay thresholds:
          <= 50m (same room/building wing): 1.0 -> 0.95
          <= 200m (same quad/adjacent hall): 0.95 -> 0.75
          <= 500m (same campus zone): 0.75 -> 0.50
          <= 1000m (opposite ends of campus): 0.50 -> 0.20
          > 1000m: 0.20 -> 0.0
        """
        if distance_meters <= 0:
            return 1.0
        elif distance_meters <= 50:
            # 0 to 50m: 1.0 down to 0.95
            return 1.0 - 0.05 * (distance_meters / 50.0)
        elif distance_meters <= 200:
            # 50 to 200m: 0.95 down to 0.75
            return 0.95 - 0.20 * ((distance_meters - 50.0) / 150.0)
        elif distance_meters <= 500:
            # 200 to 500m: 0.75 down to 0.50
            return 0.75 - 0.25 * ((distance_meters - 200.0) / 300.0)
        elif distance_meters <= 1000:
            # 500 to 1000m: 0.50 down to 0.20
            return 0.50 - 0.30 * ((distance_meters - 500.0) / 500.0)
        elif distance_meters <= 2500:
            # 1000 to 2500m: 0.20 down to 0.02
            return max(0.02, 0.20 - 0.18 * ((distance_meters - 1000.0) / 1500.0))
        else:
            return 0.0

    @classmethod
    def compute_room_similarity(cls, room_a: Optional[str], room_b: Optional[str]) -> float:
        """
        Compute textual similarity between specific room/landmark descriptions.
        """
        if not room_a or not room_b:
            return 0.5  # Neutral when unspecified

        clean_a = set(re.findall(r"\w+", room_a.lower()))
        clean_b = set(re.findall(r"\w+", room_b.lower()))

        if not clean_a or not clean_b:
            return 0.5

        if clean_a == clean_b:
            return 1.0

        intersection = clean_a.intersection(clean_b)
        union = clean_a.union(clean_b)

        jaccard = len(intersection) / len(union) if union else 0.0
        return max(0.0, min(1.0, jaccard))

    def compare_items(self, item_a: Any, item_b: Any) -> Tuple[float, dict]:
        """
        Compare locations of two items.
        Returns (location_score, details).
        """
        lat_a = getattr(item_a, "latitude", None)
        lon_a = getattr(item_a, "longitude", None)
        lat_b = getattr(item_b, "latitude", None)
        lon_b = getattr(item_b, "longitude", None)

        bldg_a = getattr(item_a, "campus_location_id", None)
        bldg_b = getattr(item_b, "campus_location_id", None)

        room_a = getattr(item_a, "location_name", None)
        room_b = getattr(item_b, "location_name", None)

        has_coords_a = lat_a is not None and lon_a is not None
        has_coords_b = lat_b is not None and lon_b is not None

        distance_meters: Optional[float] = None
        gps_score: Optional[float] = None

        if has_coords_a and has_coords_b:
            distance_meters = self.haversine_distance(lat_a, lon_a, lat_b, lon_b)
            gps_score = self.distance_to_score(distance_meters)

        # Campus building identity
        same_building: Optional[bool] = None
        building_score: float = 0.5

        if bldg_a and bldg_b:
            same_building = str(bldg_a) == str(bldg_b)
            building_score = 0.90 if same_building else 0.20
        elif bldg_a or bldg_b:
            building_score = 0.50  # Only one specified

        # Specific room name similarity
        room_sim = self.compute_room_similarity(room_a, room_b)

        # Composite score calculation
        if gps_score is not None:
            if same_building is True:
                # Same building + GPS available
                loc_score = 0.60 * gps_score + 0.25 * building_score + 0.15 * room_sim
            else:
                loc_score = 0.75 * gps_score + 0.15 * building_score + 0.10 * room_sim
        elif same_building is not None:
            # No GPS, but building known
            if same_building:
                loc_score = 0.70 * building_score + 0.30 * room_sim
            else:
                loc_score = 0.20
        else:
            # Only room descriptions or fallback
            loc_score = room_sim if (room_a and room_b) else 0.50

        loc_score = round(max(0.0, min(1.0, loc_score)), 4)

        details = {
            "distance_meters": round(distance_meters, 1) if distance_meters is not None else None,
            "gps_score": round(gps_score, 4) if gps_score is not None else None,
            "same_building": same_building,
            "building_score": round(building_score, 4),
            "room_similarity": round(room_sim, 4),
        }

        return loc_score, details


# Global default instance
location_matching_service = LocationMatchingService()
