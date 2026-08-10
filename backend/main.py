from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base
from schemas import ProductCreate, ProductResponse

from crud import (
    get_products,
    get_product_by_barcode,
    get_product_by_id,
    create_product,
    update_product
)


app = FastAPI()

Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {
        "message": "Welcome to ShopFlow API 🚀"
    }


@app.get("/test")
def test():
    return {
        "status": "Backend Working Successfully"
    }


@app.get("/products")
def all_products(db: Session = Depends(get_db)):
    return get_products(db)


@app.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    existing = get_product_by_barcode(db, product.barcode)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with barcode '{product.barcode}' already exists."
        )

    return create_product(db, product)


@app.get(
    "/products/barcode/{barcode}",
    response_model=ProductResponse
)
def get_product_by_barcode_route(
    barcode: str,
    db: Session = Depends(get_db)
):
    product = get_product_by_barcode(db, barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No product found with barcode '{barcode}'."
        )

    return product


@app.get(
    "/products/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = get_product_by_id(db, product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No product found with id {product_id}."
        )

    return product


@app.put(
    "/products/{product_id}",
    response_model=ProductResponse
)
def edit_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    existing_product = get_product_by_id(db, product_id)

    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No product found with id {product_id}."
        )

    barcode_owner = get_product_by_barcode(db, product.barcode)

    if barcode_owner and barcode_owner.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Barcode '{product.barcode}' is already used by another product."
        )

    return update_product(db, product_id, product)

from crud import delete_product


@app.delete("/products/{product_id}")
def remove_product(product_id: int, db: Session = Depends(get_db)):
    deleted = delete_product(db, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No product found with id {product_id}."
        )
    return {"message": f"Product '{deleted.product_name}' (id {product_id}) deleted successfully."}
from crud import create_sale
from schemas import SaleCreate, SaleResponse, SaleItemResponse


@app.post("/sales", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def make_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    # Step 1: validate every item BEFORE writing anything to the database
    validated_items = []
    for item in sale.items:
        product = get_product_by_id(db, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} does not exist."
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.product_name}'. "
                    f"Available: {product.stock}, requested: {item.quantity}."
                )
            )
        validated_items.append((product, item.quantity))

    # Step 2: create the sale as one atomic transaction
    try:
        db_sale = create_sale(db, sale.payment_method, validated_items)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sale. Transaction rolled back, no stock was changed."
        )

    # Step 3: build the response explicitly.
    # (Sale's relationship attribute is named `sale_items`, but SaleResponse's
    # field is named `items` — mapped manually here instead of relying on
    # automatic attribute matching.)
    return SaleResponse(
        sale_id=db_sale.sale_id,
        user_id=db_sale.user_id,
        total_amount=db_sale.total_amount,
        payment_method=db_sale.payment_method,
        sale_date=db_sale.sale_date,
        items=[SaleItemResponse.model_validate(si) for si in db_sale.sale_items]
    )