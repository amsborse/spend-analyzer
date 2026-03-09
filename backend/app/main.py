from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.database import init_db
from app.routers import health, transactions, analytics

app = FastAPI(title="Spend Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(health.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
