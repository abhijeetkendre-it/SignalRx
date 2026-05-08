import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { 
  signUpUser, 
  loginUser,
  generateOTP, 
  storeOTP, 
  sendOTPEmail, 
  verifyOTP,
  checkUserExistsByEmail
} from '../services/firebase';
import OTPInputBoxes from '../components/OTPInputBoxes';
import './AuthPages.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInlineOTP, setShowInlineOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const validateForm = () => {
    if (!name.trim()) return 'Please enter your full name';
    if (!email.trim()) return 'Please enter your email address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleInitialSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exists = await checkUserExistsByEmail(email);
      if (exists) {
        // User already exists, redirect to login
        navigate('/login', { state: { email } });
        return;
      }

      // Not an existing user, send OTP and show inline OTP box
      const otp = generateOTP();
      await storeOTP(email, otp);
      try {
        await sendOTPEmail(email, otp, name);
      } catch (err) {
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
      // OTP verified, now create user and login
      await signUpUser(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      if (err.message.includes('Invalid OTP') || err.message.includes('expired')) {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        // Self-healing: if the user was deleted from Firestore but exists in Auth
        try {
          await loginUser(email, password);
          navigate('/dashboard');
        } catch (loginErr) {
          setError('An account with this email exists. Please use the exact password to sync it, or go to Log In.');
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showInlineOTP) {
      await handleInitialSubmit();
    } else {
      await handleFinalSubmit();
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
                disabled={showInlineOTP}
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
                disabled={showInlineOTP}
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
                  disabled={showInlineOTP}
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
                  disabled={showInlineOTP}
                  required
                />
                <button type="button" className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Processing...' : (showInlineOTP ? 'Verify & Sign Up' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-footer-text">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
