import pandas as pd
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

# Product Details
products = {
    "Maggi": {"category": "Grocery", "price": 15, "base": 18},
    "Bread": {"category": "Bakery", "price": 35, "base": 15},
    "Milk": {"category": "Dairy", "price": 60, "base": 16},
    "Rice": {"category": "Grocery", "price": 70, "base": 7},
    "Sugar": {"category": "Grocery", "price": 45, "base": 8},
    "Tea": {"category": "Beverage", "price": 120, "base": 9},
    "Coffee": {"category": "Beverage", "price": 180, "base": 5},
    "Soap": {"category": "Personal Care", "price": 40, "base": 4},
    "Shampoo": {"category": "Personal Care", "price": 180, "base": 3},
    "Toothpaste": {"category": "Personal Care", "price": 95, "base": 6},
    "Biscuit": {"category": "Snacks", "price": 25, "base": 11},
    "Chips": {"category": "Snacks", "price": 20, "base": 10},
    "Cold Drink": {"category": "Beverage", "price": 40, "base": 8},
    "Juice": {"category": "Beverage", "price": 55, "base": 7},
    "Butter": {"category": "Dairy", "price": 55, "base": 6},
}

# Product popularity
weights = [
    14, 12, 12, 6, 6,
    7, 4, 3, 2, 5,
    9, 8, 6, 5, 4
]

product_names = list(products.keys())

payments = ["UPI", "Cash", "Card"]
payment_weights = [0.55, 0.30, 0.15]

rows = []

start_date = datetime(2025, 1, 1)

for _ in range(3000):

    product = random.choices(product_names, weights=weights, k=1)[0]

    info = products[product]

    date = start_date + timedelta(days=random.randint(0, 364))

    weekday = date.strftime("%A")

    month = date.month

    qty = info["base"]

    # Weekend boost
    if weekday in ["Saturday", "Sunday"]:
        qty += random.randint(3, 7)

    # Summer effect
    if month in [4, 5, 6]:
        if product in ["Cold Drink", "Juice"]:
            qty += random.randint(5, 10)

    # Winter effect
    if month in [11, 12, 1]:
        if product in ["Tea", "Coffee"]:
            qty += random.randint(3, 7)

    # Festival season
    if month in [10, 11]:
        qty += random.randint(2, 5)

    qty += random.randint(-2, 2)

    qty = max(1, qty)

    stock_before_sale = qty + random.randint(20, 70)

    rows.append({
        "date": date.strftime("%Y-%m-%d"),
        "day_of_week": weekday,
        "month": month,
        "product_name": product,
        "category": info["category"],
        "selling_price": info["price"],
        "stock_before_sale": stock_before_sale,
        "payment_method": random.choices(
            payments,
            weights=payment_weights,
            k=1
        )[0],
        "quantity_sold": qty
    })

df = pd.DataFrame(rows)

dataset_dir = Path(__file__).parent / "dataset"
dataset_dir.mkdir(exist_ok=True)

output = dataset_dir / "sales_dataset.csv"

df.to_csv(output, index=False)

print("=================================")
print("Dataset Generated Successfully")
print("=================================")
print(df.head())
print("\nRows:", len(df))
print("\nSaved at:", output)