import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { signUpUser, logoutUser, loginUser, generateOTP, storeOTP, sendOTPEmail, verifyOTP } from '../services/firebase';
import OTPModal from '../components/OTPModal';
import './AuthPages.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [currentOTP, setCurrentOTP] = useState('');

  const validateForm = () => {
    if (!name.trim()) return 'Please enter your full name';
    if (!email.trim()) return 'Please enter your email address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create user in Firebase
      await signUpUser(email, password, name);

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (code) => {
    await verifyOTP(email, code);
    // OTP verified — NOW sign back in and redirect
    await loginUser(email, password);
    navigate('/dashboard');
  };

  const handleOTPResend = async () => {
    const otp = generateOTP();
    setCurrentOTP(otp);
    await storeOTP(email, otp);
    try {
      await sendOTPEmail(email, otp, name);
    } catch {
      console.log('OTP for development:', otp);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h2>Join <span className="brand">SignalRX</span></h2>
        <p>
          AI-Powered Social Listening Intelligence Platform for early detection of 
          patient safety signals from social data.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-logo">
            <div className="auth-form-logo-icon">Rx</div>
            <span className="auth-form-logo-text">SignalRX</span>
          </div>

          <h3>Create Account</h3>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="password-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer-text">
            Already have an account? <Link to="/login">Log In</Link>
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
