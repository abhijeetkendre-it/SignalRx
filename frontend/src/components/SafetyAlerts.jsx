import { useState, useEffect } from 'react';
import { getAlerts } from '../services/api';

export default function SafetyAlerts({ project }) {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { getAlerts(project?.id).then(setAlerts); }, [project]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🚨 Safety Alerts</h2>
        <p>Real-time adverse event alerts requiring attention</p>
      </div>
      {alerts.length === 0 && <div className="empty-state">No alerts for this project</div>}
      {alerts.map(alert => (
        <div key={alert.id} className="alert-item">
          <div className={`alert-icon ${alert.severity}`}>
            {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️'}
          </div>
          <div>
            <div className="alert-message">{alert.message}</div>
            <div className="alert-time">
              {alert.acknowledged ? '✅ Acknowledged' : '⏳ Pending review'} · {new Date(alert.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
