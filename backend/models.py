"""Pydantic models for SignalRx."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Project ──────────────────────────────────────────────
class SourceConfig(BaseModel):
    type: str                          # "twitter", "reddit", "quora", "forum"
    label: str                         # "X / Twitter"
    engine: str                        # "full-firehose", "PRAW", etc.
    enabled: bool = True
    frequency: str = "DAILY"           # REAL-TIME | DAILY | WEEKLY


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    keywords: list[str] = []
    keyword_categories: str = ""       # e.g. "Drug/Brand · Symptom · Condition"
    sources: list[SourceConfig] = []


class Project(ProjectCreate):
    id: str
    status: str = "active"
    created_at: str = ""
    last_run: str = ""


# ── Post (Raw ingested content) ─────────────────────────
class Post(BaseModel):
    id: str
    project_id: str
    source: str                        # "reddit", "twitter", etc.
    author: str                        # anonymized
    content: str
    url: str = ""
    timestamp: str = ""
    ingested_at: str = ""
    metadata: dict = {}


# ── Analyzed Post ────────────────────────────────────────
class Entity(BaseModel):
    text: str
    type: str                          # "DRUG", "SYMPTOM", "CONDITION"
    confidence: float = 0.0


class SentimentResult(BaseModel):
    score: float = 0.0                 # -1 to 1
    label: str = "neutral"             # positive | negative | neutral | safety_concern
    intensity: int = 5                 # 1-10


class AnalyzedPost(BaseModel):
    id: str
    post_id: str
    project_id: str
    entities: list[Entity] = []
    sentiment: SentimentResult = SentimentResult()
    safety_flags: list[str] = []
    pii_detected: bool = False
    pii_types: list[str] = []
    pii_masked_content: str = ""
    analyzed_at: str = ""


# ── Signal ───────────────────────────────────────────────
class EvidenceItem(BaseModel):
    post_id: str
    excerpt: str
    source: str = ""
    date: str = ""


class TimelinePoint(BaseModel):
    date: str
    count: int


class Signal(BaseModel):
    id: str
    project_id: str
    type: str                          # "adverse_event", "safety_concern", "emerging_trend"
    risk_level: str                    # "HIGH", "MEDIUM", "LOW"
    drug: str = ""
    symptom: str = ""
    description: str = ""
    confidence_score: float = 0.0
    prr_score: float = 0.0
    z_score: float = 0.0
    mention_count: int = 0
    evidence: list[EvidenceItem] = []
    timeline: list[TimelinePoint] = []
    first_detected: str = ""
    last_updated: str = ""
    status: str = "active"             # active | acknowledged | resolved


# ── Alert ────────────────────────────────────────────────
class Alert(BaseModel):
    id: str
    signal_id: str
    project_id: str
    severity: str                      # "critical", "warning", "info"
    message: str
    acknowledged: bool = False
    created_at: str = ""


# ── Dashboard Stats ──────────────────────────────────────
class DashboardStats(BaseModel):
    total_mentions: int = 0
    mentions_change: float = 0.0
    adverse_signals: int = 0
    adverse_spike: float = 0.0
    entities_extracted: int = 0
    entities_change: float = 0.0
    pii_flags: int = 0
    avg_confidence: float = 0.0
    active_projects: int = 0
    signals_today: int = 0
    adverse_events_flagged: int = 0
