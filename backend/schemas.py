from pydantic import BaseModel

class ProductCreate(BaseModel):
    barcode: str
    product_name: str
    category: str
    buying_price: float
    selling_price: float
    stock: int
    min_stock: int