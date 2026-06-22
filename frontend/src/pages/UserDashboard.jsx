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
    if (status === 'Approved') return 'var(--badge-approved-text)';
    if (status === 'Rejected') return 'var(--badge-rejected-text)';
    return 'var(--badge-pending-text)';
  };

  const getStatusBg = (status) => {
    if (status === 'Approved') return 'var(--badge-approved-bg)';
    if (status === 'Rejected') return 'var(--badge-rejected-bg)';
    return 'var(--badge-pending-bg)';
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
          <button onClick={() => navigate('/user/plans')} style={styles.navBtn}>🛒 Browse Plans</button>
          <button onClick={() => navigate('/user/claims/new')} style={styles.navBtn}>➕ File a Claim</button>
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main Content */}
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

        {/* Overview Tab */}
        {section === 'overview' && (
          <div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: 'rgba(99, 102, 241, 0.15)' }}>
                  <span style={{ fontSize: '28px' }}>📋</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Active Policies</p>
                  <p style={{ ...styles.statValue, color: 'var(--primary)' }}>{policies.length}</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: 'rgba(124, 58, 237, 0.15)' }}>
                  <span style={{ fontSize: '28px' }}>📝</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Total Claims</p>
                  <p style={{ ...styles.statValue, color: '#7c3aed' }}>{claims.length}</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: 'var(--badge-approved-bg)' }}>
                  <span style={{ fontSize: '28px' }}>✅</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Approved</p>
                  <p style={{ ...styles.statValue, color: 'var(--badge-approved-text)' }}>{claims.filter(c => c.status === 'Approved').length}</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: 'var(--badge-pending-bg)' }}>
                  <span style={{ fontSize: '28px' }}>⏳</span>
                </div>
                <div>
                  <p style={styles.statLabel}>Pending</p>
                  <p style={{ ...styles.statValue, color: 'var(--badge-pending-text)' }}>{claims.filter(c => c.status === 'Pending').length}</p>
                </div>
              </div>
            </div>

            {/* Recent Claims Table Box */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Recent Claims</h3>
              {claims.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📂</span>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '6px', fontSize: '16px' }}>No Claims Found</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>You haven't submitted any insurance claim records yet.</p>
                  <button onClick={() => navigate('/user/claims/new')} className="btn-primary" style={{ padding: '8px 16px' }}>
                    ➕ File Your First Claim
                  </button>
                </div>
              ) : (
                <table>
                  <thead><tr><th>Claim ID</th><th>Policy</th><th>Amount</th><th>Reason</th><th>Status</th></tr></thead>
                  <tbody>
                    {claims.slice(0, 5).map(c => (
                      <tr key={c._id}>
                        <td><strong>{c.id}</strong></td>
                        <td>{c.policyId}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>₹{c.amount.toLocaleString()}</td>
                        <td>{c.reason}</td>
                        <td>
                          <span style={{
                            background: getStatusBg(c.status),
                            color: getStatusColor(c.status),
                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
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

        {/* Policies Tab */}
        {section === 'policies' && (
          <div style={styles.cardsGrid}>
            {policies.length === 0 ? (
              <div style={styles.card}>
                <p style={styles.empty}>No policies found.</p>
              </div>
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

        {/* Claims Tab */}
        {section === 'claims' && (
          <div>
            {selectedPolicy && (
              <button
                onClick={() => { setSelectedPolicy(null); }}
                style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', marginBottom: '16px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
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
                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                          }}>{c.status}</span>
                        </td>
                        <td>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: c.status === 'Pending' ? '33%' : '100%',
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

/* ==========================================================================
   THEME COMPATIBLE INLINE STYLES (CLEANED & UNIFIED)
   ========================================================================== */
const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: 'var(--bg-body)' },
  sidebar: {
    width: '220px', background: '#11131a', color: '#f3f4f6',
    display: 'flex', flexDirection: 'column', padding: '24px 12px',
    position: 'fixed', height: '100vh', borderRight: '1px solid var(--border-color)'
  },
  logo: { fontSize: '18px', fontWeight: '700', padding: '8px 12px', marginBottom: '16px', color: 'var(--primary)' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '24px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px', color: 'white' },
  userName: { fontSize: '14px', fontWeight: '600', color: 'white' },
  userRole: { fontSize: '11px', color: 'var(--text-muted)' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navBtn: { background: 'transparent', color: 'var(--text-muted)', padding: '12px 14px', borderRadius: '8px', textAlign: 'left', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  navBtnActive: { background: 'var(--primary)', color: 'white' },
  logoutBtn: { background: '#ef4444', color: 'white', padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: 'auto' },
  main: { marginLeft: '220px', flex: 1, padding: '24px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' },
  welcome: { color: 'var(--text-muted)', fontSize: '14px' },
  toast: { background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { 
    background: 'var(--bg-surface)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '14px', 
    padding: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    boxShadow: 'var(--shadow)' 
  },
  statIconBox: { padding: '12px', borderRadius: '10px' },
  statLabel: { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' },
  statValue: { fontSize: '32px', fontWeight: '800', lineHeight: '1' },
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-main)' },
  emptyContainer: { textAlign: 'center', padding: '40px 20px' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', padding: '40px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  policyCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow)' },
  policyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  policyType: { background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  policyId: { color: 'var(--text-muted)', fontSize: '13px' },
  policyDetail: { marginBottom: '16px' },
  policyAmount: { fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' },
  policyLabel: { fontSize: '12px', color: 'var(--text-muted)' },
  policyDates: { display: 'flex', justifyContent: 'space-between' },
  dateLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
  dateValue: { fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' },
  progressBar: { height: '6px', background: 'var(--border-color)', borderRadius: '3px', width: '80px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s' },
};