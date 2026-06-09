import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function UserDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [section, setSection] = useState('overview');
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'user') navigate('/');
    loadData();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadData = async () => {
    try {
      const [pol, cl] = await Promise.all([
        API.get('/policies'),
        API.get('/claims'),
      ]);
      setPolicies(pol.data);
      setClaims(cl.data);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const getStatusColor = (status) => {
    if (status === 'Approved') return '#059669';
    if (status === 'Rejected') return '#dc2626';
    return '#d97706';
  };

  const getStatusBg = (status) => {
    if (status === 'Approved') return '#d1fae5';
    if (status === 'Rejected') return '#fee2e2';
    return '#fef3c7';
  };

  const viewPolicyClaims = (policy) => {
    setSelectedPolicy(policy);
    setSection('claims');
  };

  const policyClaims = selectedPolicy
    ? claims.filter(c => c.policyId === selectedPolicy.id)
    : claims;

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>⚡ Claims</div>
        <div style={styles.userBadge}>
          <div style={styles.avatar}>{username?.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.userName}>{username}</p>
            <p style={styles.userRole}>Policyholder</p>
          </div>
        </div>
        <nav style={styles.nav}>
          {[
            { key: 'overview', label: '🏠 Overview' },
            { key: 'policies', label: '📋 My Policies' },
            { key: 'claims', label: '📝 My Claims' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSelectedPolicy(null); }}
              style={{ ...styles.navBtn, ...(section === item.key ? styles.navBtnActive : {}) }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h2 style={styles.pageTitle}>
            {section === 'overview' && 'Overview'}
            {section === 'policies' && 'My Policies'}
            {section === 'claims' && (selectedPolicy ? `Claims for ${selectedPolicy.id}` : 'All My Claims')}
          </h2>
          <span style={styles.welcome}>Welcome back, {username}!</span>
        </div>

        {message && <div style={styles.toast}>{message}</div>}

        {/* Overview */}
        {section === 'overview' && (
          <div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: '#4f46e515' }}>
                  <span style={{ fontSize: '28px' }}>📋</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Active Policies</p>
                  <p style={{ ...styles.statValue, color: '#4f46e5' }}>{policies.length}</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: '#7c3aed15' }}>
                  <span style={{ fontSize: '28px' }}>📝</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Total Claims</p>
                  <p style={{ ...styles.statValue, color: '#7c3aed' }}>{claims.length}</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: '#05996915' }}>
                  <span style={{ fontSize: '28px' }}>✅</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Approved</p>
                  <p style={{ ...styles.statValue, color: '#059669' }}>{claims.filter(c => c.status === 'Approved').length}</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: '#d9740615' }}>
                  <span style={{ fontSize: '28px' }}>⏳</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Pending</p>
                  <p style={{ ...styles.statValue, color: '#d97406' }}>{claims.filter(c => c.status === 'Pending').length}</p>
                </div>
              </div>
            </div>

            {/* Recent Claims */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Recent Claims</h3>
              {claims.length === 0 ? (
                <p style={styles.empty}>No claims found.</p>
              ) : (
                <table>
                  <thead><tr><th>Claim ID</th><th>Policy</th><th>Amount</th><th>Reason</th><th>Status</th></tr></thead>
                  <tbody>
                    {claims.slice(0, 5).map(c => (
                      <tr key={c._id}>
                        <td>{c.id}</td>
                        <td>{c.policyId}</td>
                        <td>₹{c.amount.toLocaleString()}</td>
                        <td>{c.reason}</td>
                        <td>
                          <span style={{
                            background: getStatusBg(c.status),
                            color: getStatusColor(c.status),
                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                          }}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Policies */}
        {section === 'policies' && (
          <div style={styles.cardsGrid}>
            {policies.length === 0 ? (
              <p style={styles.empty}>No policies found.</p>
            ) : (
              policies.map(p => (
                <div key={p._id} style={styles.policyCard}>
                  <div style={styles.policyHeader}>
                    <span style={styles.policyType}>{p.type}</span>
                    <span style={styles.policyId}>{p.id}</span>
                  </div>
                  <div style={styles.policyDetail}>
                    <p style={styles.policyAmount}>₹{p.coverageAmount.toLocaleString()}</p>
                    <p style={styles.policyLabel}>Coverage Amount</p>
                  </div>
                  <div style={styles.policyDates}>
                    <div>
                      <p style={styles.dateLabel}>Start Date</p>
                      <p style={styles.dateValue}>{p.startDate}</p>
                    </div>
                    <div>
                      <p style={styles.dateLabel}>End Date</p>
                      <p style={styles.dateValue}>{p.endDate}</p>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '12px', padding: '8px' }}
                    onClick={() => viewPolicyClaims(p)}
                  >
                    View Claims
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Claims */}
        {section === 'claims' && (
          <div>
            {selectedPolicy && (
              <button
                onClick={() => { setSelectedPolicy(null); }}
                style={{ background: '#e5e7eb', color: '#333', marginBottom: '16px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                ← Back to all claims
              </button>
            )}
            <div style={styles.card}>
              {policyClaims.length === 0 ? (
                <p style={styles.empty}>No claims found.</p>
              ) : (
                <table>
                  <thead><tr><th>Claim ID</th><th>Policy</th><th>Amount</th><th>Reason</th><th>Status</th><th>Progress</th></tr></thead>
                  <tbody>
                    {policyClaims.map(c => (
                      <tr key={c._id}>
                        <td>{c.id}</td>
                        <td>{c.policyId}</td>
                        <td>₹{c.amount.toLocaleString()}</td>
                        <td>{c.reason}</td>
                        <td>
                          <span style={{
                            background: getStatusBg(c.status),
                            color: getStatusColor(c.status),
                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                          }}>{c.status}</span>
                        </td>
                        <td>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: c.status === 'Pending' ? '33%' : c.status === 'Approved' ? '100%' : '100%',
                              background: getStatusColor(c.status),
                            }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
  sidebar: {
    width: '220px', background: '#1a1a2e', color: 'white',
    display: 'flex', flexDirection: 'column', padding: '24px 12px',
    position: 'fixed', height: '100vh',
  },
  logo: { fontSize: '18px', fontWeight: '700', padding: '8px 12px', marginBottom: '16px', color: '#a78bfa' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#ffffff10', borderRadius: '10px', marginBottom: '24px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' },
  userName: { fontSize: '14px', fontWeight: '600', color: 'white' },
  userRole: { fontSize: '11px', color: '#a78bfa' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navBtn: { background: 'transparent', color: '#ccc', padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '14px', border: 'none', cursor: 'pointer' },
  navBtnActive: { background: '#4f46e5', color: 'white' },
  logoutBtn: { background: '#ef4444', color: 'white', padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '14px', border: 'none', cursor: 'pointer' },
  main: { marginLeft: '220px', flex: 1, padding: '24px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  welcome: { color: '#666', fontSize: '14px' },
  toast: { background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  statIconBox: { padding: '12px', borderRadius: '10px' },
  statLabel: { fontSize: '13px', color: '#666', marginBottom: '4px' },
  statValue: { fontSize: '28px', fontWeight: '700' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' },
  empty: { color: '#999', textAlign: 'center', padding: '40px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  policyCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  policyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  policyType: { background: '#4f46e515', color: '#4f46e5', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  policyId: { color: '#999', fontSize: '13px' },
  policyDetail: { marginBottom: '16px' },
  policyAmount: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e' },
  policyLabel: { fontSize: '12px', color: '#999' },
  policyDates: { display: 'flex', justifyContent: 'space-between' },
  dateLabel: { fontSize: '11px', color: '#999', marginBottom: '2px' },
  dateValue: { fontSize: '13px', fontWeight: '500', color: '#333' },
  progressBar: { height: '6px', background: '#e5e7eb', borderRadius: '3px', width: '80px' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s' },
};