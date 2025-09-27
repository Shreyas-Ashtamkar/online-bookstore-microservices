from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
import random

app = FastAPI(title="Payments Service")

class OrderItemIn(BaseModel):
    bookId: int = Field(..., ge=1, alias="bookId")
    quantity: int = Field(..., ge=1)
    
class PayIn(BaseModel):
    orderId: int = Field(..., ge=1)
    amount: float = Field(..., ge=0)

class PayOut(BaseModel):
    status: str
    message: str | None = None

class PaymentRecord(BaseModel):
    orderId: int
    amount: float
    datetime: str

FAIL_RATE = 0.30  # 30% failure

payments_db = []

@app.get("/payments", response_model=list[PaymentRecord])
async def get_payments(page_no: int = Query(1, ge=1), per_page: int = Query(10, ge=1)):
    start = (page_no - 1) * per_page
    end = start + per_page
    return payments_db[start:end]

@app.post("/payments", response_model=PayOut)
async def pay(body: PayIn):
    if random.random() < FAIL_RATE:
        raise HTTPException(status_code=503, detail={"status":"failed","message":"Payment processor unavailable"})
    payment_record = {
        "orderId": body.orderId,
        "amount": body.amount,
        "datetime": datetime.now().isoformat()
    }
    payments_db.append(payment_record)
    return {"status": "success", "message": f"Order {body.orderId} paid: {body.amount:.2f}"}

@app.get("/healthz")
async def healthz():
    return {"ok": True}