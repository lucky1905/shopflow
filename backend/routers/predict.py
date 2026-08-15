from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Product, SaleItem
from ml.predict import predict_sales

router = APIRouter(
    prefix="/predict",
    tags=["AI Prediction"]
)


@router.get("/insights")
def ai_insights(db: Session = Depends(get_db)):
    """
    Returns:
    - Top Selling Product
    - Current Stock
    - Tomorrow Sales Prediction
    - Recommended Restock
    - Model Accuracy
    """

    result = (
        db.query(
            SaleItem.product_id,
            Product.product_name,
            Product.category,
            Product.selling_price,
            Product.stock,
            func.sum(SaleItem.quantity).label("total_sold"),
        )
        .join(Product, Product.product_id == SaleItem.product_id)
        .group_by(
            SaleItem.product_id,
            Product.product_name,
            Product.category,
            Product.selling_price,
            Product.stock,
        )
        .order_by(func.sum(SaleItem.quantity).desc())
        .first()
    )

    if not result:
        return {
            "top_product": "No Sales Yet",
            "current_stock": 0,
            "predicted_sales": 0,
            "recommended_order": 0,
            "model_accuracy": 0.74,
            "status": "Waiting for sales data",
        }

    today = datetime.now().strftime("%A")

    predicted_sales = predict_sales(
        product_name=result.product_name,
        category=result.category,
        selling_price=result.selling_price,
        stock_before_sale=result.stock,
        payment_method="UPI",
        day_of_week=today,
    )

    current_stock = result.stock

    # Shopkeeper-friendly restock logic
    safety_stock = 20

    if current_stock <= predicted_sales:
        recommended_order = round(
            predicted_sales + safety_stock - current_stock
        )
    elif current_stock < 30:
        recommended_order = max(
            20,
            round(30 - current_stock)
        )
    else:
        recommended_order = 0

    if recommended_order == 0:
        status = "Stock is sufficient"
    else:
        status = "Restock Recommended"

    return {
        "top_product": result.product_name,
        "current_stock": current_stock,
        "predicted_sales": round(predicted_sales, 2),
        "recommended_order": recommended_order,
        "total_units_sold": int(result.total_sold),
        "model_name": "Random Forest Regressor",
        "model_accuracy": 0.74,
        "status": status,
    }