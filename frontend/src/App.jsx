import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import BrowsePlans from './pages/BrowsePlans';
import FileClaim from './pages/FileClaim';
import AdminPlans from './pages/AdminPlans';
import AdminClaims from './pages/AdminClaims';

function App() {
  // 1. Theme State (Defaults to dark mode as per your new CSS configuration)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 2. Watch for theme changes and update the body class list
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      {/* 3. Global Floating Theme Toggle Button placed neatly at the top corner of your app */}
      <div style={{ position: 'fixed', top: '15px', right: '20px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{ 
            background: 'var(--bg-surface)', 
            color: 'var(--text-main)', 
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)',
            padding: '6px 12px'
          }}
        >
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <Routes>
        <Route path="/" element={<Login />} />

        {/* User routes */}
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/user/plans" element={<BrowsePlans />} />
        <Route path="/user/claims/new" element={<FileClaim />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/claims" element={<AdminClaims />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;