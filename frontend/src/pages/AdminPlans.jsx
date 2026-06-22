import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminPlans() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    name: '', type: 'HEALTH', coverageAmount: '', premium: '',
    durationMonths: 12, description: '', features: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'admin') navigate('/');
    loadPlans();
  }, []);

  const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await API.get('/policy-plans/all');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.coverageAmount || !form.premium || !form.description) {
      showError('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      await API.post('/policy-plans', {
        ...form,
        coverageAmount: Number(form.coverageAmount),
        premium: Number(form.premium),
        durationMonths: Number(form.durationMonths),
        features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      });
      showMessage('Plan created successfully!');
      setForm(emptyForm);
      setShowForm(false);
      loadPlans();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (plan) => {
    try {
      await API.patch(`/policy-plans/${plan._id}/toggle`);
      showMessage(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
      loadPlans();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update plan');
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>⚡ Claims Admin</div>
        <div style={styles.userBadge}>
          <div style={styles.avatar}>{username?.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.userName}>{username}</p>
            <p style={styles.userRole}>Administrator</p>
          </div>
        </div>
        <nav style={styles.nav}>
          <button onClick={() => navigate('/admin')} style={styles.navBtn}>🏠 Overview</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>📦 Manage Plans</button>
          <button onClick={() => navigate('/admin')} style={styles.navBtn}>📝 Claims</button>
          <button onClick={() => navigate('/admin')} style={styles.navBtn}>👥 Policyholders</button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h2 style={styles.pageTitle}>Manage Policy Plans</h2>
          <button style={styles.newBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Plan'}
          </button>
        </div>

        {message && <div style={styles.toastSuccess}>{message}</div>}
        {error && <div style={styles.toastError}>{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} style={styles.formCard}>
            <h3 style={styles.formTitle}>Create New Plan</h3>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Plan Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Health Shield Basic"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={styles.input}>
                  <option value="HEALTH">HEALTH</option>
                  <option value="AUTO">AUTO</option>
                  <option value="HOME">HOME</option>
                  <option value="LIFE">LIFE</option>
                  <option value="TRAVEL">TRAVEL</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Coverage Amount (₹)</label>
                <input
                  type="number"
                  value={form.coverageAmount}
                  onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })}
                  placeholder="500000"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Premium (₹/yr)</label>
                <input
                  type="number"
                  value={form.premium}
                  onChange={(e) => setForm({ ...form, premium: e.target.value })}
                  placeholder="12000"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Duration (months)</label>
                <input
                  type="number"
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Features (comma separated)</label>
                <input
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="Cashless hospitalisation, OPD cover"
                  style={styles.input}
                />
              </div>
            </div>
            <label style={styles.label}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short marketing description shown to users"
              style={styles.textarea}
              rows={2}
            />
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Plan'}
            </button>
          </form>
        )}

        {loading ? (
          <p style={styles.empty}>Loading plans...</p>
        ) : (
          <div style={styles.card}>
            {plans.length === 0 ? (
              <p style={styles.empty}>No plans created yet.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Coverage</th>
                    <th style={styles.th}>Premium</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p._id}>
                      <td style={styles.td}>{p.name}</td>
                      <td style={styles.td}>{p.type}</td>
                      <td style={styles.td}>₹{p.coverageAmount.toLocaleString()}</td>
                      <td style={styles.td}>₹{p.premium.toLocaleString()}</td>
                      <td style={styles.td}>{p.durationMonths} mo</td>
                      <td style={styles.td}>
                        <span style={{
                          background: p.isActive ? '#d1fae5' : '#fee2e2',
                          color: p.isActive ? '#059669' : '#dc2626',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                        }}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.toggleBtn} onClick={() => toggleActive(p)}>
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
  newBtn: { background: '#4f46e5', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  toastSuccess: { background: '#059669', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  toastError: { background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  empty: { color: '#999', textAlign: 'center', padding: '40px' },
  formCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '20px' },
  formTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '14px' },
  submitBtn: { background: '#4f46e5', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', fontSize: '12px', color: '#999', borderBottom: '1px solid #eee' },
  td: { padding: '10px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f5f5f5' },
  toggleBtn: { background: '#f0f0f0', color: '#333', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
};
