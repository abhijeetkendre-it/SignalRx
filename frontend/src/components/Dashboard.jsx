import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Sparkles, Shield, Target, Search } from 'lucide-react';
import { getPipelineInfo, updateProject } from '../services/api';

export default function Dashboard({ stats, project }) {
  const [pipeline, setPipeline] = useState(null);
  const [localProject, setLocalProject] = useState(project);
  const s = stats || {};

  useEffect(() => { getPipelineInfo().then(setPipeline); }, []);
  useEffect(() => { setLocalProject(project); }, [project]);

  const removeKeyword = async (kw) => {
    const newKws = localProject.keywords.filter(k => k !== kw);
    const updated = await updateProject(localProject.id, { keywords: newKws });
    setLocalProject(updated);
  };

  const addKeyword = async () => {
    const kw = prompt("Enter new keyword:");
    if (kw && !localProject.keywords.includes(kw)) {
      const newKws = [...localProject.keywords, kw];
      const updated = await updateProject(localProject.id, { keywords: newKws });
      setLocalProject(updated);
    }
  };

  const toggleSource = async (idx) => {
    const newSources = [...localProject.sources];
    newSources[idx].enabled = !newSources[idx].enabled;
    const updated = await updateProject(localProject.id, { sources: newSources });
    setLocalProject(updated);
  };

  return (
    <div className="fade-in">
      {/* Search Bar */}
      <div className="search-bar">
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input placeholder={project ? project.name : 'Search across all projects...'} />
        <div className="source-filters">
          <span className="source-chip twitter">X/Twitter</span>
          <span className="source-chip reddit">Reddit</span>
          <span className="source-chip quora">Quora</span>
          <span className="source-chip forum">Forums</span>
          <span className="source-chip realtime">Real-Time</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card blue">
          <div className="stat-card-label">Total Mentions <FileText size={16} /></div>
          <div className="stat-card-value">{(s.total_mentions || 0).toLocaleString()}</div>
          <div className="stat-card-change up">+{s.mentions_change || 0}% vs last week</div>
        </div>
        <div className="stat-card red">
          <div className="stat-card-label">Adverse Signals <AlertTriangle size={16} /></div>
          <div className="stat-card-value">{s.adverse_signals || 0}</div>
          <div className="stat-card-change spike">+{s.adverse_spike || 0}% spike detected</div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-label">Entities Extracted <Sparkles size={16} /></div>
          <div className="stat-card-value">{(s.entities_extracted || 0).toLocaleString()}</div>
          <div className="stat-card-change up">+{s.entities_change || 0}% this session</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-card-label">PII Flags <Shield size={16} /></div>
          <div className="stat-card-value">{s.pii_flags || 0}</div>
          <div className="stat-card-change">Auto-redacted safely</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-card-label">Avg Confidence <Target size={16} /></div>
          <div className="stat-card-value">{s.avg_confidence || 0}%</div>
          <div className="stat-card-change">Oracle validated</div>
        </div>
      </div>

      {/* Project Configuration */}
      {localProject && (
        <>
          <div className="section-title">PROJECT CONFIGURATION</div>
          <div className="project-config">
            <div className="project-config-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>⚙️</span>
                <h3>Project: {localProject.name}</h3>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const { ingestReddit } = await import('../services/api');
                    const res = await ingestReddit(localProject.id);
                    alert(res.error ? `Error: ${res.error}` : res.message);
                  } catch (err) {
                    alert("Network error. Is backend running?");
                  }
                }}
                style={{ background: 'rgba(6,214,214,0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                📥 Fetch Live Reddit Data
              </button>
            </div>
            <div className="project-config-sub">Configure keywords, sources, and alert latency for this monitoring project.</div>
            <div className="config-grid">
              <div className="config-section">
                <h4>Keywords Monitored</h4>
                <div className="keyword-tags">
                  {localProject.keywords?.map((kw, i) => (
                    <span key={i} className="keyword-tag">{kw} <span className="x" onClick={() => removeKeyword(kw)}>×</span></span>
                  ))}
                </div>
                <div className="add-keyword" onClick={addKeyword}>+ Add keyword</div>
                <div className="keyword-categories">{localProject.keyword_categories || '3 categories: Drug/Brand · Symptom · Condition'}</div>
              </div>
              <div className="config-section">
                <h4>Active Sources & Latency</h4>
                <div className="source-list">
                  {localProject.sources?.map((src, i) => (
                    <div key={i} className="source-item">
                      <div className="source-info">
                        <div className={`source-toggle ${src.enabled ? 'on' : ''}`} onClick={() => toggleSource(i)}>
                          <div className="knob" />
                        </div>
                        <div>
                          <div className="source-name">{src.label}</div>
                          <div className="source-engine">{src.engine}</div>
                        </div>
                      </div>
                      <span className={`freq-badge ${src.frequency === 'REAL-TIME' ? 'realtime' : src.frequency.toLowerCase()}`}>
                        {src.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI Pipeline */}
      <div className="section-title">AI PIPELINE — THREE-STAGE PROCESSING</div>
      <div className="pipeline-section">
        <div className="pipeline-header">
          <h3>⚙️ AI Pipeline — Three-Stage Processing</h3>
          <p>Each signal passes through Scout → Lens → Oracle before reaching the dashboard</p>
        </div>
        <div className="pipeline-cards">
          {(pipeline?.stages || []).map((stage, i) => (
            <div key={i} className="pipeline-card">
              <div className="pipeline-model">
                <span className="dot" />
                <span>{stage.model}</span>
              </div>
              <h4>{stage.name}</h4>
              <div className="role">{stage.role}</div>
              <p>{stage.description}</p>
              {stage.features?.map((f, j) => (
                <div key={j} className="pipeline-feature">
                  <span className="check">✓</span> {f}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
