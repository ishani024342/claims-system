import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminClaims() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'admin') navigate('/');
    loadClaims();
  }, []);

  const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const loadClaims = async () => {
    try {
      setLoading(true);
      const res = await API.get('/claims');
      setClaims(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => status === 'Approved' ? '#059669' : status === 'Rejected' ? '#dc2626' : '#d97706';
  const getStatusBg = (status) => status === 'Approved' ? '#d1fae5' : status === 'Rejected' ? '#fee2e2' : '#fef3c7';

  const openAction = (claim) => { setActingOn(claim); setAdminNote(''); };
  const closeAction = () => { setActingOn(null); setAdminNote(''); };

  const decide = async (status) => {
    try {
      await API.patch(`/claims/${actingOn.id}/status`, { status, adminNote });
      showMessage(`Claim ${actingOn.id} ${status.toLowerCase()}`);
      closeAction();
      loadClaims();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update claim');
    }
  };

  const filteredClaims = filter === 'All' ? claims : claims.filter((c) => c.status === filter);

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
          <button onClick={() => navigate('/admin/plans')} style={styles.navBtn}>📦 Manage Plans</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>📝 Claims</button>
          <button onClick={() => navigate('/admin')} style={styles.navBtn}>👥 Policyholders</button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h2 style={styles.pageTitle}>Manage Claims</h2>
          <div style={styles.filterRow}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {message && <div style={styles.toastSuccess}>{message}</div>}
        {error && <div style={styles.toastError}>{error}</div>}

        {loading ? (
          <p style={styles.empty}>Loading claims...</p>
        ) : (
          <div style={styles.card}>
            {filteredClaims.length === 0 ? (
              <p style={styles.empty}>No claims found.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Claim ID</th>
                    <th style={styles.th}>Policy</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((c) => (
                    <tr key={c._id}>
                      <td style={styles.td}>{c.id}</td>
                      <td style={styles.td}>{c.policyId}</td>
                      <td style={styles.td}>₹{c.amount.toLocaleString()}</td>
                      <td style={styles.td}>{c.reason}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: getStatusBg(c.status), color: getStatusColor(c.status),
                          padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                        }}>{c.status}</span>
                      </td>
                      <td style={styles.td}>
                        {c.status === 'Pending' ? (
                          <button style={styles.reviewBtn} onClick={() => openAction(c)}>Review</button>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {actingOn && (
        <div style={styles.modalOverlay} onClick={closeAction}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Review Claim {actingOn.id}</h3>
            <div style={styles.modalDetails}>
              <p><b>Policy:</b> {actingOn.policyId}</p>
              <p><b>Amount:</b> ₹{actingOn.amount.toLocaleString()}</p>
              <p><b>Reason:</b> {actingOn.reason}</p>
              {actingOn.incidentDate && <p><b>Incident Date:</b> {actingOn.incidentDate}</p>}
            </div>
            <label style={styles.label}>Admin Note (optional)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note about this decision..."
              style={styles.textarea}
              rows={3}
            />
            <div style={styles.modalActions}>
              <button style={styles.rejectBtn} onClick={() => decide('Rejected')}>✕ Reject</button>
              <button style={styles.approveBtn} onClick={() => decide('Approved')}>✓ Approve</button>
            </div>
            <button style={styles.cancelLink} onClick={closeAction}>Cancel</button>
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
  filterRow: { display: 'flex', gap: '6px' },
  filterBtn: { background: 'white', color: '#666', padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
  filterBtnActive: { background: '#1a1a2e', color: 'white', border: '1px solid #1a1a2e' },
  toastSuccess: { background: '#059669', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  toastError: { background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  empty: { color: '#999', textAlign: 'center', padding: '40px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', fontSize: '12px', color: '#999', borderBottom: '1px solid #eee' },
  td: { padding: '10px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f5f5f5' },
  reviewBtn: { background: '#4f46e5', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: 'white', borderRadius: '16px', padding: '28px', width: '420px' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  modalDetails: { background: '#f8f9fb', borderRadius: '8px', padding: '14px', marginBottom: '16px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '16px' },
  modalActions: { display: 'flex', gap: '10px' },
  rejectBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontWeight: '600' },
  approveBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', cursor: 'pointer', fontWeight: '600' },
  cancelLink: { width: '100%', marginTop: '12px', padding: '8px', background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px' },
};
