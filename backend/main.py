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