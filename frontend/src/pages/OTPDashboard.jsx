import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, RefreshCw } from 'lucide-react';
import { getAllOTPs } from '../services/firebase';
import './OTPDashboard.css';

export default function OTPDashboard() {
  const [otps, setOtps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOTPs = async () => {
    setLoading(true);
    try {
      const data = await getAllOTPs();
      setOtps(data);
    } catch (err) {
      console.error('Failed to fetch OTPs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTPs();
    
    // Auto-refresh every 5 seconds for development convenience
    const interval = setInterval(fetchOTPs, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="otp-dashboard">
      <header className="otp-header">
        <div className="otp-header-left">
          <Key size={24} style={{ color: '#06d6d6' }} />
          <h2>OTP Monitoring Dashboard</h2>
          <span className="dev-badge">DEVELOPMENT ONLY</span>
        </div>
        <div className="otp-header-right">
          <button className="refresh-btn" onClick={fetchOTPs} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/admin/panel" className="back-link">Back to Admin</Link>
        </div>
      </header>

      <div className="otp-content">
        <div className="otp-card">
          <div className="otp-card-header">
            <h3>Recent Verification Codes</h3>
            <p>Use these codes to bypass email delivery during local testing.</p>
          </div>
          
          <div className="otp-table-wrapper">
            <table className="otp-table">
              <thead>
                <tr>
                  <th>Email Address</th>
                  <th>OTP Code</th>
                  <th>Status</th>
                  <th>Generated At</th>
                  <th>Expires At</th>
                </tr>
              </thead>
              <tbody>
                {otps.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No OTPs generated recently.</td>
                  </tr>
                ) : (
                  otps.map((otp, i) => (
                    <tr key={i}>
                      <td className="otp-email-cell">{otp.email}</td>
                      <td>
                        <span className="otp-code-badge">{otp.code}</span>
                      </td>
                      <td>
                        {otp.verified ? (
                          <span className="status-badge verified">Verified</span>
                        ) : (
                          <span className="status-badge pending">Pending</span>
                        )}
                      </td>
                      <td>{formatDate(otp.createdAt)}</td>
                      <td>{formatDate(otp.expiresAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
