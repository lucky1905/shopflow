from fastapi import FastAPI
from database import engine
from models import Base

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message": "Welcome to ShopFlow API 🚀"}

@app.get("/test")
def test_api():
    return {"status": "Backend Working Successfully"}