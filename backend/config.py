"""Application configuration."""
import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "SignalRx"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Explainable AI Engine for Early Detection of Patient Safety Signals from Social Data"

# API Keys (optional - system works with simulated data if not provided)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "SignalRx:v1.0 (by /u/SignalRx)")
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Gmail SMTP (for OTP emails)
GMAIL_EMAIL = os.getenv("GMAIL_EMAIL", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
