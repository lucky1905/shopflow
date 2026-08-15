import pandas as pd
import matplotlib.pyplot as plt

# Load dataset
df = pd.read_csv("dataset/sales_dataset.csv")

print("\n===== First 5 Rows =====")
print(df.head())

print("\n===== Dataset Info =====")
print(df.info())

print("\n===== Missing Values =====")
print(df.isnull().sum())

print("\n===== Summary =====")
print(df.describe())

print("\n===== Top Selling Products =====")
print(df.groupby("product_name")["quantity_sold"].sum().sort_values(ascending=False))

print("\n===== Payment Methods =====")
print(df["payment_method"].value_counts())

# Bar Chart
top_products = (
    df.groupby("product_name")["quantity_sold"]
      .sum()
      .sort_values(ascending=False)
)

plt.figure(figsize=(10,5))
top_products.plot(kind="bar", color="skyblue")
plt.title("Top Selling Products")
plt.ylabel("Quantity Sold")
plt.tight_layout()
plt.show()