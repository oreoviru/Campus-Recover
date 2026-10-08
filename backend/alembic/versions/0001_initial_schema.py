"""Initial database schema: Users, CampusLocations, Items, Matches, Claims, Notifications

Revision ID: 0001_initial
Revises: 
Create Date: 2026-10-08 20:30:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("student_id", sa.String(length=50), nullable=True),
        sa.Column("profile_image", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. Campus Locations table
    op.create_table(
        "campus_locations",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("building", sa.String(length=100), nullable=True),
        sa.Column("floor", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_campus_locations_name", "campus_locations", ["name"])

    # 3. Items table
    op.create_table(
        "items",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("subcategory", sa.String(length=100), nullable=True),
        sa.Column("color", sa.String(length=50), nullable=True),
        sa.Column("brand", sa.String(length=100), nullable=True),
        sa.Column("serial_number", sa.String(length=100), nullable=True),
        sa.Column("distinguishing_marks", sa.Text(), nullable=True),
        sa.Column("location_name", sa.String(length=255), nullable=True),
        sa.Column("campus_location_id", sa.UUID(as_uuid=True), sa.ForeignKey("campus_locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("date_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("text_embedding", sa.JSON(), nullable=True),
        sa.Column("image_embedding", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="ACTIVE"),
        sa.Column("verification_question", sa.Text(), nullable=True),
        sa.Column("verification_answer_hash", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_items_user_id", "items", ["user_id"])
    op.create_index("ix_items_type", "items", ["type"])
    op.create_index("ix_items_title", "items", ["title"])
    op.create_index("ix_items_category", "items", ["category"])
    op.create_index("ix_items_status", "items", ["status"])
    op.create_index("ix_items_created_at", "items", ["created_at"])
    op.create_index("idx_items_type_status", "items", ["type", "status"])
    op.create_index("idx_items_category_status", "items", ["category", "status"])

    # 4. Matches table
    op.create_table(
        "matches",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("lost_item_id", sa.UUID(as_uuid=True), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("found_item_id", sa.UUID(as_uuid=True), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("image_score", sa.Float(), nullable=True),
        sa.Column("location_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("time_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("attribute_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("overall_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("score_breakdown", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("lost_item_id", "found_item_id", name="uq_matches_lost_found"),
    )
    op.create_index("ix_matches_lost_item_id", "matches", ["lost_item_id"])
    op.create_index("ix_matches_found_item_id", "matches", ["found_item_id"])
    op.create_index("ix_matches_overall_score", "matches", ["overall_score"])

    # 5. Claims table
    op.create_table(
        "claims",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("item_id", sa.UUID(as_uuid=True), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("claimant_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("verification_question", sa.Text(), nullable=True),
        sa.Column("verification_answer_hash", sa.String(length=255), nullable=True),
        sa.Column("submitted_answer", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_claims_item_id", "claims", ["item_id"])
    op.create_index("ix_claims_claimant_id", "claims", ["claimant_id"])
    op.create_index("idx_claims_item_claimant", "claims", ["item_id", "claimant_id"])

    # 6. Notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("related_item_id", sa.UUID(as_uuid=True), sa.ForeignKey("items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("related_match_id", sa.UUID(as_uuid=True), sa.ForeignKey("matches.id", ondelete="SET NULL"), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("idx_notifications_user_read", "notifications", ["user_id", "read"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("claims")
    op.drop_table("matches")
    op.drop_table("items")
    op.drop_table("campus_locations")
    op.drop_table("users")
