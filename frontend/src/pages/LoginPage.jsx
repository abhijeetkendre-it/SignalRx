import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser, logoutUser, loginWithGoogle, generateOTP, storeOTP, sendOTPEmail, verifyOTP } from '../services/firebase';
import OTPModal from '../components/OTPModal';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [currentOTP, setCurrentOTP] = useState('');
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await loginUser(email, password);
      setUserName(user.displayName || '');

      if (remember) {
        localStorage.setItem('signalrx_remember', email);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      setEmail(user.email);
      setUserName(user.displayName || '');

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no error needed
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (code) => {
    await verifyOTP(email, code);
    // OTP verified — NOW sign back in and redirect
    await loginUser(email, password);
    if (remember) {
      localStorage.setItem('signalrx_remember', email);
    }
    navigate('/dashboard');
  };

  const handleOTPResend = async () => {
    const otp = generateOTP();
    setCurrentOTP(otp);
    await storeOTP(email, otp);
    try {
      await sendOTPEmail(email, otp, userName || 'User');
    } catch {
      console.log('OTP for development:', otp);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h2>Welcome Back, <span className="brand">SignalRX</span></h2>
        <p>
          Explainable AI Engine for Early Detection of Patient Safety Signals from Social Data.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-logo">
            <div className="auth-form-logo-icon">Rx</div>
            <span className="auth-form-logo-text">SignalRX</span>
          </div>

          <h3>Log In</h3>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember for 30 days
              </label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="auth-social-buttons">
            <button className="auth-social-btn" onClick={handleGoogleLogin} type="button">
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              Google
            </button>
          </div>

          <div className="auth-footer-text">
            Don't have an account? <Link to="/signup">Create account</Link>
          </div>
          <div className="auth-footer-text" style={{ marginTop: 8 }}>
            <Link to="/" style={{ fontSize: 13, color: '#94a3b8' }}>← Back to Home</Link>
          </div>
        </div>
      </div>

      {showOTP && (
        <OTPModal
          email={email}
          onVerify={handleOTPVerify}
          onResend={handleOTPResend}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
