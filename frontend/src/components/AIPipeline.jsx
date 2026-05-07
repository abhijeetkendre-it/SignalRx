import { useState, useEffect } from 'react';
import { getPipelineInfo } from '../services/api';

export default function AIPipeline() {
  const [pipeline, setPipeline] = useState(null);
  useEffect(() => { getPipelineInfo().then(setPipeline); }, []);

  if (!pipeline) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🧠 AI Pipeline</h2>
        <p>Three-stage processing architecture — Scout → Lens → Oracle</p>
      </div>
      <div className="pipeline-cards">
        {pipeline.stages.map((stage, i) => (
          <div key={i} className="pipeline-card">
            <div className="pipeline-model">
              <span className="dot" />
              <span>{stage.model}</span>
            </div>
            <h4>{stage.name}</h4>
            <div className="role">{stage.role}</div>
            <p>{stage.description}</p>
            {stage.features.map((f, j) => (
              <div key={j} className="pipeline-feature">
                <span className="check">✓</span> {f}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Pipeline Flow */}
      <div className="chart-card" style={{ marginTop: 24, textAlign: 'center' }}>
        <h4>Processing Flow</h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '24px 0', flexWrap: 'wrap' }}>
          {['Data Sources', '→', 'Scout (Fetch)', '→', 'Lens (Analyze)', '→', 'Oracle (Validate)', '→', 'Dashboard'].map((item, i) => (
            <span key={i} style={{
              padding: item === '→' ? '0' : '10px 20px',
              background: item === '→' ? 'none' : 'var(--bg-secondary)',
              border: item === '→' ? 'none' : '1px solid var(--border)',
              borderRadius: 8,
              fontSize: item === '→' ? 20 : 13,
              fontWeight: 600,
              color: item === '→' ? 'var(--accent-cyan)' : 'var(--text-primary)',
            }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
