import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

import {
  PORT, HOST, GMAIL_EMAIL, GMAIL_APP_PASSWORD, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
} from './config.js';

import {
  PROJECTS, POSTS, ANALYZED_POSTS, SIGNALS, ALERTS, DASHBOARD_STATS
} from './seed_data.js';

import { RedditEngine } from './engines/reddit_engine.js';
import { GroqAnalysisPipeline } from './pipeline/entity_extractor.js';

const app = express();

app.use(cors());
app.use(express.json());

// ── OTP Email via Gmail SMTP ────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
  const { to_email, to_name = "User", otp_code } = req.body;

  if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
    return res.status(400).json({ error: "Gmail SMTP not configured. Add GMAIL_EMAIL and GMAIL_APP_PASSWORD to .env" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_APP_PASSWORD
      }
    });

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #06d6d6, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">SignalRX</span>
        </div>
        <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 8px;">Hello ${to_name},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your verification code for SignalRX is:</p>
        <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0891b2; background: rgba(6,214,214,0.08); padding: 16px 32px; border-radius: 12px; border: 2px dashed #06d6d6;">${otp_code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">If you didn't request this code, please ignore this email.</p>
        <p style="color: #94a3b8; font-size: 11px;">— Team A.S.I.A. Core</p>
    </div>
    `;

    await transporter.sendMail({
      from: `"SignalRX" <${GMAIL_EMAIL}>`,
      to: to_email,
      subject: `Your SignalRX Verification Code: ${otp_code}`,
      html: html
    });

    return res.json({ status: "success", message: `OTP sent to ${to_email}` });
  } catch (e) {
    return res.status(500).json({ error: `Failed to send email: ${e.message}` });
  }
});

// ── Dashboard ────────────────────────────────────────────
app.get('/api/dashboard/stats', (req, res) => {
  const { project_id } = req.query;
  
  const p_posts = project_id ? POSTS.filter(p => p.project_id === project_id) : POSTS;
  const p_signals = project_id ? SIGNALS.filter(s => s.project_id === project_id) : SIGNALS;
  const p_analyzed = project_id ? ANALYZED_POSTS.filter(a => a.project_id === project_id) : ANALYZED_POSTS;
  
  const pii_count = p_analyzed.filter(a => a.pii_detected).length;
  const confs = p_signals.map(s => s.confidence_score || 0);
  const avg_conf = confs.length ? Math.round((confs.reduce((a,b)=>a+b,0) / confs.length) * 100) : 0;
  
  return res.json({
    total_mentions: p_posts.length,
    mentions_change: 0.0,
    adverse_signals: p_signals.filter(s => s.risk_level === "HIGH").length,
    adverse_spike: 0.0,
    entities_extracted: p_analyzed.reduce((sum, a) => sum + (a.entities?.length || 0), 0),
    entities_change: 0.0,
    pii_flags: pii_count,
    avg_confidence: avg_conf,
    active_projects: PROJECTS.length,
    signals_today: p_signals.length,
    adverse_events_flagged: p_signals.filter(s => s.risk_level === "HIGH").length,
  });
});

// ── Projects ─────────────────────────────────────────────
app.get('/api/projects', (req, res) => {
  res.json(PROJECTS);
});

app.get('/api/projects/:project_id', (req, res) => {
  const proj = PROJECTS.find(p => p.id === req.params.project_id);
  if (!proj) return res.status(404).json({ error: "Project not found" });
  res.json(proj);
});

app.post('/api/projects', (req, res) => {
  const newProj = { 
    ...req.body, 
    id: `proj-${uuidv4().substring(0, 4)}`, 
    status: "active", 
    created_at: "", 
    last_run: "" 
  };
  PROJECTS.push(newProj);
  res.json(newProj);
});

app.put('/api/projects/:project_id', (req, res) => {
  const proj = PROJECTS.find(p => p.id === req.params.project_id);
  if (!proj) return res.status(404).json({ error: "Project not found" });
  
  if (req.body.keywords) proj.keywords = req.body.keywords;
  if (req.body.sources) proj.sources = req.body.sources;
  
  res.json(proj);
});

// ── Posts ─────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  const { project_id, source, limit = 50 } = req.query;
  let result = POSTS;
  if (project_id) result = result.filter(p => p.project_id === project_id);
  if (source) result = result.filter(p => p.source === source);
  res.json(result.slice(0, Number(limit)));
});

app.get('/api/posts/analyzed', (req, res) => {
  const { project_id } = req.query;
  let result = ANALYZED_POSTS;
  if (project_id) result = result.filter(a => a.project_id === project_id);
  
  const merged = result.map(a => {
    const post = POSTS.find(p => p.id === a.post_id) || {};
    return { ...a, post };
  });
  res.json(merged);
});

// ── Ingestion ────────────────────────────────────────────
app.post('/api/ingest/reddit', async (req, res) => {
  const { project_id } = req.query;
  const proj = PROJECTS.find(p => p.id === project_id);
  if (!proj) return res.status(404).json({ error: "Project not found" });
  
  const engine = new RedditEngine(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT);
  if (!engine.isConfigured()) {
    return res.status(400).json({ error: "Reddit API credentials not configured in .env file" });
  }
  
  const subreddits = ["medicine", "AskDocs", "diabetes", "pharmacy", "health"];
  const keywords = proj.keywords || [];
  
  const fetched = await engine.fetchData(project_id, keywords, subreddits, 5);
  
  if (fetched.length > 0 && fetched[0].error) {
    return res.status(500).json(fetched[0]);
  }
  
  POSTS.unshift(...fetched);
  
  const aiPipeline = new GroqAnalysisPipeline();
  let analyzedCount = 0;
  
  if (aiPipeline.isConfigured()) {
    for (const post of fetched) {
      try {
        const analyzed = await aiPipeline.analyzePost(post);
        if (!analyzed.error) {
          ANALYZED_POSTS.unshift(analyzed);
          analyzedCount++;
        }
      } catch (e) {
        console.log(`Skipping post due to analysis error: ${e.message}`);
      }
    }
  }
  
  res.json({
    status: "success",
    message: `Successfully ingested ${fetched.length} Reddit posts. AI Analyzed ${analyzedCount} posts.`,
    posts: fetched
  });
});

// ── Signals ──────────────────────────────────────────────
app.get('/api/signals', (req, res) => {
  const { project_id, risk_level } = req.query;
  let result = SIGNALS;
  if (project_id) result = result.filter(s => s.project_id === project_id);
  if (risk_level) result = result.filter(s => s.risk_level === risk_level);
  
  result.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
  res.json(result);
});

app.get('/api/signals/:signal_id', (req, res) => {
  const sig = SIGNALS.find(s => s.id === req.params.signal_id);
  if (!sig) return res.status(404).json({ error: "Signal not found" });
  res.json(sig);
});

// ── Alerts ───────────────────────────────────────────────
app.get('/api/alerts', (req, res) => {
  const { project_id } = req.query;
  let result = ALERTS;
  if (project_id) result = result.filter(a => a.project_id === project_id);
  
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(result);
});

// ── Pipeline Info ────────────────────────────────────────
app.get('/api/pipeline/info', (req, res) => {
  res.json({
    stages: [
      {
        model: "MODEL #01",
        name: "Scout",
        role: "DATA FETCHER & READER",
        description: "Agentic crawler that fetches, reads, and filters raw content from all configured sources using keyword matching and relevance scoring.",
        features: ["Multi-source API integration", "Keyword relevance scoring", "Rate-limited crawling", "Deduplication engine"]
      },
      {
        model: "MODEL #02",
        name: "Lens",
        role: "PROCESSOR & ANALYST",
        description: "Deep NLP pipeline that extracts entities, measures sentiment, detects safety signals, flags PII/PHI, and generates explainable confidence scores.",
        features: ["Named Entity Recognition (NER)", "Sentiment analysis", "PII/PHI detection", "Confidence scoring"]
      },
      {
        model: "MODEL #03",
        name: "Oracle",
        role: "MEDICAL VALIDATOR",
        description: "Cross-references extracted signals against verified medical knowledge bases, drug databases, and clinical guidelines to validate and classify risk.",
        features: ["Medical knowledge base", "PRR calculation", "Z-score anomaly detection", "Risk classification"]
      }
    ]
  });
});

// ── Timeline data ────────────────────────────────────────
app.get('/api/timeline', (req, res) => {
  const { project_id } = req.query;
  let sigs = SIGNALS;
  if (project_id) sigs = sigs.filter(s => s.project_id === project_id);
  
  const dateMap = {};
  for (const sig of sigs) {
    for (const pt of sig.timeline || []) {
      const d = pt.date;
      if (!dateMap[d]) {
        dateMap[d] = { date: d, mentions: 0, signals: 0, adverse: 0 };
      }
      dateMap[d].mentions += pt.count;
      dateMap[d].signals += 1;
      if (sig.risk_level === "HIGH") {
        dateMap[d].adverse += 1;
      }
    }
  }
  
  const result = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  res.json(result);
});

// ── Source/Engine Info ───────────────────────────────────
app.get('/api/engines', (req, res) => {
  res.json([
    { type: "twitter", label: "X / Twitter", description: "Full-firehose API, 5s polling", status: "active" },
    { type: "reddit", label: "Reddit", description: "PRAW, Subreddit monitoring", status: "active" },
    { type: "quora", label: "Quora", description: "Selenium-based scraper", status: "active" },
    { type: "forum", label: "Health Forums", description: "Pi ML parser for forum structures", status: "active" }
  ]);
});

app.listen(PORT, HOST, () => {
  console.log(`SignalRx Node.js API running on http://${HOST}:${PORT}`);
});
