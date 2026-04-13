from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    load_dotenv(ROOT_DIR / '.env', override=True)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

RATE_PER_BLOCK = 60  # ₹60 per 15-min block
BLOCK_MINUTES = 15
ADMIN_PASSWORD = "sahilritesh123"

# --- Models ---

class StartGameRequest(BaseModel):
    customer_name: str
    customer_phone: str

class EndGameResponse(BaseModel):
    table_number: int
    customer_name: str
    customer_phone: str
    start_time: str
    end_time: str
    duration_minutes: float
    total_amount: int

class AdminLoginRequest(BaseModel):
    password: str

# --- Seed tables on startup ---

@app.on_event("startup")
async def seed_tables():
    for i in range(1, 5):
        existing = await db.tables.find_one({"table_number": i}, {"_id": 0})
        if not existing:
            await db.tables.insert_one({
                "table_number": i,
                "status": "available",
                "current_session_id": None
            })
    logging.info("Tables seeded successfully")

# --- Routes ---

@api_router.get("/tables")
async def get_tables():
    tables = await db.tables.find({}, {"_id": 0}).to_list(10)
    result = []
    for t in tables:
        table_data = {
            "table_number": t["table_number"],
            "status": t["status"],
            "current_session_id": t.get("current_session_id"),
        }
        if t["status"] == "active" and t.get("current_session_id"):
            session = await db.sessions.find_one(
                {"session_id": t["current_session_id"]},
                {"_id": 0}
            )
            if session:
                table_data["session"] = session
        result.append(table_data)
    return result


@api_router.post("/start-game/{table_number}")
async def start_game(table_number: int, req: StartGameRequest):
    if table_number < 1 or table_number > 4:
        raise HTTPException(status_code=400, detail="Invalid table number")

    table = await db.tables.find_one({"table_number": table_number}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    if table["status"] == "active":
        raise HTTPException(status_code=400, detail="Table is already in use")

    now = datetime.now(timezone.utc)
    session_id = f"sess_{table_number}_{int(now.timestamp())}"

    session_doc = {
        "session_id": session_id,
        "table_number": table_number,
        "customer_name": req.customer_name,
        "customer_phone": req.customer_phone,
        "start_time": now.isoformat(),
        "end_time": None,
        "total_amount": 0,
        "status": "active"
    }
    await db.sessions.insert_one(session_doc)

    await db.tables.update_one(
        {"table_number": table_number},
        {"$set": {"status": "active", "current_session_id": session_id}}
    )

    del session_doc["_id"]
    return session_doc


@api_router.post("/end-game/{table_number}")
async def end_game(table_number: int):
    if table_number < 1 or table_number > 4:
        raise HTTPException(status_code=400, detail="Invalid table number")

    table = await db.tables.find_one({"table_number": table_number}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    if table["status"] != "active":
        raise HTTPException(status_code=400, detail="Table is not active")

    session = await db.sessions.find_one(
        {"session_id": table["current_session_id"]},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.now(timezone.utc)
    start = datetime.fromisoformat(session["start_time"])
    duration_seconds = (now - start).total_seconds()
    duration_minutes = duration_seconds / 60
    blocks = max(1, math.ceil(duration_minutes / BLOCK_MINUTES))
    total_amount = blocks * RATE_PER_BLOCK

    await db.sessions.update_one(
        {"session_id": session["session_id"]},
        {"$set": {
            "end_time": now.isoformat(),
            "total_amount": total_amount,
            "status": "completed",
            "duration_minutes": round(duration_minutes, 2)
        }}
    )

    await db.tables.update_one(
        {"table_number": table_number},
        {"$set": {"status": "available", "current_session_id": None}}
    )

    return {
        "table_number": table_number,
        "customer_name": session["customer_name"],
        "customer_phone": session["customer_phone"],
        "start_time": session["start_time"],
        "end_time": now.isoformat(),
        "duration_minutes": round(duration_minutes, 2),
        "total_amount": total_amount
    }


@api_router.get("/sessions")
async def get_sessions():
    sessions = await db.sessions.find({}, {"_id": 0}).sort("start_time", -1).to_list(100)
    return sessions


@api_router.get("/dashboard-stats")
async def get_dashboard_stats():
    all_sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    total_sessions = len(all_sessions)
    active_sessions = sum(1 for s in all_sessions if s["status"] == "active")
    completed = [s for s in all_sessions if s["status"] == "completed"]
    total_revenue = sum(s.get("total_amount", 0) for s in completed)

    tables = await db.tables.find({}, {"_id": 0}).to_list(10)
    table_statuses = []
    for t in tables:
        td = {"table_number": t["table_number"], "status": t["status"]}
        if t["status"] == "active" and t.get("current_session_id"):
            sess = await db.sessions.find_one(
                {"session_id": t["current_session_id"]}, {"_id": 0}
            )
            if sess:
                td["session"] = sess
        table_statuses.append(td)

    return {
        "total_revenue": total_revenue,
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "tables": table_statuses
    }


@api_router.post("/admin-login")
async def admin_login(req: AdminLoginRequest):
    if req.password == ADMIN_PASSWORD:
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
