from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP
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