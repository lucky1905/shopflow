from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from datetime import datetime
from typing import Optional


class ProductBase(BaseModel):
    barcode: str = Field(..., min_length=1, max_length=50)
    product_name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    buying_price: Decimal = Field(..., gt=0)
    selling_price: Decimal = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    min_stock: int = Field(..., ge=0)


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    product_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)