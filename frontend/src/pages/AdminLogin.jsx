import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import './AuthPages.css';

const ADMIN_EMAIL = 'admin@asiacore.in';
const ADMIN_PASS = '2610@Asia';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        sessionStorage.setItem('signalrx_admin', 'true');
        navigate('/admin/panel');
      } else {
        setError('Invalid admin credentials. Access denied.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-left" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
        <h2 style={{ color: '#fff' }}>
          <Shield size={36} style={{ color: '#06d6d6', marginBottom: 8, display: 'block' }} />
          Super Admin <span className="brand">Portal</span>
        </h2>
        <p style={{ color: '#94a3b8' }}>
          Restricted access. Authorized personnel only. All login attempts are logged and monitored.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-logo">
            <div className="auth-form-logo-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>⚡</div>
            <span className="auth-form-logo-text" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Access</span>
          </div>

          <h3>Administrator Login</h3>

          {error && <div className="auth-error">🔒 {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="admin-password">Admin Password</label>
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>

          <div className="auth-footer-text">
            <Link to="/" style={{ fontSize: 13, color: '#94a3b8' }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
