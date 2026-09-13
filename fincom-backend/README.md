# Fincom Backend

FastAPI + PostgreSQL backend for the Fincom bank comparison platform
(loans, accounts, insurance, credit score).

## Setup

1. Create a virtual environment and install dependencies:
   ```
   python3 -m venv venv
   source venv/bin/activate        # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Make sure `fincom_dev` exists in Postgres and `db/schema.sql` has
   been run against it (via pgAdmin's Query Tool, or `psql`).

3. Copy `.env.example` to `.env` and fill in your real Postgres
   password and JWT secret.

4. Run the API:
   ```
   uvicorn app.main:app --reload --port 8000
   ```

5. Open http://localhost:8000/docs for interactive Swagger docs of
   every endpoint (FastAPI generates this automatically).

## Project layout

- `app/core/config.py` — settings loaded from `.env`
- `app/db/` — async SQLAlchemy engine/session + declarative base
- `app/models/` — ORM models mapped to the tables in `db/schema.sql`
  (SQLAlchemy queries these tables; it never creates or migrates them)
- `app/schemas/` — Pydantic request/response shapes
- `app/services/` — business logic, kept separate from routers so it's
  independently testable (e.g. `loan_calculator.py` — the amortization
  math behind Compare Loans)
- `app/routers/` — one file per resource, mirroring the Angular app's
  own folder structure (`accounts`, `loans`, `insurance`, etc.)

## Verified working

- `GET /banks` — returns all 17 seeded banks
- `GET /loans/compare?amount=20000000&term_months=24&category=education`
  — reproduces the exact figures shown in the live Angular app
  (1,022,808 UGX/month, 24,747,389 UGX total cost for Equity's Elimu
  Education Loan), computed from raw rate data, not hardcoded.

## Not yet built

- Auth (register/login/JWT) — `auth.ts` on the frontend is currently
  localStorage-only with no real backend check
- `accounts` and `insurance` routers (same pattern as `loans`, not yet
  written)
- Credit score endpoints
- Redis caching layer for comparison queries (see architecture notes)
