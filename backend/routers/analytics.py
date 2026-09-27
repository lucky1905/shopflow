from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Sale, SaleItem, Product

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/")
def dashboard_analytics(db: Session = Depends(get_db)):

    # -----------------------------
    # Total Revenue
    # -----------------------------
    total_revenue = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .scalar()
    )

    # -----------------------------
    # Total Sales
    # -----------------------------
    total_sales = (
        db.query(func.count(Sale.sale_id))
        .scalar()
    )

    # -----------------------------
    # Top Selling Products
    # -----------------------------
    top_products_query = (
        db.query(
            Product.product_name,
            func.sum(SaleItem.quantity).label("quantity")
        )
        .join(
            SaleItem,
            Product.product_id == SaleItem.product_id
        )
        .group_by(Product.product_name)
        .order_by(
            func.sum(SaleItem.quantity).desc()
        )
        .limit(5)
        .all()
    )

    top_products = [
        {
            "product_name": item.product_name,
            "quantity": int(item.quantity)
        }
        for item in top_products_query
    ]

    # -----------------------------
    # Category Wise Sales
    # -----------------------------
    category_query = (
        db.query(
            Product.category,
            func.sum(SaleItem.quantity).label("quantity")
        )
        .join(
            SaleItem,
            Product.product_id == SaleItem.product_id
        )
        .group_by(Product.category)
        .order_by(
            func.sum(SaleItem.quantity).desc()
        )
        .all()
    )

    category_sales = [
        {
            "category": item.category,
            "quantity": int(item.quantity)
        }
        for item in category_query
    ]

    # -----------------------------
    # Revenue Per Day
    # -----------------------------
    revenue_query = (
        db.query(
            func.date(Sale.sale_date).label("date"),
            func.sum(Sale.total_amount).label("revenue")
        )
        .group_by(func.date(Sale.sale_date))
        .order_by(func.date(Sale.sale_date))
        .all()
    )

    daily_sales = [
        {
            "date": str(item.date),
            "revenue": float(item.revenue)
        }
        for item in revenue_query
    ]

    # -----------------------------
    # Owner command-centre figures (Phase 9)
    # -----------------------------
    # Sales are stamped with a naive UTC timestamp, so "today" must be UTC too,
    # otherwise the panel flips over at midnight IST while the ledger has not.
    today = datetime.now(timezone.utc).date()

    today_row = (
        db.query(
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
            func.count(Sale.sale_id).label("sales")
        )
        .filter(func.date(Sale.sale_date) == today)
        .one()
    )

    payment_rows = (
        db.query(
            Sale.payment_method,
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
            func.count(Sale.sale_id).label("sales")
        )
        .group_by(Sale.payment_method)
        .order_by(func.coalesce(func.sum(Sale.total_amount), 0).desc())
        .all()
    )

    payment_breakdown = [
        {
            "method": (row.payment_method or "unknown").lower(),
            "revenue": float(row.revenue),
            "sales": int(row.sales)
        }
        for row in payment_rows
    ]

    # Anything at or below its own reorder point is a low-stock alert.
    low_stock_rows = (
        db.query(Product)
        .filter(Product.stock <= Product.min_stock)
        .order_by(Product.stock.asc())
        .limit(25)
        .all()
    )

    low_stock = [
        {
            "product_id": item.product_id,
            "product_name": item.product_name,
            "stock": int(item.stock or 0),
            "min_stock": int(item.min_stock or 0)
        }
        for item in low_stock_rows
    ]

    # Credit (udhar) sales are owed until they are collected; there is no
    # collections ledger yet, so the whole credit tender total is outstanding.
    outstanding_credit = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.payment_method == "credit")
        .scalar()
    )

    return {
        "total_revenue": float(total_revenue),
        "total_sales": total_sales,
        "top_products": top_products,
        "category_sales": category_sales,
        "daily_sales": daily_sales,
        "today_revenue": float(today_row.revenue),
        "today_sales": int(today_row.sales),
        "payment_breakdown": payment_breakdown,
        "low_stock": low_stock,
        "outstanding_credit": float(outstanding_credit)
    }