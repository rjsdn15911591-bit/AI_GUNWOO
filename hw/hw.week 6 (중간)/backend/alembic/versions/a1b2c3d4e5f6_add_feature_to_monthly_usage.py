"""add feature column to monthly_usage

Revision ID: a1b2c3d4e5f6
Revises: faa6f8509760
Create Date: 2026-04-26 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'faa6f8509760'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # feature 컬럼 추가 (기존 데이터는 'analysis'로 설정)
    op.add_column(
        'monthly_usage',
        sa.Column('feature', sa.String(length=20), nullable=False, server_default='analysis'),
    )

    # 기존 unique constraint / index 제거
    op.drop_constraint('unique_user_year_month', 'monthly_usage', type_='unique')
    op.drop_index('idx_monthly_usage_user_year_month', table_name='monthly_usage')

    # feature 포함 새 unique constraint / index 추가
    op.create_unique_constraint(
        'unique_user_year_month_feature',
        'monthly_usage',
        ['user_id', 'year_month', 'feature'],
    )
    op.create_index(
        'idx_monthly_usage_user_year_month_feature',
        'monthly_usage',
        ['user_id', 'year_month', 'feature'],
    )


def downgrade() -> None:
    op.drop_constraint('unique_user_year_month_feature', 'monthly_usage', type_='unique')
    op.drop_index('idx_monthly_usage_user_year_month_feature', table_name='monthly_usage')
    op.drop_column('monthly_usage', 'feature')
    op.create_unique_constraint(
        'unique_user_year_month', 'monthly_usage', ['user_id', 'year_month']
    )
    op.create_index(
        'idx_monthly_usage_user_year_month', 'monthly_usage', ['user_id', 'year_month']
    )
