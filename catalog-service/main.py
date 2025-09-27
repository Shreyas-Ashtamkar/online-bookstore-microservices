from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Catalog Service")

class Book(BaseModel):
    id: int
    title: str
    price: float

BOOKS: List[Book] = [
    Book(id=1, title="How to Debug Your Life", price=42.0),
    Book(id=2, title="The Art of Stack Overflow Copy-Paste", price=39.99),
    Book(id=3, title="Depressed Coder's Survival Guide", price=27.5),
    Book(id=4, title="Coffee Driven Development", price=19.99),
    Book(id=5, title="404 Motivation Not Found", price=25.0),
    Book(id=6, title="Git Commit, Git Push, Git Therapy", price=34.5),
    Book(id=7, title="Infinite Loop: Tales of Sleepless Nights", price=29.0),
    Book(id=8, title="Rubber Duck Debugging for Beginners", price=21.0),
    Book(id=9, title="How to Fix It: Just Restart", price=18.75),
    Book(id=10, title="The Joy of Semicolons", price=23.0),
]

@app.get("/books", response_model=List[Book])
async def list_books():
    return BOOKS

@app.get("/healthz")
async def healthz():
    return {"ok": True}
