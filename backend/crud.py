from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from models import Product, Sale, SaleItem
from schemas import ProductCreate

# Every GST-registered line in India falls into one of 0 / 5 / 12 / 18 / 28.
# Products seeded before GST fields existed fall back to the 5% food/essential
# slab, which is the most common one for a general store.
DEFAULT_GST_RATE = 5
CENT = Decimal("0.01")


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
        created_at=datetime.now(timezone.utc),
        gst_rate=product.gst_rate,
        hsn_code=product.hsn_code,
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
    db_product.gst_rate = product_data.gst_rate
    db_product.hsn_code = product_data.hsn_code

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


# ==========================
# BILLING (Phase 3.2, GST in Phase 8)
# ==========================

def create_sale(
    db: Session,
    payment_method: str,
    validated_items: list[tuple[Product, int]],
    user_id: int | None = None,
    is_inter_state: bool = False,
):
    """
    validated_items is a list of (product, quantity) tuples that have
    ALREADY been checked for existence and sufficient stock by the caller.
    Prices are read from `product.selling_price` here - never from client input.

    GST is computed per line from each product's own `gst_rate`, so a mixed
    basket (5% food + 18% electronics) is taxed correctly rather than at one
    blanket rate. `total_amount` is the GST-INCLUSIVE grand total, which is
    what the customer actually pays, so the POS and the ledger never disagree.
    `is_inter_state` chooses IGST over the CGST+SGST split.
    """
    db_sale = Sale(
        user_id=user_id,  # set from the authenticated caller when available
        total_amount=0,  # placeholder, corrected below once items are totalled
        payment_method=payment_method,
        sale_date=datetime.now(timezone.utc),
        taxable_amount=Decimal("0"),
        tax_amount=Decimal("0"),
        cgst=Decimal("0"),
        sgst=Decimal("0"),
        igst=Decimal("0"),
    )
    db.add(db_sale)
    db.flush()  # assigns db_sale.sale_id without committing yet

    taxable_amount = Decimal("0")
    tax_amount = Decimal("0")

    for product, quantity in validated_items:
        # Defense-in-depth: re-check stock at write time in case it changed
        # between validation and this point (e.g. a concurrent sale).
        if product.stock < quantity:
            raise ValueError(f"Insufficient stock for '{product.product_name}' during transaction.")

        unit_price = product.selling_price
        subtotal = unit_price * quantity
        taxable_amount += subtotal

        # Statutory slab carried on the product (0/5/12/18/28).
        line_rate = Decimal(
            str(product.gst_rate if product.gst_rate is not None else DEFAULT_GST_RATE)
        )
        tax_amount += (subtotal * line_rate / Decimal("100")).quantize(
            CENT, rounding=ROUND_HALF_UP
        )

        db_sale_item = SaleItem(
            sale_id=db_sale.sale_id,
            product_id=product.product_id,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal
        )
        db.add(db_sale_item)

        product.stock -= quantity

    taxable_amount = taxable_amount.quantize(CENT, rounding=ROUND_HALF_UP)
    tax_amount = tax_amount.quantize(CENT, rounding=ROUND_HALF_UP)

    db_sale.taxable_amount = taxable_amount
    db_sale.tax_amount = tax_amount
    db_sale.total_amount = taxable_amount + tax_amount

    # Intra-state supply splits the tax evenly between the centre and the
    # state; inter-state supply levies the whole amount as IGST.
    if is_inter_state:
        db_sale.igst = tax_amount
        db_sale.cgst = Decimal("0")
        db_sale.sgst = Decimal("0")
    else:
        half = (tax_amount / 2).quantize(CENT, rounding=ROUND_HALF_UP)
        db_sale.cgst = half
        # The remainder, not another half, so cgst + sgst provably == tax_amount.
        db_sale.sgst = tax_amount - half
        db_sale.igst = Decimal("0")

    db.commit()
    db.refresh(db_sale)
    return db_sale


def get_sales(db: Session):
    return db.query(Sale).order_by(Sale.sale_date.desc()).all()


def get_sale_by_id(db: Session, sale_id: int):
    return db.query(Sale).filter(Sale.sale_id == sale_id).first()
