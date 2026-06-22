import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function BrowsePlans() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [plans, setPlans] = useState([]);
  const [policyholders, setPolicyholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Apply modal state
  const [applyingPlan, setApplyingPlan] = useState(null);
  const [selectedPhId, setSelectedPhId] = useState('');
  const [showNewPh, setShowNewPh] = useState(false);
  const [newPh, setNewPh] = useState({ id: '', name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'user') navigate('/');
    loadData();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, phRes] = await Promise.all([
        API.get('/policy-plans'),
        API.get('/policyholders'),
      ]);
      setPlans(plansRes.data);
      setPolicyholders(phRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openApplyModal = (plan) => {
    setApplyingPlan(plan);
    setSelectedPhId(policyholders[0]?.id || '');
    setShowNewPh(policyholders.length === 0);
    setNewPh({ id: `PH-${Date.now()}`, name: '', email: '', phone: '' });
  };

  const closeModal = () => {
    setApplyingPlan(null);
    setError('');
  };

  const handleApply = async () => {
    try {
      setSubmitting(true);
      let policyholderId = selectedPhId;

      // Create a new policyholder first if needed
      if (showNewPh) {
        if (!newPh.name || !newPh.email || !newPh.phone) {
          showError('Please fill in all policyholder fields');
          setSubmitting(false);
          return;
        }
        const phRes = await API.post('/policyholders', newPh);
        policyholderId = phRes.data.id;
        setPolicyholders([...policyholders, phRes.data]);
      }

      if (!policyholderId) {
        showError('Please select or create a policyholder');
        setSubmitting(false);
        return;
      }

      await API.post(`/policy-plans/${applyingPlan._id}/apply`, { policyholderId });
      showMessage(`Successfully applied for ${applyingPlan.name}!`);
      closeModal();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to apply for plan');
    } finally {
      setSubmitting(false);
    }
  };

  const typeColors = {
    HEALTH: { bg: '#05966915', color: '#059669' },
    AUTO:   { bg: '#4f46e515', color: '#4f46e5' },
    HOME:   { bg: '#d9740615', color: '#d97406' },
    LIFE:   { bg: '#7c3aed15', color: '#7c3aed' },
    TRAVEL: { bg: '#0891b215', color: '#0891b2' },
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
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>🛒 Browse Plans</button>
          <button onClick={() => navigate('/user')} style={styles.navBtn}>📋 My Policies</button>
          <button onClick={() => navigate('/user')} style={styles.navBtn}>📝 My Claims</button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h2 style={styles.pageTitle}>Browse Insurance Plans</h2>
          <span style={styles.welcome}>Welcome back, {username}!</span>
        </div>

        {message && <div style={styles.toastSuccess}>{message}</div>}
        {error && <div style={styles.toastError}>{error}</div>}

        {loading ? (
          <p style={styles.empty}>Loading plans...</p>
        ) : plans.length === 0 ? (
          <div style={styles.card}>
            <p style={styles.empty}>No plans available right now. Check back later!</p>
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {plans.map((plan) => {
              const colors = typeColors[plan.type] || typeColors.HEALTH;
              return (
                <div key={plan._id} style={styles.planCard}>
                  <div style={styles.planHeader}>
                    <span style={{ background: colors.bg, color: colors.color, ...styles.typeBadge }}>
                      {plan.type}
                    </span>
                  </div>
                  <h3 style={styles.planName}>{plan.name}</h3>
                  <p style={styles.planDescription}>{plan.description}</p>

                  <div style={styles.planStats}>
                    <div>
                      <p style={styles.statBig}>₹{plan.coverageAmount.toLocaleString()}</p>
                      <p style={styles.statSmallLabel}>Coverage</p>
                    </div>
                    <div>
                      <p style={styles.statBig}>₹{plan.premium.toLocaleString()}</p>
                      <p style={styles.statSmallLabel}>Premium / yr</p>
                    </div>
                  </div>

                  <p style={styles.duration}>📅 {plan.durationMonths} months coverage period</p>

                  {plan.features?.length > 0 && (
                    <ul style={styles.featureList}>
                      {plan.features.map((f, i) => (
                        <li key={i} style={styles.featureItem}>✓ {f}</li>
                      ))}
                    </ul>
                  )}

                  <button
                    style={styles.applyBtn}
                    onClick={() => openApplyModal(plan)}
                  >
                    Apply Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyingPlan && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Apply for {applyingPlan.name}</h3>
            <p style={styles.modalSubtitle}>Coverage: ₹{applyingPlan.coverageAmount.toLocaleString()} · Premium: ₹{applyingPlan.premium.toLocaleString()}/yr</p>

            {error && <div style={{ ...styles.toastError, marginBottom: '12px' }}>{error}</div>}

            {policyholders.length > 0 && (
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input
                    type="radio"
                    checked={!showNewPh}
                    onChange={() => setShowNewPh(false)}
                    style={{ marginRight: '8px' }}
                  />
                  Use existing policyholder
                </label>
                {!showNewPh && (
                  <select
                    value={selectedPhId}
                    onChange={(e) => setSelectedPhId(e.target.value)}
                    style={styles.select}
                  >
                    {policyholders.map((ph) => (
                      <option key={ph._id} value={ph.id}>{ph.name} ({ph.email})</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                {policyholders.length > 0 && (
                  <input
                    type="radio"
                    checked={showNewPh}
                    onChange={() => setShowNewPh(true)}
                    style={{ marginRight: '8px' }}
                  />
                )}
                Add new policyholder
              </label>
              {showNewPh && (
                <div style={styles.newPhForm}>
                  <input
                    placeholder="Full name"
                    value={newPh.name}
                    onChange={(e) => setNewPh({ ...newPh, name: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="Email"
                    value={newPh.email}
                    onChange={(e) => setNewPh({ ...newPh, email: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="Phone"
                    value={newPh.phone}
                    onChange={(e) => setNewPh({ ...newPh, phone: e.target.value })}
                    style={styles.input}
                  />
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={closeModal} disabled={submitting}>Cancel</button>
              <button style={styles.confirmBtn} onClick={handleApply} disabled={submitting}>
                {submitting ? 'Applying...' : 'Confirm Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  empty: { color: '#999', textAlign: 'center', padding: '40px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  planCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
  planHeader: { marginBottom: '12px' },
  typeBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  planName: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' },
  planDescription: { fontSize: '13px', color: '#666', marginBottom: '16px', minHeight: '36px' },
  planStats: { display: 'flex', gap: '24px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' },
  statBig: { fontSize: '20px', fontWeight: '700', color: '#1a1a2e' },
  statSmallLabel: { fontSize: '11px', color: '#999' },
  duration: { fontSize: '13px', color: '#666', marginBottom: '12px' },
  featureList: { listStyle: 'none', padding: 0, marginBottom: '16px', flex: 1 },
  featureItem: { fontSize: '13px', color: '#059669', marginBottom: '6px' },
  applyBtn: { background: '#4f46e5', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginTop: 'auto' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: 'white', borderRadius: '16px', padding: '28px', width: '420px', maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  modalSubtitle: { fontSize: '13px', color: '#666', marginBottom: '20px' },
  formGroup: { marginBottom: '16px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#333', display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  newPhForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight: '500' },
  confirmBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', cursor: 'pointer', fontWeight: '600' },
};
