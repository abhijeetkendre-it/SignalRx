import { useState, useEffect } from 'react';
import { getSignals } from '../services/api';

export default function SignalFeed({ project }) {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    getSignals(project?.id, filter).then(setSignals);
  }, [project, filter]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🔬 Signal Feed</h2>
        <p>Detected safety signals ranked by confidence score</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[null, 'HIGH', 'MEDIUM', 'LOW'].map(level => (
          <span
            key={level || 'all'}
            className={`risk-badge ${level || ''}`}
            style={{ cursor: 'pointer', opacity: filter === level ? 1 : 0.5, background: !level ? 'var(--bg-card)' : undefined, color: !level ? 'var(--text-primary)' : undefined, border: !level ? '1px solid var(--border)' : undefined }}
            onClick={() => setFilter(level)}
          >
            {level || 'ALL'}
          </span>
        ))}
      </div>
      {signals.map(sig => (
        <div key={sig.id} className="signal-card">
          <div className="signal-header">
            <span className="signal-title">{sig.drug} → {sig.symptom}</span>
            <span className={`risk-badge ${sig.risk_level}`}>{sig.risk_level}</span>
          </div>
          <div className="signal-desc">{sig.description}</div>
          <div className="signal-metrics">
            <div className="signal-metric">
              <div className="signal-metric-value" style={{ color: 'var(--accent-cyan)' }}>{(sig.confidence_score * 100).toFixed(0)}%</div>
              <div className="signal-metric-label">Confidence</div>
            </div>
            <div className="signal-metric">
              <div className="signal-metric-value" style={{ color: 'var(--accent-yellow)' }}>{sig.prr_score}</div>
              <div className="signal-metric-label">PRR Score</div>
            </div>
            <div className="signal-metric">
              <div className="signal-metric-value" style={{ color: 'var(--accent-red)' }}>{sig.z_score}</div>
              <div className="signal-metric-label">Z-Score</div>
            </div>
            <div className="signal-metric">
              <div className="signal-metric-value" style={{ color: 'var(--accent-green)' }}>{sig.mention_count}</div>
              <div className="signal-metric-label">Mentions</div>
            </div>
          </div>
          <div className="signal-evidence">
            <h5>Supporting Evidence ({sig.evidence?.length || 0} sources)</h5>
            {sig.evidence?.slice(0, 3).map((ev, i) => (
              <div key={i} className="evidence-item">
                "{ev.excerpt}"
                <div className="evidence-source">📌 {ev.source} · {ev.date}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
