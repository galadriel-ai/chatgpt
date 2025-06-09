"""add sequence column to message table

Revision ID: 000000000005
Revises: 000000000004
Create Date: 2025-06-06 15:17:27.775602

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "000000000005"
down_revision: Union[str, None] = "000000000004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if column exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("message")]

    if "sequence_number" not in columns:
        op.add_column(
            "message", sa.Column("sequence_number", sa.Integer(), nullable=True)
        )

        # Update existing records with sequence numbers
        op.execute("""
            WITH numbered_messages AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at, id) as row_num 
                FROM message
            ) 
            UPDATE message 
            SET sequence_number = numbered_messages.row_num 
            FROM numbered_messages 
            WHERE message.id = numbered_messages.id
        """)

        # Make column NOT NULL
        op.alter_column(
            "message", "sequence_number", existing_type=sa.Integer(), nullable=False
        )


def downgrade() -> None:
    op.drop_column("message", "sequence_number")
