from sqlalchemy.orm import Session
from models import Product
from schemas import ProductCreate
from datetime import datetime, timezone


def get_products(db: Session):
    return db.query(Product).all()


def get_product_by_barcode(db: Session, barcode: str):
    return db.query(Product).filter(Product.barcode == barcode).first()


def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(Product.product_id == product_id).first()


def create_product(db: Session, product: ProductCreate):
    db_product = Product(
        barcode=product.barcode,
        product_name=product.product_name,
        category=product.category,
        buying_price=product.buying_price,
        selling_price=product.selling_price,
        stock=product.stock,
        min_stock=product.min_stock,
        created_at=datetime.now(timezone.utc)
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


def update_product(db: Session, product_id: int, product_data: ProductCreate):
    db_product = get_product_by_id(db, product_id)

    if not db_product:
        return None

    db_product.barcode = product_data.barcode
    db_product.product_name = product_data.product_name
    db_product.category = product_data.category
    db_product.buying_price = product_data.buying_price
    db_product.selling_price = product_data.selling_price
    db_product.stock = product_data.stock
    db_product.min_stock = product_data.min_stock

    db.commit()
    db.refresh(db_product)

    return db_product


def delete_product(db: Session, product_id: int):
    db_product = get_product_by_id(db, product_id)

    if not db_product:
        return None

    db.delete(db_product)
    db.commit()

    return db_product