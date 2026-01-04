import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Ticket, Settings, LogOut, Home, Calendar } from 'lucide-react';
import ImagesManagement from './ImagesManagement';
import TicketsManagement from './TicketsManagement';
import AdminSettings from './AdminSettings';
import UpcomingFightsManagement from './UpcomingFightsManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('images');

  const handleLogout = () => {
    sessionStorage.removeItem('admin-authenticated');
    navigate('/admindashboard');
  };

  const tabs = [
    { id: 'images', label: 'จัดการภาพ', icon: Image },
    { id: 'tickets', label: 'จัดการตั๋ว', icon: Ticket },
    { id: 'upcoming', label: 'ปรับแต่งการแข่งขัน', icon: Calendar },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black border-b-2 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-wider">
                ADMIN
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">
                Dashboard
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-gray-400 hover:text-yellow-500 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">หน้าแรก</span>
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-wider
                    transition-colors duration-200 border-b-2
                    ${activeTab === tab.id
                      ? 'text-yellow-500 border-yellow-500 bg-gray-900'
                      : 'text-gray-400 border-transparent hover:text-yellow-400 hover:border-yellow-400/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'images' && <ImagesManagement />}
        {activeTab === 'tickets' && <TicketsManagement />}
        {activeTab === 'upcoming' && <UpcomingFightsManagement />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
};

export default AdminDashboard;

