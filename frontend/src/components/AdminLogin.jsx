import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD_KEY = 'admin-password';
const DEFAULT_PASSWORD = 'fight1131';

// Initialize password if not exists
if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_PASSWORD);
}

export const getAdminPassword = () => {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
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

