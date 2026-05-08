import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { 
  loginUser, 
  loginWithGoogle, 
  generateOTP, 
  storeOTP, 
  sendOTPEmail, 
  verifyOTP,
  checkUserExistsByEmail 
} from '../services/firebase';
import OTPInputBoxes from '../components/OTPInputBoxes';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInlineOTP, setShowInlineOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [userName, setUserName] = useState('');

  const handleInitialSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exists = await checkUserExistsByEmail(email);
      if (!exists) {
        // Not an existing user, redirect to signup
        navigate('/signup', { state: { email } });
        return;
      }

      // Existing user, send OTP and show inline OTP box
      const otp = generateOTP();
      await storeOTP(email, otp);
      try {
        await sendOTPEmail(email, otp, 'User');
      } catch {
        console.log('OTP for development:', otp);
      }
      setShowInlineOTP(true);
    } catch (err) {
      setError('Failed to check user existence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOTP(email, otpCode);
      // OTP verified, now check password and login
      const user = await loginUser(email, password);
      setUserName(user.displayName || '');

      if (remember) {
        localStorage.setItem('signalrx_remember', email);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.message.includes('Invalid OTP') || err.message.includes('expired')) {
        setError(err.message);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
        setShowInlineOTP(false); // Reset OTP flow if password was wrong
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showInlineOTP) {
      await handleInitialSubmit();
    } else {
      await handleFinalSubmit();
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
                disabled={showInlineOTP}
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
                  disabled={showInlineOTP}
                  required
                />
                <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {showInlineOTP && (
              <div className="auth-field otp-box-anim-enter" style={{ marginTop: '16px' }}>
                <label style={{ textAlign: 'center', display: 'block', color: '#06d6d6' }}>
                  Enter the OTP sent to your email
                </label>
                <OTPInputBoxes length={6} onComplete={setOtpCode} />
              </div>
            )}

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
              {loading ? 'Processing...' : (showInlineOTP ? 'Verify & Login' : 'Sign In')}
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
    </div>
  );
}
