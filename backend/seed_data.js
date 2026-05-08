import { v4 as uuidv4 } from 'uuid';

export const _id = () => uuidv4().substring(0, 8);
export const _ts = (days_ago = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days_ago);
  return d.toISOString();
};

// ── PROJECTS ─────────────────────────────────────────────
export const PROJECTS = [];

// ── POSTS ────────────────────────────────────────────────
export const POSTS = [];

// ── ANALYZED POSTS ───────────────────────────────────────
export const ANALYZED_POSTS = [];

// ── SIGNALS ──────────────────────────────────────────────
export const SIGNALS = [];

// ── ALERTS ───────────────────────────────────────────────
export const ALERTS = [];

// ── DASHBOARD STATS ──────────────────────────────────────
export const DASHBOARD_STATS = {
  total_mentions: 0,
  mentions_change: 0.0,
  adverse_signals: 0,
  adverse_spike: 0.0,
  entities_extracted: 0,
  entities_change: 0.0,
  pii_flags: 0,
  avg_confidence: 0.0,
  active_projects: 0,
  signals_today: 0,
  adverse_events_flagged: 0,
};
