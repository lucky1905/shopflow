import pandas as pd
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# -----------------------------
# Load Dataset
# -----------------------------
BASE_DIR = Path(__file__).parent
DATASET = BASE_DIR / "dataset" / "sales_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(DATASET)

# -----------------------------
# Features & Target
# -----------------------------
X = df[
    [
        "product_name",
        "category",
        "selling_price",
        "stock_before_sale",
        "payment_method",
        "day_of_week",
    ]
]

y = df["quantity_sold"]

# -----------------------------
# Encode Categorical Columns
# -----------------------------
categorical_features = [
    "product_name",
    "category",
    "payment_method",
    "day_of_week",
]

numeric_features = [
    "selling_price",
    "stock_before_sale",
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features,
        ),
        ("num", "passthrough", numeric_features),
    ]
)

# -----------------------------
# Model
# -----------------------------
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)

# -----------------------------
# Train Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)

# -----------------------------
# Train
# -----------------------------
pipeline.fit(X_train, y_train)

# -----------------------------
# Prediction
# -----------------------------
predictions = pipeline.predict(X_test)

# -----------------------------
# Evaluation
# -----------------------------
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print("\n==============================")
print("Model Trained Successfully")
print("==============================")
print(f"MAE Score : {mae:.2f}")
print(f"R² Score  : {r2:.2f}")

# -----------------------------
# Save Model
# -----------------------------
joblib.dump(
    pipeline,
    MODEL_DIR / "sales_model.pkl"
)

print("\nModel saved to:")
print(MODEL_DIR / "sales_model.pkl")