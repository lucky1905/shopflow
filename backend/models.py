from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True)
    product_name = Column(String)
    category = Column(String)
    buying_price = Column(Numeric)
    selling_price = Column(Numeric)
    stock = Column(Integer)
    min_stock = Column(Integer)
    created_at = Column(TIMESTAMP)

    # Indian GST fields (Phase 8).
    # `gst_rate` is one of the statutory slabs: 0 / 5 / 12 / 18 / 28.
    # `hsn_code` is the 4-, 6- or 8-digit HSN/SAC classification, required
    # on every GST invoice line.
    gst_rate = Column(Integer, nullable=False, default=5, server_default="5")
    hsn_code = Column(String, nullable=True)

    sale_items = relationship("SaleItem", back_populates="product")


class Sale(Base):
    __tablename__ = "sales"

    sale_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # nullable until auth (Phase 7) is implemented
    total_amount = Column(Numeric)
    payment_method = Column(String)
    sale_date = Column(TIMESTAMP)

    # GST breakdown (Phase 8). `total_amount` is the GST-inclusive grand
    # total, so `taxable_amount + tax_amount == total_amount`.
    # Intra-state supply records cgst + sgst; inter-state records igst.
    taxable_amount = Column(Numeric, nullable=True)
    tax_amount = Column(Numeric, nullable=True)
    cgst = Column(Numeric, nullable=True)
    sgst = Column(Numeric, nullable=True)
    igst = Column(Numeric, nullable=True)

    sale_items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    sale_item_id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.sale_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer)
    unit_price = Column(Numeric)
    subtotal = Column(Numeric)

    sale = relationship("Sale", back_populates="sale_items")
    product = relationship("Product", back_populates="sale_items")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    # "admin" | "manager" | "cashier" - drives frontend role-based access.
    role = Column(String, nullable=False, default="cashier")
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP, nullable=False)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)  # e.g. "EMP001"
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="cashier")
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP, nullable=False)

