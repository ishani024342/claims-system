import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function FileClaim() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [form, setForm] = useState({
    id: `CLM-${Date.now()}`,
    amount: '',
    reason: '',
    incidentDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'user') navigate('/');
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const res = await API.get('/policies');
      const active = res.data.filter((p) => p.status === 'ACTIVE' || !p.status);
      setPolicies(active);
      if (active.length > 0) setSelectedPolicy(active[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPolicy) { showError('Please select a policy'); return; }
    if (!form.amount || !form.reason) { showError('Amount and reason are required'); return; }

    try {
      setSubmitting(true);
      await API.post('/claims', {
        id: form.id,
        policyId: selectedPolicy.id,
        amount: Number(form.amount),
        reason: form.reason,
        incidentDate: form.incidentDate,
      });
      showMessage('Claim filed successfully! It is now pending review.');
      setForm({ id: `CLM-${Date.now()}`, amount: '', reason: '', incidentDate: '' });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to file claim');
    } finally {
      setSubmitting(false);
    }
  };

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
          <button onClick={() => navigate('/user')} style={styles.navBtn}>🏠 Overview</button>
          <button onClick={() => navigate('/user/plans')} style={styles.navBtn}>🛒 Browse Plans</button>
          <button onClick={() => navigate('/user')} style={styles.navBtn}>📋 My Policies</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>📝 File a Claim</button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h2 style={styles.pageTitle}>File a New Claim</h2>
          <span style={styles.welcome}>Welcome back, {username}!</span>
        </div>

        {message && <div style={styles.toastSuccess}>{message}</div>}
        {error && <div style={styles.toastError}>{error}</div>}

        {loading ? (
          <p style={styles.empty}>Loading your policies...</p>
        ) : policies.length === 0 ? (
          <div style={styles.card}>
            <p style={styles.empty}>You don't have any active policies yet.</p>
            <button style={styles.applyBtn} onClick={() => navigate('/user/plans')}>
              Browse Plans to Apply
            </button>
          </div>
        ) : (
          <div style={styles.formCard}>
            <label style={styles.label}>Select Policy</label>
            <select
              value={selectedPolicy?.id || ''}
              onChange={(e) => setSelectedPolicy(policies.find((p) => p.id === e.target.value))}
              style={styles.select}
            >
              {policies.map((p) => (
                <option key={p._id} value={p.id}>
                  {p.planName || p.type} — {p.id} (Coverage ₹{p.coverageAmount.toLocaleString()})
                </option>
              ))}
            </select>

            {selectedPolicy && (
              <div style={styles.policyInfo}>
                <span>Coverage limit: <b>₹{selectedPolicy.coverageAmount.toLocaleString()}</b></span>
                <span>Valid: {selectedPolicy.startDate} → {selectedPolicy.endDate}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Claim Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 25000"
                style={styles.input}
              />

              <label style={styles.label}>Incident Date</label>
              <input
                type="date"
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                style={styles.input}
              />

              <label style={styles.label}>Reason / Description</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Describe what happened..."
                style={styles.textarea}
                rows={4}
              />

              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
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
  toastSuccess: { background: '#059669', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  toastError: { background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  empty: { color: '#999', textAlign: 'center', padding: '20px 0' },
  formCard: { background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', maxWidth: '520px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px', marginTop: '14px' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' },
  policyInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', background: '#f8f9fb', padding: '10px 12px', borderRadius: '8px', marginTop: '10px', marginBottom: '6px' },
  submitBtn: { width: '100%', background: '#4f46e5', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginTop: '20px' },
  applyBtn: { background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginTop: '12px' },
};
