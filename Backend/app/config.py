# app/config.py

import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from a `.env` file (if present)
load_dotenv()

class Config:
    """Unified Configuration for Flask App, Database, and Car Assistant"""

    SESSION_COOKIE_SECURE = True  # Ensures cookies are sent over HTTPS only (make sure you're using HTTPS in production)
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)  # Session expiration after 1 hour of inactivity
    REMEMBER_COOKIE_DURATION = timedelta(days=7)  # Duration of "Remember Me" sessions (if you want to implement this)
    SESSION_PROTECTION = 'strong'  # Protect against session hijacking (ensure this is set)

    # --- Flask & Database Settings ---
    SECRET_KEY = os.getenv("SECRET_KEY", "secret_key")  # Replace in production
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URI",
        'mysql+pymysql://root:Cable%40123@localhost/auto_centrale'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- OpenAI API Settings ---
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

    # --- CSV / Data Source Settings ---
    CSV_FILE_PATH = os.getenv("CSV_FILE_PATH", "car_data.csv")

    # --- Matching Thresholds ---
    MANUFACTURER_MATCH_THRESHOLD = int(os.getenv("MANUFACTURER_MATCH_THRESHOLD", 70))
    MODEL_MATCH_THRESHOLD = int(os.getenv("MODEL_MATCH_THRESHOLD", 60))

    # --- Dealer Ranking Weights ---
    PRICE_WEIGHT = float(os.getenv("PRICE_WEIGHT", 0.30))
    LOCATION_WEIGHT = float(os.getenv("LOCATION_WEIGHT", 0.25))
    CONTACT_WEIGHT = float(os.getenv("CONTACT_WEIGHT", 0.20))
    INVENTORY_WEIGHT = float(os.getenv("INVENTORY_WEIGHT", 0.15))
    UPDATE_WEIGHT = float(os.getenv("UPDATE_WEIGHT", 0.10))

    # --- Response Configuration ---
    MAX_DEALERS_RETURNED = int(os.getenv("MAX_DEALERS_RETURNED", 5))
    MAX_RESPONSE_TOKENS = int(os.getenv("MAX_RESPONSE_TOKENS", 512))
    RESPONSE_TEMPERATURE = float(os.getenv("RESPONSE_TEMPERATURE", 0.0))

    # --- Logging Configuration ---
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
