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

    sale_items = relationship("SaleItem", back_populates="product")


class Sale(Base):
    __tablename__ = "sales"

    sale_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # nullable until auth (Phase 7) is implemented
    total_amount = Column(Numeric)
    payment_method = Column(String)
    sale_date = Column(TIMESTAMP)

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