import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const res = await API.post(endpoint, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      if (res.data.role === 'admin') navigate('/admin');
      else navigate('/user');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>⚡</div>
          <h1 style={styles.title}>Claims Management</h1>
          <p style={styles.subtitle}>{isRegister ? 'Create your account' : 'Sign in to your account'}</p>
        </div>

        <div style={styles.toggle}>
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{ ...styles.toggleBtn, ...(isRegister ? {} : styles.toggleActive) }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{ ...styles.toggleBtn, ...(isRegister ? styles.toggleActive : {}) }}
          >
            Register
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
          )}
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={styles.btn}
            disabled={loading}
          >
            {loading ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {!isRegister && (
          <div style={styles.hint}>
            <p>New here? <strong onClick={() => setIsRegister(true)} style={{color: 'var(--primary)', cursor: 'pointer'}}>Create an account</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   THEME-AWARE STYLES FOR AUTHENTICATION SCREEN
   ========================================================================== */
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Swapped the bright purple gradient to a premium variable-driven color background
    background: 'radial-gradient(circle at top right, var(--bg-hover) 0%, var(--bg-body) 100%)',
  },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border-color)',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  logo: { fontSize: '40px', marginBottom: '12px' },
  title: { fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' },
  subtitle: { color: 'var(--text-muted)', fontSize: '14px' },
  toggle: {
    display: 'flex',
    background: 'var(--bg-body)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px',
    border: '1px solid var(--border-color)'
  },
  toggleBtn: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  toggleActive: {
    background: 'var(--bg-surface)',
    color: 'var(--primary)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  error: {
    background: 'var(--badge-rejected-bg)',
    color: 'var(--badge-rejected-text)',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' },
  btn: { padding: '12px', fontSize: '15px', fontWeight: '600', marginTop: '8px', borderRadius: '8px', cursor: 'pointer' },
  hint: {
    marginTop: '24px',
    padding: '12px',
    background: 'var(--bg-hover)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: '1.8',
    border: '1px solid var(--border-color)'
  },
};