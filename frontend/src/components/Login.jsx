import { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Shield className="login-logo-icon" size={48} />
          <h2>SIGNALRX</h2>
          <p>Social Listening Intelligence Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="admin@signalrx.io" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input">
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <Lock size={16} className="lock-icon" />
            </div>
          </div>
          <button type="submit" className="login-button">Authenticate Securely</button>
        </form>
        <div className="login-footer">
          <p>Restricted Access. Authorized Personnel Only.</p>
        </div>
      </div>
    </div>
  );
}
