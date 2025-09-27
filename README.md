# Online Bookstore App

This project is a demo microservices-based online bookstore application. It showcases a modern cloud-native architecture using FastAPI, React, Docker, and a simple circuit breaker pattern.

## Architecture

The application consists of the following services:

- **bookstore-ui**: React frontend for browsing books, managing cart, and checkout.
- **api-gateway**: FastAPI gateway that routes requests to backend services and implements a circuit breaker for payment failures.
- **catalog-service**: FastAPI service providing book catalog data.
- **orders-service**: FastAPI service for order creation and retrieval.
- **payments-service**: FastAPI service simulating payment processing with random failures.

All services are containerized and orchestrated using Docker Compose.

## Features

- Browse a catalog of books.
- Add books to cart and checkout.
- Place orders and process payments.
- Circuit breaker in API Gateway to handle repeated payment failures gracefully.
- Modern React UI with Tailwind CSS.

## Running Locally

1. **Prerequisites**: Docker and Docker Compose installed.
2. **Start all services**:
   ```sh
   docker compose up --build -d
   ```
3. **Access the UI**: Open [http://localhost](http://localhost) in your browser.

## Service Ports

- **bookstore-ui**: 80 (mapped to 5173 internally)
- **api-gateway**: 8000
- **catalog-service**: 8001
- **orders-service**: 8002
- **payments-service**: 8003

## Circuit Breaker Demo

The payments service randomly fails (30% chance). After repeated failures, the API Gateway's circuit breaker will open, returning a friendly error message to the UI.

## Testing

A sample PowerShell script `test_service.ps1` is included to stress-test the payments endpoint.

## Technologies Used

- FastAPI
- React
- Tailwind CSS
- Docker & Docker Compose

## Folder Structure

- `api-gateway/`
- `catalog-service/`
- `orders-service/`
- `payments-service/`
- `bookstore-ui/`
- `docker-compose.yml`

---

This project is for educational/demo purposes.