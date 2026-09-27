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
    # Statutory GST slab percentage: 0 / 5 / 12 / 18 / 28.
    gst_rate: int = Field(default=5, ge=0, le=28)
    hsn_code: Optional[str] = Field(default=None, max_length=8)


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    product_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# BILLING SCHEMAS (Phase 3.2)
# ==========================

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class SaleCreate(BaseModel):
    payment_method: str = Field(..., min_length=1, max_length=50)
    items: list[SaleItemCreate] = Field(..., min_length=1)


class SaleItemResponse(BaseModel):
    sale_item_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class SaleResponse(BaseModel):
    sale_id: int
    user_id: Optional[int] = None
    total_amount: Decimal
    payment_method: str
    sale_date: Optional[datetime] = None
    items: list[SaleItemResponse]
    # GST breakdown; absent on sales recorded before Phase 8.
    taxable_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    cgst: Optional[Decimal] = None
    sgst: Optional[Decimal] = None
    igst: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)

# ==========================
# AUTH SCHEMAS (Phase 7)
# ==========================

class UserResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str
    is_active: bool = True
    # Populated only for employee-workspace sessions (Phase 10).
    employee_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    full_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="admin", max_length=20)


class LoginRequest(BaseModel):
    # Accepts either an email or the login name used by the demo account.
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=1, max_length=128)


class AdminLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=1, max_length=128)


class EmployeeLoginRequest(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    role: str
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(...)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
