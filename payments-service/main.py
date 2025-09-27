from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
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

FAIL_RATE = 0.30  # 30% failure

@app.post("/payments", response_model=PayOut)
async def pay(body: PayIn):
    if random.random() < FAIL_RATE:
        raise HTTPException(status_code=503, detail={"status":"failed","message":"Payment processor unavailable"})
    return {"status": "success", "message": f"Order {body.orderId} paid: {body.amount:.2f}"}

@app.get("/healthz")
async def healthz():
    return {"ok": True}