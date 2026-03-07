import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD_KEY = 'admin-password';
// Get admin password from environment variable (set at build time)
// Fallback to localStorage for backward compatibility, but warn if using default
const DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

// Initialize password if not exists (only if env var is not set)
if (!import.meta.env.VITE_ADMIN_PASSWORD && !localStorage.getItem(ADMIN_PASSWORD_KEY)) {
  console.warn('⚠️ VITE_ADMIN_PASSWORD not set! Using localStorage fallback. Set it in .env file for security.');
  // Don't set a default password - require it to be set via environment variable
}

export const getAdminPassword = () => {
  // Priority: Environment variable > localStorage > empty (will fail login)
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  
  // Debug: Log in development only (will be removed in production build)
  if (import.meta.env.DEV) {
    console.log('🔐 Admin password check:', {
      hasEnvPassword: !!envPassword,
      envPasswordLength: envPassword?.length || 0,
      hasLocalStorage: !!localStorage.getItem(ADMIN_PASSWORD_KEY)
    });
  }
  
  if (envPassword && envPassword.trim() !== '') {
    return envPassword.trim();
  }
  
  const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);
  if (storedPassword && storedPassword.trim() !== '') {
    return storedPassword.trim();
  }
  
  // If neither is set, return empty string (login will fail - this is intentional for security)
  if (import.meta.env.DEV) {
    console.error('❌ Admin password not configured! Set VITE_ADMIN_PASSWORD in .env file.');
  }
  return '';
};

export const setAdminPassword = (password) => {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
};

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = getAdminPassword();
    
    if (password === correctPassword) {
      setError('');
      onLogin();
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-black text-yellow-500 uppercase tracking-wider mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="กรอกรหัสผ่าน"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-500 text-black font-black py-3 px-6 rounded-lg uppercase tracking-wider hover:bg-yellow-400 transition-colors duration-200"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

