import { useState, useEffect } from 'react';
import { getAnalyzedPosts } from '../services/api';

export default function PIIMonitor({ project }) {
  const [posts, setPosts] = useState([]);
  useEffect(() => { getAnalyzedPosts(project?.id).then(p => setPosts(p.filter(x => x.pii_detected))); }, [project]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🛡️ PII Monitor</h2>
        <p>Detected and auto-redacted personally identifiable information</p>
      </div>
      {posts.length === 0 && <div className="empty-state">No PII detected in current posts</div>}
      {posts.map(p => (
        <div key={p.id} className="pii-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' }}>{p.post?.author}</span>
            <span className={`source-chip ${p.post?.source}`}>{p.post?.source}</span>
          </div>
          <div>
            {p.pii_types?.map((t, i) => (
              <span key={i} className="pii-flag">🔒 {t}</span>
            ))}
          </div>
          <div className="pii-masked">
            {p.pii_masked_content?.split(/(\[REDACTED\])/).map((part, i) => (
              part === '[REDACTED]' ? <span key={i} className="redacted">[REDACTED]</span> : <span key={i}>{part}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            ✅ Auto-redacted · Original content secured · {new Date(p.analyzed_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
