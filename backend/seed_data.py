"""Realistic pre-seeded data for SignalRx demo."""
from datetime import datetime, timedelta
import random, uuid

def _id(): return str(uuid.uuid4())[:8]
def _ts(days_ago=0): return (datetime.now() - timedelta(days=days_ago)).isoformat()

# ── PROJECTS ─────────────────────────────────────────────
PROJECTS = []

# ── POSTS ────────────────────────────────────────────────
POSTS = []

# ── ANALYZED POSTS ───────────────────────────────────────
ANALYZED_POSTS = []

# ── SIGNALS ──────────────────────────────────────────────
SIGNALS = []

# ── ALERTS ───────────────────────────────────────────────
ALERTS = []

# ── DASHBOARD STATS ──────────────────────────────────────
DASHBOARD_STATS = {
    "total_mentions": 0,
    "mentions_change": 0.0,
    "adverse_signals": 0,
    "adverse_spike": 0.0,
    "entities_extracted": 0,
    "entities_change": 0.0,
    "pii_flags": 0,
    "avg_confidence": 0.0,
    "active_projects": 0,
    "signals_today": 0,
    "adverse_events_flagged": 0,
}
