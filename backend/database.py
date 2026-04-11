import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client["testimonial_db"]
sessions_collection = db["sessions"]

async def get_session(session_id: str):
    """Retrieve a session by its ID."""
    return await sessions_collection.find_one({"_id": session_id})

async def save_session(session_data: dict):
    """Save or update a session document."""
    if "_id" not in session_data:
        raise ValueError("session_data must contain an '_id' field")
    await sessions_collection.replace_one({"_id": session_data["_id"]}, session_data, upsert=True)
