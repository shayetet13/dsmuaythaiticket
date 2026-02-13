import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (stored in sessionStorage)
    const authStatus = sessionStorage.getItem('admin-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('admin-authenticated', 'true');
    setIsAuthenticated(true);
  };

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  return <AdminLogin onLogin={handleLogin} />;
};

export default AdminPage;

