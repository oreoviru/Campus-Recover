"""
Campus Recover — Attribute Matching Service

Compares structured metadata across Category, Subcategory, Color, Brand,
Serial Number, and Distinguishing Features.
"""

import re
from typing import Tuple, Any, Optional, Dict, Set

from app.models.enums import ItemCategory


class AttributeMatchingService:
    """
    Independent service for matching structured physical attributes between items.
    Handles:
      1. Category and subcategory alignment
      2. Color family mapping and normalization
      3. Brand name canonicalization
      4. Exact serial number / unique ID verification
      5. Distinguishing marks token comparison
    """

    COLOR_FAMILIES: Dict[str, Set[str]] = {
        "black": {"black", "dark", "charcoal", "matte black", "onyx", "jet black", "midnight"},
        "gray": {"gray", "grey", "silver", "space gray", "space grey", "titanium", "slate", "ash", "platinum"},
        "white": {"white", "cream", "ivory", "pearl", "chalk", "eggshell"},
        "blue": {"blue", "navy", "midnight blue", "royal blue", "sky blue", "cyan", "cobalt", "teal", "indigo"},
        "red": {"red", "crimson", "scarlet", "ruby", "maroon", "burgundy", "cherry"},
        "green": {"green", "olive", "forest green", "emerald", "sage", "mint", "lime", "army green"},
        "yellow": {"yellow", "gold", "amber", "mustard", "golden"},
        "brown": {"brown", "tan", "beige", "khaki", "camel", "chocolate", "cognac", "bronze"},
        "purple": {"purple", "violet", "lavender", "plum", "magenta"},
        "pink": {"pink", "rose", "rose gold", "coral", "salmon", "blush"},
        "orange": {"orange", "peach", "rust", "terracotta"},
    }

    # Cross-category compatibility matrix
    COMPATIBILITY: Dict[ItemCategory, Set[ItemCategory]] = {
        ItemCategory.ELECTRONICS: {ItemCategory.ELECTRONICS, ItemCategory.OTHER},
        ItemCategory.CLOTHING: {ItemCategory.CLOTHING, ItemCategory.ACCESSORIES, ItemCategory.OTHER},
        ItemCategory.ACCESSORIES: {ItemCategory.ACCESSORIES, ItemCategory.CLOTHING, ItemCategory.BAGS, ItemCategory.OTHER},
        ItemCategory.DOCUMENTS: {ItemCategory.DOCUMENTS, ItemCategory.BAGS, ItemCategory.OTHER},
        ItemCategory.KEYS: {ItemCategory.KEYS, ItemCategory.ACCESSORIES, ItemCategory.OTHER},
        ItemCategory.BAGS: {ItemCategory.BAGS, ItemCategory.ACCESSORIES, ItemCategory.SPORTS, ItemCategory.OTHER},
        ItemCategory.BOOKS: {ItemCategory.BOOKS, ItemCategory.DOCUMENTS, ItemCategory.OTHER},
        ItemCategory.SPORTS: {ItemCategory.SPORTS, ItemCategory.BAGS, ItemCategory.OTHER},
        ItemCategory.OTHER: set(ItemCategory),
    }

    def compute_category_score(
        self,
        cat_a: Optional[ItemCategory],
        cat_b: Optional[ItemCategory],
    ) -> float:
        """Score category compatibility."""
        if not cat_a or not cat_b:
            return 0.5

        if cat_a == cat_b:
            return 1.0

        # Check compatibility map
        compat_a = self.COMPATIBILITY.get(cat_a, set())
        if cat_b in compat_a:
            return 0.35

        return 0.0

    def compute_color_score(self, color_a: Optional[str], color_b: Optional[str]) -> float:
        """Score color similarity using color families."""
        if not color_a or not color_b:
            return 0.5  # Neutral when omitted

        ca = color_a.strip().lower()
        cb = color_b.strip().lower()

        if ca == cb:
            return 1.0

        # Find matching families
        fam_a = self._find_color_family(ca)
        fam_b = self._find_color_family(cb)

        if fam_a and fam_b and fam_a == fam_b:
            return 0.85

        # Check word overlap (e.g. "dark blue" vs "blue")
        words_a = set(re.findall(r"\w+", ca))
        words_b = set(re.findall(r"\w+", cb))
        if words_a.intersection(words_b):
            return 0.70

        return 0.15

    def compute_brand_score(self, brand_a: Optional[str], brand_b: Optional[str]) -> float:
        """Score brand matching."""
        if not brand_a or not brand_b:
            return 0.5  # Neutral

        ba = self._normalize_brand(brand_a)
        bb = self._normalize_brand(brand_b)

        if ba == bb:
            return 1.0

        if ba in bb or bb in ba:
            return 0.90

        return 0.0

    def compute_serial_score(
        self,
        serial_a: Optional[str],
        serial_b: Optional[str],
    ) -> Optional[float]:
        """
        Compare serial numbers / IDs.
        Returns 1.0 for exact match, 0.0 for mismatch, or None if not both present.
        """
        if not serial_a or not serial_b:
            return None

        clean_a = re.sub(r"[\s\-_]", "", serial_a.strip().upper())
        clean_b = re.sub(r"[\s\-_]", "", serial_b.strip().upper())

        if not clean_a or not clean_b:
            return None

        if clean_a == clean_b:
            return 1.0
        return 0.0

    def compare_items(self, item_a: Any, item_b: Any) -> Tuple[float, dict]:
        """
        Comprehensive comparison of physical attributes between two items.
        Returns (attribute_score, details).
        """
        cat_a = getattr(item_a, "category", None)
        cat_b = getattr(item_b, "category", None)
        sub_a = getattr(item_a, "subcategory", None)
        sub_b = getattr(item_b, "subcategory", None)
        color_a = getattr(item_a, "color", None)
        color_b = getattr(item_b, "color", None)
        brand_a = getattr(item_a, "brand", None)
        brand_b = getattr(item_b, "brand", None)
        serial_a = getattr(item_a, "serial_number", None)
        serial_b = getattr(item_b, "serial_number", None)
        marks_a = getattr(item_a, "distinguishing_marks", None)
        marks_b = getattr(item_b, "distinguishing_marks", None)

        # 1. Category Score
        cat_score = self.compute_category_score(cat_a, cat_b)

        # Incompatible categories cannot match (e.g. clothing vs electronics)
        if cat_score == 0.0:
            return 0.0, {
                "category_score": 0.0,
                "reason": f"Incompatible categories: {cat_a} vs {cat_b}",
            }

        # 2. Subcategory Score
        sub_score = 0.5
        if sub_a and sub_b:
            clean_sub_a = sub_a.strip().lower()
            clean_sub_b = sub_b.strip().lower()
            if clean_sub_a == clean_sub_b:
                sub_score = 1.0
            elif clean_sub_a in clean_sub_b or clean_sub_b in clean_sub_a:
                sub_score = 0.8
            else:
                sub_score = 0.2

        # 3. Color Score
        color_score = self.compute_color_score(color_a, color_b)

        # 4. Brand Score
        brand_score = self.compute_brand_score(brand_a, brand_b)

        # 5. Serial Number (Definitive Signal)
        serial_score = self.compute_serial_score(serial_a, serial_b)

        # 6. Distinguishing marks token overlap
        marks_score = 0.5
        if marks_a and marks_b:
            wa = set(re.findall(r"\w+", marks_a.lower()))
            wb = set(re.findall(r"\w+", marks_b.lower()))
            overlap = wa.intersection(wb)
            union = wa.union(wb)
            marks_score = len(overlap) / len(union) if union else 0.5

        # Combine scores
        if serial_score == 1.0:
            # Exact serial number match gives near-perfect attribute score
            attr_score = 1.0
        elif serial_score == 0.0:
            # Serial numbers are both provided and conflict: severe penalty
            attr_score = 0.05
        else:
            # Weighted average of standard physical attributes
            # Category 35%, Brand 25%, Color 20%, Subcategory 15%, Marks 5%
            attr_score = (
                0.35 * cat_score
                + 0.25 * brand_score
                + 0.20 * color_score
                + 0.15 * sub_score
                + 0.05 * marks_score
            )

        attr_score = round(max(0.0, min(1.0, attr_score)), 4)

        details = {
            "category_score": round(cat_score, 4),
            "subcategory_score": round(sub_score, 4),
            "color_score": round(color_score, 4),
            "brand_score": round(brand_score, 4),
            "serial_score": serial_score,
            "marks_score": round(marks_score, 4),
        }

        return attr_score, details

    def _find_color_family(self, color_name: str) -> Optional[str]:
        # Step 1: Exact match in aliases
        for family, aliases in self.COLOR_FAMILIES.items():
            if color_name in aliases:
                return family

        # Step 2: Whole word match sorted by alias length descending
        words = set(re.findall(r"\w+", color_name.lower()))
        for family, aliases in self.COLOR_FAMILIES.items():
            for alias in aliases:
                alias_words = set(re.findall(r"\w+", alias.lower()))
                if alias_words.issubset(words):
                    return family

        return None

    @staticmethod
    def _normalize_brand(brand: str) -> str:
        clean = brand.strip().lower()
        clean = re.sub(r"^(the|a|an)\s+", "", clean)
        clean = re.sub(r"[\s\-_.]", "", clean)
        return clean


# Global default instance
attribute_matching_service = AttributeMatchingService()
