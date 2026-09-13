from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models 
from app.core.config import settings
from app.routers import accounts, auth, banks, credit_score, insurance, loans

app = FastAPI(title="Fincom API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(banks.router)
app.include_router(loans.router)
app.include_router(accounts.router)
app.include_router(insurance.router)
app.include_router(credit_score.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
