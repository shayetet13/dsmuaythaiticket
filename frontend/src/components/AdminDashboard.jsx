import React, { useState } from 'react';
import { Image, Ticket, Settings, LogOut, Home, Calendar, FileText, Building2, Bell, Menu, X } from 'lucide-react';
import StadiumsManagement from './StadiumsManagement';
import ImagesManagement from './ImagesManagement';
import TicketsManagement from './TicketsManagement';
import AdminSettings from './AdminSettings';
import UpcomingFightsManagement from './UpcomingFightsManagement';
import LogsManagement from './LogsManagement';
import NewsPopupManagement from './NewsPopupManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stadiums');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('admin-authenticated');
    window.location.href = '/';
  };

  const tabs = [
    { id: 'stadiums', label: 'manage stadiums', icon: Building2 },
    { id: 'images', label: 'จัดการภาพ', icon: Image },
    { id: 'tickets', label: 'จัดการตั๋ว', icon: Ticket },
    { id: 'upcoming', label: 'ปรับแต่งการแข่งขัน', icon: Calendar },
    { id: 'news-popup', label: 'News Pop up', icon: Bell },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black border-b-2 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-xl md:text-3xl font-black bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-wider">
                ADMIN
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest hidden sm:block">
                Dashboard
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <a
                href="/"
                className="text-gray-400 hover:text-yellow-500 transition-colors flex items-center gap-1 md:gap-2 p-2 md:p-0"
                title="หน้าแรก"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">หน้าแรก</span>
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 md:gap-2 p-2 md:p-0"
                title="ออกจากระบบ"
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
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                {tabs.find(tab => tab.id === activeTab) && (() => {
                  const ActiveIcon = tabs.find(tab => tab.id === activeTab).icon;
                  return (
                    <>
                      <ActiveIcon className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold uppercase tracking-wider text-sm">
                        {tabs.find(tab => tab.id === activeTab).label}
                      </span>
                    </>
                  );
                })()}
              </div>
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="bg-gray-900 border-t border-gray-700">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-wider
                        transition-colors duration-200 border-l-4
                        ${activeTab === tab.id
                          ? 'text-yellow-500 border-yellow-500 bg-gray-800'
                          : 'text-gray-400 border-transparent hover:text-yellow-400 hover:bg-gray-800/50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {activeTab === 'stadiums' && <StadiumsManagement />}
        {activeTab === 'images' && <ImagesManagement />}
        {activeTab === 'tickets' && <TicketsManagement />}
        {activeTab === 'upcoming' && <UpcomingFightsManagement />}
        {activeTab === 'news-popup' && <NewsPopupManagement />}
        {activeTab === 'logs' && <LogsManagement />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
};

export default AdminDashboard;

