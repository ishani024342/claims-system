import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState({ policyholders: 0, policies: 0, claims: 0, approved: 0 });

  // Policyholders state
  const [policyholders, setPolicyholders] = useState([]);
  const [phForm, setPhForm] = useState({ id: '', name: '', email: '', phone: '' });
  const [editingPh, setEditingPh] = useState(null);

  // Policies state
  const [policies, setPolicies] = useState([]);
  const [polForm, setPolForm] = useState({ id: '', policyholderId: '', type: '', coverageAmount: '', startDate: '', endDate: '' });

  // Claims state
  const [claims, setClaims] = useState([]);
  const [claimForm, setClaimForm] = useState({ id: '', policyId: '', amount: '', reason: '' });

  const [message, setMessage] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'admin') navigate('/');
    loadStats();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadStats = async () => {
    try {
      const [ph, pol, cl] = await Promise.all([
        API.get('/policyholders'),
        API.get('/policies'),
        API.get('/claims'),
      ]);
      setStats({
        policyholders: ph.data.length,
        policies: pol.data.length,
        claims: cl.data.length,
        approved: cl.data.filter(c => c.status === 'Approved').length,
      });
    } catch (err) { console.error(err); }
  };

  const loadPolicyholders = async () => {
    const res = await API.get('/policyholders');
    setPolicyholders(res.data);
  };

  const loadPolicies = async () => {
    const res = await API.get('/policies');
    setPolicies(res.data);
  };

  const loadClaims = async () => {
    const res = await API.get('/claims');
    setClaims(res.data);
  };

  const handleSection = (s) => {
    setSection(s);
    if (s === 'policyholders') loadPolicyholders();
    if (s === 'policies') loadPolicies();
    if (s === 'claims') loadClaims();
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  // ── Policyholder CRUD ──
  const submitPh = async (e) => {
    e.preventDefault();
    try {
      if (editingPh) {
        await API.put(`/policyholders/${editingPh}`, phForm);
        showMessage('Policyholder updated!');
        setEditingPh(null);
      } else {
        await API.post('/policyholders', phForm);
        showMessage('Policyholder created!');
      }
      setPhForm({ id: '', name: '', email: '', phone: '' });
      loadPolicyholders(); loadStats();
    } catch (err) { showMessage(err.response?.data?.error || 'Error'); }
  };

  const deletePh = async (id) => {
    if (!window.confirm('Delete this policyholder?')) return;
    await API.delete(`/policyholders/${id}`);
    showMessage('Deleted!'); loadPolicyholders(); loadStats();
  };

  const editPh = (ph) => {
    setEditingPh(ph.id);
    setPhForm({ id: ph.id, name: ph.name, email: ph.email, phone: ph.phone });
  };

  // ── Policy CRUD ──
  const submitPol = async (e) => {
    e.preventDefault();
    try {
      await API.post('/policies', { ...polForm, coverageAmount: Number(polForm.coverageAmount) });
      showMessage('Policy created!');
      setPolForm({ id: '', policyholderId: '', type: '', coverageAmount: '', startDate: '', endDate: '' });
      loadPolicies(); loadStats();
    } catch (err) { showMessage(err.response?.data?.error || 'Error'); }
  };

  const deletePol = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    await API.delete(`/policies/${id}`);
    showMessage('Deleted!'); loadPolicies(); loadStats();
  };

  // ── Claim CRUD ──
  const submitClaim = async (e) => {
    e.preventDefault();
    try {
      await API.post('/claims', { ...claimForm, amount: Number(claimForm.amount) });
      showMessage('Claim created!');
      setClaimForm({ id: '', policyId: '', amount: '', reason: '' });
      loadClaims(); loadStats();
    } catch (err) { showMessage(err.response?.data?.error || 'Error'); }
  };

  const updateClaimStatus = async (id, status) => {
    await API.patch(`/claims/${id}/status`, { status });
    showMessage(`Claim ${status}!`); loadClaims(); loadStats();
  };

  const deleteClaim = async (id) => {
    if (!window.confirm('Delete this claim?')) return;
    await API.delete(`/claims/${id}`);
    showMessage('Deleted!'); loadClaims(); loadStats();
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>⚡ Claims</div>
        <nav style={styles.nav}>
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'policyholders', label: '👥 Policyholders' },
            { key: 'policies', label: '📋 Policies' },
            { key: 'claims', label: '📝 Claims' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => handleSection(item.key)}
              style={{ ...styles.navBtn, ...(section === item.key ? styles.navBtnActive : {}) }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main Container */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h2 style={styles.pageTitle}>{section.charAt(0).toUpperCase() + section.slice(1)}</h2>
          <span style={styles.welcome}>Welcome, {username}!</span>
        </div>

        {message && <div style={styles.toast}>{message}</div>}

        {/* Dashboard Grid Overview */}
        {section === 'dashboard' && (
          <div style={styles.statsGrid}>
            {[
              { icon: '👥', label: 'Policyholders', value: stats.policyholders, color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.15)' },
              { icon: '📋', label: 'Policies', value: stats.policies, color: '#0891b2', bg: 'rgba(8, 145, 178, 0.15)' },
              { icon: '📝', label: 'Total Claims', value: stats.claims, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)' },
              { icon: '✅', label: 'Approved Claims', value: stats.approved, color: 'var(--badge-approved-text)', bg: 'var(--badge-approved-bg)' },
            ].map(s => (
              <div key={s.label} style={styles.statCard}>
                <div style={{ ...styles.statIconBox, background: s.bg }}>
                  <span style={{ fontSize: '28px' }}>{s.icon}</span>
                </div>
                <div>
                  <p style={styles.statLabel}>{s.label}</p>
                  <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Policyholders Section */}
        {section === 'policyholders' && (
          <div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>{editingPh ? 'Edit Policyholder' : 'Add Policyholder'}</h3>
              <form onSubmit={submitPh} style={styles.formGrid}>
                {!editingPh && <input placeholder="ID (e.g. PH002)" value={phForm.id} onChange={e => setPhForm({ ...phForm, id: e.target.value })} required />}
                <input placeholder="Full Name" value={phForm.name} onChange={e => setPhForm({ ...phForm, name: e.target.value })} required />
                <input placeholder="Email" value={phForm.email} onChange={e => setPhForm({ ...phForm, email: e.target.value })} required />
                <input placeholder="Phone" value={phForm.phone} onChange={e => setPhForm({ ...phForm, phone: e.target.value })} required />
                <button type="submit" className="btn-primary">{(editingPh ? 'Update' : 'Add')}</button>
                {editingPh && <button type="button" onClick={() => { setEditingPh(null); setPhForm({ id: '', name: '', email: '', phone: '' }); }} style={{ background: 'var(--bg-body)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>Cancel</button>}
              </form>
            </div>
            <div style={{ marginTop: '16px' }}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                <tbody>
                  {policyholders.map(ph => (
                    <tr key={ph._id}>
                      <td>{ph.id}</td><td>{ph.name}</td><td>{ph.email}</td><td>{ph.phone}</td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => editPh(ph)}>Edit</button>
                        <button className="btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => deletePh(ph.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Policies Section */}
        {section === 'policies' && (
          <div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Policy</h3>
              <form onSubmit={submitPol} style={styles.formGrid}>
                <input placeholder="Policy ID (e.g. POL002)" value={polForm.id} onChange={e => setPolForm({ ...polForm, id: e.target.value })} required />
                <input placeholder="Policyholder ID" value={polForm.policyholderId} onChange={e => setPolForm({ ...polForm, policyholderId: e.target.value })} required />
                <input placeholder="Type (e.g. Health)" value={polForm.type} onChange={e => setPolForm({ ...polForm, type: e.target.value })} required />
                <input placeholder="Coverage Amount" type="number" value={polForm.coverageAmount} onChange={e => setPolForm({ ...polForm, coverageAmount: e.target.value })} required />
                <input placeholder="Start Date" type="date" value={polForm.startDate} onChange={e => setPolForm({ ...polForm, startDate: e.target.value })} required />
                <input placeholder="End Date" type="date" value={polForm.endDate} onChange={e => setPolForm({ ...polForm, endDate: e.target.value })} required />
                <button type="submit" className="btn-primary">Add Policy</button>
              </form>
            </div>
            <div style={{ marginTop: '16px' }}>
              <table>
                <thead><tr><th>ID</th><th>Holder ID</th><th>Type</th><th>Coverage</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
                <tbody>
                  {policies.map(p => (
                    <tr key={p._id}>
                      <td>{p.id}</td><td>{p.policyholderId}</td><td>{p.type}</td>
                      <td>₹{p.coverageAmount.toLocaleString()}</td>
                      <td>{p.startDate}</td><td>{p.endDate}</td>
                      <td><button className="btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => deletePol(p.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Claims Processing Section */}
        {section === 'claims' && (
          <div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Claim</h3>
              <form onSubmit={submitClaim} style={styles.formGrid}>
                <input placeholder="Claim ID (e.g. CLM002)" value={claimForm.id} onChange={e => setClaimForm({ ...claimForm, id: e.target.value })} required />
                <input placeholder="Policy ID" value={claimForm.policyId} onChange={e => setClaimForm({ ...claimForm, policyId: e.target.value })} required />
                <input placeholder="Amount" type="number" value={claimForm.amount} onChange={e => setClaimForm({ ...claimForm, amount: e.target.value })} required />
                <input placeholder="Reason" value={claimForm.reason} onChange={e => setClaimForm({ ...claimForm, reason: e.target.value })} required />
                <button type="submit" className="btn-primary">Add Claim</button>
              </form>
            </div>
            <div style={{ marginTop: '16px' }}>
              <table>
                <thead><tr><th>ID</th><th>Policy ID</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {claims.map(c => (
                    <tr key={c._id}>
                      <td>{c.id}</td><td>{c.policyId}</td>
                      <td>₹{c.amount.toLocaleString()}</td>
                      <td>{c.reason}</td>
                      <td><span className={`badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                      <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {c.status === 'Pending' && <>
                          <button className="btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateClaimStatus(c.id, 'Approved')}>Approve</button>
                          <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateClaimStatus(c.id, 'Rejected')}>Reject</button>
                        </>}
                        <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => deleteClaim(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   THEME COMPATIBLE INLINE STYLES FOR ADMIN PORTAL (CLEANED & UNIFIED)
   ========================================================================== */
const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: 'var(--bg-body)' },
  sidebar: {
    width: '220px', background: '#11131a', color: '#f3f4f6',
    display: 'flex', flexDirection: 'column', padding: '24px 12px',
    position: 'fixed', height: '100vh', borderRight: '1px solid var(--border-color)'
  },
  logo: { fontSize: '18px', fontWeight: '700', padding: '8px 12px', marginBottom: '24px', color: 'var(--primary)' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navBtn: {
    background: 'transparent', color: 'var(--text-muted)', padding: '10px 12px',
    borderRadius: '8px', textAlign: 'left', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
  },
  navBtnActive: { background: 'var(--primary)', color: 'white' },
  logoutBtn: {
    background: '#ef4444', color: 'white', padding: '10px 12px',
    borderRadius: '8px', textAlign: 'left', fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: 'auto'
  },
  main: { marginLeft: '220px', flex: 1, padding: '24px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' },
  welcome: { color: 'var(--text-muted)', fontSize: '14px' },
  toast: {
    background: 'var(--primary)', color: 'white', padding: '10px 20px',
    borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: {
    background: 'var(--bg-surface)', borderRadius: '14px', padding: '24px',
    display: 'flex', alignItems: 'center', gap: '16px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)'
  },
  statIconBox: { padding: '12px', borderRadius: '10px' },
  statLabel: { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' },
  statValue: { fontSize: '32px', fontWeight: '800', lineHeight: '1' },
  card: { 
    background: 'var(--bg-surface)', borderRadius: '16px', padding: '32px', 
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)',
    maxWidth: '900px', marginBottom: '24px' 
  },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-main)' },
  formGrid: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
    gap: '16px', alignItems: 'end' 
  },
};