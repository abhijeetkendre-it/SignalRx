import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthChange, logoutUser } from './services/firebase';
import { getProjects, getStats, getAlerts } from './services/api';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import OTPDashboard from './pages/OTPDashboard';

// Dashboard components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SignalFeed from './components/SignalFeed';
import Analytics from './components/Analytics';
import TimelineView from './components/TimelineView';
import AIPipeline from './components/AIPipeline';
import SafetyAlerts from './components/SafetyAlerts';
import PIIMonitor from './components/PIIMonitor';
import './App.css';

// ── Protected Route Wrapper ─────────────────────────────────
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ── Dashboard Layout ────────────────────────────────────────
function DashboardLayout({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    getProjects().then(p => {
      setProjects(p);
      if (p.length > 0) setActiveProject(p[0]);
    });
    getAlerts().then(setAlerts);
  }, []);

  useEffect(() => {
    if (activeProject) {
      getStats(activeProject.id).then(setStats);
      getAlerts(activeProject.id).then(setAlerts);
    } else {
      getStats().then(setStats);
    }
  }, [activeProject]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const pages = {
    dashboard: <Dashboard stats={stats} project={activeProject} />,
    signals: <SignalFeed project={activeProject} />,
    analytics: <Analytics project={activeProject} />,
    timeline: <TimelineView project={activeProject} />,
    pipeline: <AIPipeline />,
    safety: <SafetyAlerts project={activeProject} />,
    pii: <PIIMonitor project={activeProject} />,
  };

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        alerts={alerts}
        stats={stats}
        onLogout={handleLogout}
        user={user}
      />
      <div className="main-area">
        <Header stats={stats} alerts={alerts} user={user} />
        <div className="content">{pages[activeTab]}</div>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0e1a'
      }}>
        <div className="spinner" style={{
          width: 40,
          height: 40,
          border: '3px solid #1e2a45',
          borderTopColor: '#06d6d6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      {/* Protected dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <DashboardLayout user={user} />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/panel" element={<AdminPanel />} />
      <Route path="/otp-dashboard" element={<OTPDashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
