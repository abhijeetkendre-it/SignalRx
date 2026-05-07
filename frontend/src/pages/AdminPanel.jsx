import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, UserPlus, LogIn, Shield, Download, Search } from 'lucide-react';
import { getAllUsers, getActivityLogs, updateUserStatus } from '../services/firebase';
import './AdminPanel.css';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check admin auth
    if (sessionStorage.getItem('signalrx_admin') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, logData] = await Promise.all([
        getAllUsers(),
        getActivityLogs()
      ]);
      setUsers(userData);
      setLogs(logData);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await updateUserStatus(uid, newStatus);
      setUsers(users.map(u => u.id === uid ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('signalrx_admin');
    navigate('/admin');
  };

  const handleExport = () => {
    const csvRows = [
      ['Name', 'Email', 'Status', 'Signup Date', 'Last Login', 'Login Count'],
      ...users.map(u => [
        u.name,
        u.email,
        u.status,
        formatDate(u.createdAt),
        formatDate(u.lastLogin),
        u.loginCount || 0
      ])
    ];
    const csv = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signalrx_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats
  const today = new Date().toDateString();
  const todaySignups = logs.filter(l => {
    try {
      const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
      return l.type === 'signup' && d.toDateString() === today;
    } catch { return false; }
  }).length;

  const todayLogins = logs.filter(l => {
    try {
      const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
      return l.type === 'login' && d.toDateString() === today;
    } catch { return false; }
  }).length;

  return (
    <div className="admin-panel">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Shield size={20} style={{ color: '#ef4444' }} />
          <span className="admin-logo">SIGNALRX ADMIN</span>
          <span className="admin-badge">SUPER ADMIN</span>
        </div>
        <div className="admin-header-right">
          <Link to="/otp-dashboard" className="admin-home-btn" style={{ marginRight: 8 }}>🔑 View OTPs</Link>
          <Link to="/" className="admin-home-btn">← Home</Link>
          <button className="admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="admin-content">
        <div className="admin-welcome">
          <h2>Admin Dashboard</h2>
          <p>Manage users, monitor activity, and control access for SignalRX platform.</p>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card blue">
            <div className="admin-stat-label"><Users size={14} /> Total Users</div>
            <div className="admin-stat-value">{users.length}</div>
          </div>
          <div className="admin-stat-card green">
            <div className="admin-stat-label"><UserPlus size={14} /> Active Users</div>
            <div className="admin-stat-value">{users.filter(u => u.status === 'active').length}</div>
          </div>
          <div className="admin-stat-card cyan">
            <div className="admin-stat-label"><UserPlus size={14} /> Today's Signups</div>
            <div className="admin-stat-value">{todaySignups}</div>
          </div>
          <div className="admin-stat-card red">
            <div className="admin-stat-label"><LogIn size={14} /> Today's Logins</div>
            <div className="admin-stat-value">{todayLogins}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📋 Activity Log
          </button>
        </div>

        {/* Search & Export */}
        <div className="admin-search">
          <Search size={16} style={{ color: '#5a6580' }} />
          <input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {activeTab === 'users' && (
            <button className="admin-export-btn" onClick={handleExport}>
              <Download size={14} style={{ marginRight: 4 }} />
              Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner" /></div>
        ) : activeTab === 'users' ? (
          /* Users Table */
          filteredUsers.length === 0 ? (
            <div className="admin-empty">No users found.</div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Signup Date</th>
                    <th>Last Login</th>
                    <th>Logins</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td className="user-name">{u.name || '—'}</td>
                      <td className="user-email">{u.email}</td>
                      <td>
                        <span className={`status-badge ${u.status || 'active'}`}>
                          {(u.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>{formatDate(u.lastLogin)}</td>
                      <td>{u.loginCount || 0}</td>
                      <td>
                        <button
                          className={`admin-action-btn ${u.status === 'active' ? 'disable' : 'enable'}`}
                          onClick={() => handleToggleStatus(u.id, u.status || 'active')}
                        >
                          {u.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Activity Log */
          filteredLogs.length === 0 ? (
            <div className="admin-empty">No activity logs found.</div>
          ) : (
            <div className="activity-list">
              {filteredLogs.map((log, i) => (
                <div key={log.id || i} className="activity-item">
                  <div className={`activity-icon ${log.type}`}>
                    {log.type === 'signup' ? '📝' : log.type === 'login' ? '🔑' : '🚪'}
                  </div>
                  <div className="activity-details">
                    <div className="activity-msg">
                      <strong>{log.name || log.email}</strong>
                      {log.type === 'signup' ? ' created a new account' : log.type === 'login' ? ' logged in' : ' logged out'}
                    </div>
                    <div className="activity-time">{log.email} · {formatDate(log.timestamp)}</div>
                  </div>
                  <span className={`activity-type-badge ${log.type}`}>{log.type}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
