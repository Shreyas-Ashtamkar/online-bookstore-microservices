from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Catalog Service")

class Book(BaseModel):
    id: int
    title: str
    price: float

BOOKS: List[Book] = [
    Book(id=1, title="Clean Architecture", price=42.0),
    Book(id=2, title="Designing Data-Intensive Applications", price=55.5),
    Book(id=3, title="The Pragmatic Programmer", price=38.0),
    Book(id=4, title="The Awesome Programmer", price=78.0),
    Book(id=5, title="The Depressed Coder", price=638.0),
]

@app.get("/books", response_model=List[Book])
async def list_books():
    return BOOKS

@app.get("/healthz")
async def healthz():
    return {"ok": True}
