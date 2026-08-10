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

from datetime import datetime, timezone
from models import Sale, SaleItem


def create_sale(db: Session, payment_method: str, validated_items: list[tuple[Product, int]]):
    """
    validated_items is a list of (product, quantity) tuples that have
    ALREADY been checked for existence and sufficient stock by the caller.
    Prices are read from `product.selling_price` here — never from client input.
    """
    db_sale = Sale(
        user_id=None,  # no auth yet (Phase 7)
        total_amount=0,  # placeholder, corrected below once items are totalled
        payment_method=payment_method,
        sale_date=datetime.now(timezone.utc)
    )
    db.add(db_sale)
    db.flush()  # assigns db_sale.sale_id without committing yet

    total_amount = 0

    for product, quantity in validated_items:
        # Defense-in-depth: re-check stock at write time in case it changed
        # between validation and this point (e.g. a concurrent sale).
        if product.stock < quantity:
            raise ValueError(f"Insufficient stock for '{product.product_name}' during transaction.")

        unit_price = product.selling_price
        subtotal = unit_price * quantity
        total_amount += subtotal

        db_sale_item = SaleItem(
            sale_id=db_sale.sale_id,
            product_id=product.product_id,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal
        )
        db.add(db_sale_item)

        product.stock -= quantity

    db_sale.total_amount = total_amount

    db.commit()
    db.refresh(db_sale)
    return db_sale

def get_sales(db: Session):
    return db.query(Sale).order_by(Sale.sale_date.desc()).all()


def get_sale_by_id(db: Session, sale_id: int):
    return db.query(Sale).filter(Sale.sale_id == sale_id).first()