"""SignalRx — FastAPI Backend."""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from seed_data import PROJECTS, POSTS, ANALYZED_POSTS, SIGNALS, ALERTS, DASHBOARD_STATS
from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, GMAIL_EMAIL, GMAIL_APP_PASSWORD
from engines.reddit_engine import RedditEngine
from pipeline.entity_extractor import GroqAnalysisPipeline

app = FastAPI(title="SignalRx API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── OTP Email via Gmail SMTP ────────────────────────────────
class OTPRequest(BaseModel):
    to_email: str
    to_name: str = "User"
    otp_code: str

@app.post("/api/send-otp")
async def send_otp_email(req: OTPRequest):
    if not GMAIL_EMAIL or not GMAIL_APP_PASSWORD:
        return {"error": "Gmail SMTP not configured. Add GMAIL_EMAIL and GMAIL_APP_PASSWORD to .env"}
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your SignalRX Verification Code: {req.otp_code}"
        msg["From"] = f"SignalRX <{GMAIL_EMAIL}>"
        msg["To"] = req.to_email

        html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #06d6d6, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">SignalRX</span>
            </div>
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 8px;">Hello {req.to_name},</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your verification code for SignalRX is:</p>
            <div style="text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0891b2; background: rgba(6,214,214,0.08); padding: 16px 32px; border-radius: 12px; border: 2px dashed #06d6d6;">{req.otp_code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">If you didn't request this code, please ignore this email.</p>
            <p style="color: #94a3b8; font-size: 11px;">— Team A.S.I.A. Core</p>
        </div>
        """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_EMAIL, req.to_email, msg.as_string())

        return {"status": "success", "message": f"OTP sent to {req.to_email}"}
    except Exception as e:
        return {"error": f"Failed to send email: {str(e)}"}


# ── Dashboard ────────────────────────────────────────────
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(project_id: str = None):
    p_posts = [p for p in POSTS if p["project_id"] == project_id] if project_id else POSTS
    p_signals = [s for s in SIGNALS if s["project_id"] == project_id] if project_id else SIGNALS
    p_analyzed = [a for a in ANALYZED_POSTS if a["project_id"] == project_id] if project_id else ANALYZED_POSTS
    
    pii_count = sum(1 for a in p_analyzed if a.get("pii_detected"))
    confs = [s.get("confidence_score", 0) for s in p_signals]
    
    return {
        "total_mentions": len(p_posts),
        "mentions_change": 0.0,
        "adverse_signals": sum(1 for s in p_signals if s.get("risk_level") == "HIGH"),
        "adverse_spike": 0.0,
        "entities_extracted": sum(len(a.get("entities", [])) for a in p_analyzed),
        "entities_change": 0.0,
        "pii_flags": pii_count,
        "avg_confidence": round(sum(confs) / len(confs) * 100, 0) if confs else 0,
        "active_projects": len(PROJECTS),
        "signals_today": len(p_signals),
        "adverse_events_flagged": sum(1 for s in p_signals if s.get("risk_level") == "HIGH"),
    }

# ── Projects ─────────────────────────────────────────────
@app.get("/api/projects")
async def list_projects():
    return PROJECTS

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    proj = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not proj:
        return {"error": "Project not found"}
    return proj

@app.post("/api/projects")
async def create_project(data: dict):
    import uuid
    new = {**data, "id": f"proj-{str(uuid.uuid4())[:4]}", "status": "active", "created_at": "", "last_run": ""}
    PROJECTS.append(new)
    return new

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, data: dict):
    proj = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not proj:
        return {"error": "Project not found"}
    if "keywords" in data:
        proj["keywords"] = data["keywords"]
    if "sources" in data:
        proj["sources"] = data["sources"]
    return proj

# ── Posts ─────────────────────────────────────────────────
@app.get("/api/posts")
async def list_posts(project_id: str = None, source: str = None, limit: int = 50):
    result = POSTS
    if project_id:
        result = [p for p in result if p["project_id"] == project_id]
    if source:
        result = [p for p in result if p["source"] == source]
    return result[:limit]

@app.get("/api/posts/analyzed")
async def list_analyzed_posts(project_id: str = None):
    result = ANALYZED_POSTS
    if project_id:
        result = [a for a in result if a["project_id"] == project_id]
    # Merge with original post content
    merged = []
    for a in result:
        post = next((p for p in POSTS if p["id"] == a["post_id"]), {})
        merged.append({**a, "post": post})
    return merged

# ── Ingestion ────────────────────────────────────────────
@app.post("/api/ingest/reddit")
async def ingest_reddit(project_id: str):
    proj = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not proj:
        return {"error": "Project not found"}
    
    engine = RedditEngine(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT)
    if not engine.is_configured():
        return {"error": "Reddit API credentials not configured in .env file"}
        
    # Find Reddit subreddits from config or use defaults
    subreddits = ["medicine", "AskDocs", "diabetes", "pharmacy", "health"]
    # We could parse project.sources[x].engine for subreddits, but defaults are fine for demo
    
    fetched = engine.fetch_data(project_id, proj.get("keywords", []), subreddits, limit=5)
    
    # Check for errors in fetch
    if len(fetched) > 0 and "error" in fetched[0]:
        return fetched[0]
        
    # Append new posts to the global mock DB
    POSTS.extend(fetched)
    
    # Run AI Analysis on new posts
    ai_pipeline = GroqAnalysisPipeline()
    analyzed_count = 0
    if ai_pipeline.is_configured():
        for post in fetched:
            try:
                analyzed = ai_pipeline.analyze_post(post)
                if "error" not in analyzed:
                    ANALYZED_POSTS.insert(0, analyzed) # Prepend so they appear at top
                    analyzed_count += 1
            except Exception as e:
                print(f"Skipping post due to analysis error: {e}")
    
    return {
        "status": "success",
        "message": f"Successfully ingested {len(fetched)} Reddit posts. AI Analyzed {analyzed_count} posts.",
        "posts": fetched
    }

# ── Signals ──────────────────────────────────────────────
@app.get("/api/signals")
async def list_signals(project_id: str = None, risk_level: str = None):
    result = SIGNALS
    if project_id:
        result = [s for s in result if s["project_id"] == project_id]
    if risk_level:
        result = [s for s in result if s["risk_level"] == risk_level]
    return sorted(result, key=lambda s: s["confidence_score"], reverse=True)

@app.get("/api/signals/{signal_id}")
async def get_signal(signal_id: str):
    sig = next((s for s in SIGNALS if s["id"] == signal_id), None)
    return sig or {"error": "Signal not found"}

# ── Alerts ───────────────────────────────────────────────
@app.get("/api/alerts")
async def list_alerts(project_id: str = None):
    result = ALERTS
    if project_id:
        result = [a for a in result if a["project_id"] == project_id]
    return sorted(result, key=lambda a: a["created_at"], reverse=True)

# ── Pipeline Info ────────────────────────────────────────
@app.get("/api/pipeline/info")
async def pipeline_info():
    return {
        "stages": [
            {
                "model": "MODEL #01",
                "name": "Scout",
                "role": "DATA FETCHER & READER",
                "description": "Agentic crawler that fetches, reads, and filters raw content from all configured sources using keyword matching and relevance scoring.",
                "features": ["Multi-source API integration", "Keyword relevance scoring", "Rate-limited crawling", "Deduplication engine"]
            },
            {
                "model": "MODEL #02",
                "name": "Lens",
                "role": "PROCESSOR & ANALYST",
                "description": "Deep NLP pipeline that extracts entities, measures sentiment, detects safety signals, flags PII/PHI, and generates explainable confidence scores.",
                "features": ["Named Entity Recognition (NER)", "Sentiment analysis", "PII/PHI detection", "Confidence scoring"]
            },
            {
                "model": "MODEL #03",
                "name": "Oracle",
                "role": "MEDICAL VALIDATOR",
                "description": "Cross-references extracted signals against verified medical knowledge bases, drug databases, and clinical guidelines to validate and classify risk.",
                "features": ["Medical knowledge base", "PRR calculation", "Z-score anomaly detection", "Risk classification"]
            }
        ]
    }

# ── Timeline data ────────────────────────────────────────
@app.get("/api/timeline")
async def get_timeline(project_id: str = None):
    sigs = SIGNALS
    if project_id:
        sigs = [s for s in sigs if s["project_id"] == project_id]
    # Aggregate all signal timelines
    date_map = {}
    for sig in sigs:
        for pt in sig.get("timeline", []):
            d = pt["date"]
            if d not in date_map:
                date_map[d] = {"date": d, "mentions": 0, "signals": 0, "adverse": 0}
            date_map[d]["mentions"] += pt["count"]
            date_map[d]["signals"] += 1
            if sig["risk_level"] == "HIGH":
                date_map[d]["adverse"] += 1
    return sorted(date_map.values(), key=lambda x: x["date"])

# ── Source/Engine Info ───────────────────────────────────
@app.get("/api/engines")
async def list_engines():
    return [
        {"type": "twitter", "label": "X / Twitter", "description": "Full-firehose API, 5s polling", "status": "active"},
        {"type": "reddit", "label": "Reddit", "description": "PRAW, Subreddit monitoring", "status": "active"},
        {"type": "quora", "label": "Quora", "description": "Selenium-based scraper", "status": "active"},
        {"type": "forum", "label": "Health Forums", "description": "Pi ML parser for forum structures", "status": "active"},
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
