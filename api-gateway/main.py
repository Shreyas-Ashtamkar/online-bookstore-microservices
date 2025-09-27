import os

import httpx

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from circuitbreaker import circuit, CircuitBreakerError


BASE_PATH = os.getenv("BASE_PATH", "/").rstrip("/")
CATALOG_URL = os.getenv("CATALOG_URL", "http://localhost:8001")
ORDERS_URL  = os.getenv("ORDERS_URL",  "http://localhost:8002")
PAYMENTS_URL= os.getenv("PAYMENTS_URL","http://localhost:8003")

app = FastAPI(title="API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def path(p: str) -> str:
    return f"{BASE_PATH}{p}"



@app.get(path("/catalog/books"))
async def list_books():
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{CATALOG_URL}/books", headers={"Accept":"application/json"})
            return JSONResponse(status_code=r.status_code, content=r.json())
        except httpx.HTTPError:
            # let this be an exception so upstream failures are visible (not swallowed)
            raise HTTPException(status_code=502, detail={"message":"Catalog unreachable"})

@app.get(path("/orders"))
async def list_orders(page: int = 1, per_page: int = 10):
    params = {"page": page, "per_page": per_page}
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{ORDERS_URL}/orders", params=params, headers={"Accept":"application/json"})
            return JSONResponse(status_code=r.status_code, content=r.json())
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail={"message":"Orders unreachable"})

@app.get(path("/orders/{order_id}"))
async def get_order(order_id: int):
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{ORDERS_URL}/orders/{order_id}", headers={"Accept":"application/json"})
            return JSONResponse(status_code=r.status_code, content=r.json())
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail={"message":"Orders unreachable"})

@app.post(path("/orders"))
async def create_order(req: Request):
    body = await req.json()
    headers = {"Content-Type":"application/json", "Accept":"application/json"}
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.post(f"{ORDERS_URL}/orders", json=body, headers=headers)
            if r.headers.get("content-type","").startswith("application/json"):
                return JSONResponse(status_code=r.status_code, content=r.json())
            return JSONResponse(status_code=r.status_code, content={"message":"Unexpected response"})
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail={"message":"Orders unreachable"})

@app.get(path("/payments"))
async def list_payments(page_no: int = 1, per_page: int = 10):
    params = {"page_no": page_no, "per_page": per_page}
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{PAYMENTS_URL}/payments", params=params, headers={"Accept":"application/json"})
            return JSONResponse(status_code=r.status_code, content=r.json())
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail={"message":"Payments unreachable"})

@app.post(path("/payments"))
@circuit(name='payment_circuit', failure_threshold=3, recovery_timeout=1)
async def pay_for_order(req: Request):
    body = await req.json()
    headers = {"Content-Type":"application/json", "Accept":"application/json"}
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(f"{PAYMENTS_URL}/payments", json=body, headers=headers)

    if r.status_code >= 500:
        try:
            upstream = r.json()
        except Exception:
            upstream = {"status":"failed","message":"Payment error"}
        raise HTTPException(503, f"Upstream payment 5xx: {upstream}")

    # 4xx are client errors; usually don't trip breaker (return as-is)
    if 400 <= r.status_code < 500:
        try:
            payload = r.json()
        except Exception:
            payload = {"status":"failed","message":"Payment error"}
        return JSONResponse(status_code=r.status_code, content=payload)

    # Success
    return JSONResponse(status_code=200, content=r.json())

@app.get("/healthz")
async def healthz():
    return {
        "ok": True, 
        "routes": {
            "books": path("/catalog/books"), 
            "orders": path("/orders"), 
            "order_detail": path("/orders/{order_id}"),
            "payments": path("/payments")
        }
    }

@app.exception_handler(CircuitBreakerError)
async def circuit_open_handler(request: Request, exc: CircuitBreakerError):
    # CircuitBreakerError does not expose the circuit instance directly
    name = "unknown"
    retry_after = None
    # If the circuitbreaker library provides details in args, try to extract them
    if hasattr(exc, "args") and exc.args:
        # Example: exc.args[0] might contain a message with the circuit name
        msg = str(exc.args[0])
        if "payment_circuit" in msg:
            name = "payment_circuit"

    body = {
        "status": "failed",
        "message": "Upstream temporarily unavailable (circuit open)",
        "circuit": name,
    }
    if retry_after is not None:
        body["retryAfterSeconds"] = retry_after

    headers = {}
    if retry_after is not None:
        headers["Retry-After"] = str(retry_after)

    # 503 Service Unavailable is the correct code for open circuits
    return JSONResponse(status_code=503, content=body, headers=headers)