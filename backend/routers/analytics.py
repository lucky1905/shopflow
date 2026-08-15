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

    return {
        "total_revenue": float(total_revenue),
        "total_sales": total_sales,
        "top_products": top_products,
        "category_sales": category_sales,
        "daily_sales": daily_sales,
    }