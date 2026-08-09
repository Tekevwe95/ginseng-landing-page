# Ginseng Plus API

FastAPI + PostgreSQL backend plan for Payment on Delivery orders.

## API

`POST /api/orders` creates an order.

`GET /api/orders/{order_id}` returns an order.

`GET /health` returns API health.

## Environment variables

Copy `.env.example` to `.env` and set `DATABASE_URL` and `CORS_ORIGINS`.

Never commit `.env` or production secrets to GitHub.

## Local development

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
