import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "models" / "sales_model.pkl"

model = joblib.load(MODEL_PATH)


def predict_sales(
    product_name,
    category,
    selling_price,
    stock_before_sale,
    payment_method,
    day_of_week,
):

    sample = pd.DataFrame(
        [{
            "product_name": product_name,
            "category": category,
            "selling_price": selling_price,
            "stock_before_sale": stock_before_sale,
            "payment_method": payment_method,
            "day_of_week": day_of_week,
        }]
    )

    prediction = model.predict(sample)

    return round(float(prediction[0]), 2)


if __name__ == "__main__":

    result = predict_sales(
        product_name="Maggi",
        category="Grocery",
        selling_price=15,
        stock_before_sale=60,
        payment_method="UPI",
        day_of_week="Saturday",
    )

    print("=" * 40)
    print("Tomorrow Sales Prediction")
    print("=" * 40)
    print("Predicted Quantity :", result)