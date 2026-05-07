import { LayoutDashboard, Radio, BarChart3, Clock, Cpu, ShieldAlert, Eye, Plus, LogOut } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, live: true },
  { id: 'signals', label: 'Signal Feed', icon: Radio, badgeKey: 'signals' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'pipeline', label: 'AI Pipeline', icon: Cpu },
  { id: 'safety', label: 'Safety Alerts', icon: ShieldAlert, badgeKey: 'alerts' },
  { id: 'pii', label: 'PII Monitor', icon: Eye },
];

import { createProject } from '../services/api';

export default function Sidebar({ activeTab, setActiveTab, projects, activeProject, setActiveProject, alerts, stats, onLogout, user }) {
  const unackAlerts = alerts?.filter(a => !a.acknowledged).length || 0;
  const badges = { signals: stats?.signals_today || 0, alerts: unackAlerts };

  const handleNewProject = async () => {
    const name = prompt("Enter new project name:");
    if (name) {
      try {
        await createProject({
          name,
          keywords: [],
          sources: [
            {"type": "reddit", "label": "Reddit", "engine": "PRAW", "enabled": true, "frequency": "DAILY"},
            {"type": "twitter", "label": "X / Twitter", "engine": "Full-firehose", "enabled": true, "frequency": "REAL-TIME"}
          ]
        });
        window.location.reload();
      } catch (e) {
        alert("Failed to create project. Ensure backend is running.");
      }
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>SIGNALRX</h1>
        <span>Social Listening Intelligence</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="icon" size={18} />
            {item.label}
            {item.live && <span className="live-badge">Live</span>}
            {item.badgeKey && badges[item.badgeKey] > 0 && (
              <span className="badge">{badges[item.badgeKey]}</span>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-projects">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Projects</div>
          {projects.map(p => (
            <div
              key={p.id}
              className={`project-item ${activeProject?.id === p.id ? 'active' : ''}`}
              onClick={() => setActiveProject(p)}
            >
              <span className="dot" />
              {p.name}
            </div>
          ))}
          <div className="project-item new-project" onClick={handleNewProject}>
            <Plus size={14} />
            New Project
          </div>
        </div>
      </div>

      {/* User section */}
      {user && (
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #06d6d6, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700
            }}>
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.displayName || 'User'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
          <div
            className="sidebar-item"
            onClick={onLogout}
            style={{ color: 'var(--accent-red)', fontSize: 12 }}
          >
            <LogOut className="icon" size={16} />
            Sign Out
          </div>
        </div>
      )}
    </div>
  );
}
