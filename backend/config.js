import dotenv from 'dotenv';
dotenv.config();

export const APP_NAME = "SignalRx";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "Explainable AI Engine for Early Detection of Patient Safety Signals from Social Data";

// API Keys (optional - system works with simulated data if not provided)
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
export const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
export const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || "SignalRx:v1.0 (by /u/SignalRx)";
export const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || "";

// Server
export const HOST = process.env.HOST || "0.0.0.0";
export const PORT = parseInt(process.env.PORT || "8000", 10);

// Gmail SMTP (for OTP emails)
export const GMAIL_EMAIL = process.env.GMAIL_EMAIL || "";
export const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
