import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration settings for the Car Assistant"""
    
    # OpenAI API Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = "gpt-4o"
    
    # CSV Data Configuration
    CSV_FILE_PATH = os.getenv("CSV_FILE_PATH", "car_data.csv")
    
    # Matching Thresholds
    MANUFACTURER_MATCH_THRESHOLD = 70
    MODEL_MATCH_THRESHOLD = 60
    
    # Dealer Ranking Weights
    PRICE_WEIGHT = 0.30
    LOCATION_WEIGHT = 0.25
    CONTACT_WEIGHT = 0.20
    INVENTORY_WEIGHT = 0.15
    UPDATE_WEIGHT = 0.10
    
    # Response Configuration
    MAX_DEALERS_RETURNED = 5
    MAX_RESPONSE_TOKENS = 512
    RESPONSE_TEMPERATURE = 0.0
    
    # Logging Configuration
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"