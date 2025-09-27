import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

import httpx

app = FastAPI(title="Order Service")

CATALOG_URL = os.getenv("CATALOG_URL", "http://localhost:8001")

class OrderItemIn(BaseModel):
    bookId: int = Field(..., ge=1, alias="bookId")
    quantity: int = Field(..., ge=1)

class CreateOrderIn(BaseModel):
    items: List[OrderItemIn]

class CreateOrderOut(BaseModel):
    orderId: int
    total: float

# in-memory store
ORDERS = {}
NEXT_ID = 1

async def fetch_catalog_prices():
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.get(f"{CATALOG_URL}/books", headers={"Accept": "application/json"})
        r.raise_for_status()
        return r.json()

@app.post("/orders", response_model=CreateOrderOut)
async def create_order(payload: CreateOrderIn):
    global NEXT_ID
    # pull catalog and build price map
    try:
        books = await fetch_catalog_prices()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Upstream catalog unavailable")

    price_by_id = {b["id"]: float(b["price"]) for b in books}

    total = 0.0
    for it in payload.items:
        if it.bookId not in price_by_id:
            raise HTTPException(status_code=400, detail=f"Unknown bookId {it.bookId}")
        total += price_by_id[it.bookId] * it.quantity

    oid = NEXT_ID
    NEXT_ID += 1
    ORDERS[oid] = {"id": oid, "items": [it.model_dump(by_alias=True) for it in payload.items], "total": round(total, 2)}
    return {"orderId": oid, "total": round(total, 2)}

@app.get("/orders/{order_id}")
async def read_order(order_id: int):
    o = ORDERS.get(order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    return o

@app.get("/healthz")
async def healthz():
    return {"ok": True}