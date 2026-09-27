"""Lightweight, idempotent schema migrations.

`Base.metadata.create_all()` creates *missing tables* but never alters an
existing one, so new columns added after a database already exists have to be
applied by hand. Everything here is written to be safe to run on every startup
and safe to run twice.

These are deliberately plain `ALTER TABLE ... IF NOT EXISTS` statements rather
than a migration framework: the app is a single-service deployment and the
column additions are purely additive (no data backfill, no destructive change).
"""

import logging

from sqlalchemy import text

from database import engine

logger = logging.getLogger(__name__)

# (description, SQL). PostgreSQL supports ADD COLUMN IF NOT EXISTS.
_STATEMENTS: list[tuple[str, str]] = [
    (
        "products.gst_rate",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate INTEGER NOT NULL DEFAULT 5",
    ),
    (
        "products.hsn_code",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(8)",
    ),
    (
        "sales.taxable_amount",
        "ALTER TABLE sales ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC",
    ),
    (
        "sales.tax_amount",
        "ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_amount NUMERIC",
    ),
    ("sales.cgst", "ALTER TABLE sales ADD COLUMN IF NOT EXISTS cgst NUMERIC"),
    ("sales.sgst", "ALTER TABLE sales ADD COLUMN IF NOT EXISTS sgst NUMERIC"),
    ("sales.igst", "ALTER TABLE sales ADD COLUMN IF NOT EXISTS igst NUMERIC"),
    (
        "employees_table",
        """CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'cashier',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )""",
    ),
]


def run_migrations() -> None:
    """Applies additive column migrations. Never raises — startup must not fail."""
    try:
        with engine.begin() as connection:
            for label, statement in _STATEMENTS:
                connection.execute(text(statement))
        logger.info("Schema migrations applied (%d statements).", len(_STATEMENTS))
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Schema migration skipped: %s", exc)
