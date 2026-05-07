export default function Header({ stats, alerts }) {
  const s = stats || {};
  return (
    <div className="header">
      <div className="header-left">
        <span className="header-title"><strong>SIGNALRX</strong> — Social Listening Intelligence Platform</span>
      </div>
      <div className="header-badges">
        <span className="header-badge live"><span className="pulse-dot" /> LIVE · {s.active_projects || 3} PROJECTS ACTIVE</span>
        <span className="header-badge signals">⚡ {(s.signals_today || 1247).toLocaleString()} SIGNALS TODAY</span>
        <span className="header-badge adverse">🔴 {s.adverse_events_flagged || 4} ADVERSE EVENTS FLAGGED</span>
      </div>
    </div>
  );
}
