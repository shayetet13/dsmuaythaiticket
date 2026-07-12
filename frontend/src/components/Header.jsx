import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Languages, Home, Info, Phone, Sparkles, Ticket, ChevronDown } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { getProvinceTicketPageUrl } from '../utils/bookingUrls';

const PROVINCES = {
  bangkok: { th: 'กรุงเทพ', en: 'Bangkok' },
  phuket: { th: 'ภูเก็ต', en: 'Phuket' }
};

const getProvinceFromLocation = (location) => {
  if (!location) return null;
  const loc = String(location).toLowerCase();
  if (loc.includes('bangkok') || loc.includes('กรุงเทพ')) return 'bangkok';
  if (loc.includes('phuket') || loc.includes('ภูเก็ต')) return 'phuket';
  return null;
};

const Header = ({ language, toggleLanguage, t, mobileMenuOpen, setMobileMenuOpen, hideLanguageToggle = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketsDropdownOpen, setTicketsDropdownOpen] = useState(false);
  const [mobileTicketsExpanded, setMobileTicketsExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const closeTimerRef = useRef(null);
  const { stadiums } = useDatabase(language);

  const stadiumsByProvince = useMemo(() => {
    const grouped = { bangkok: [], phuket: [] };
    (stadiums || []).forEach((stadium) => {
      const province = getProvinceFromLocation(stadium.location);
      if (province && grouped[province]) {
        grouped[province].push(stadium);
      }
    });
    return grouped;
  }, [stadiums]);

  const availableProvinces = useMemo(() => 
    Object.entries(PROVINCES).filter(([id]) => (stadiumsByProvince[id] || []).length > 0),
    [stadiumsByProvince]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setTicketsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleTicketsMouseEnter = () => {
    clearCloseTimer();
    setTicketsDropdownOpen(true);
  };

  const handleTicketsMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setTicketsDropdownOpen(false);
      closeTimerRef.current = null;
    }, 150);
  };

  const handleProvinceClick = (provinceId) => {
    setTicketsDropdownOpen(false);
    setMobileTicketsExpanded(false);
    setMobileMenuOpen(false);
    navigate(getProvinceTicketPageUrl(provinceId));
  };

  const navItems = [
    { name: t.nav.home, icon: Home, href: '#home' },
    { name: t.nav.highlight, icon: Sparkles, href: '#highlight' },
    { name: t.nav.about, icon: Info, href: '#about' },
    { name: t.nav.contact, icon: Phone, href: '#contact' }
  ];

  const handleNavClick = (href, e) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    } else if (href === '#home') {
      e.preventDefault();
      if (location.pathname === '/') {
        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        window.scrollTo(0, 0);
      } else {
        navigate('/');
      }
    } else if (href.startsWith('#')) {
      e.preventDefault();
      if (location.pathname === '/') {
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/' + href);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/98 backdrop-blur-lg border-b-2 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <a 
            href="#home" 
            onClick={(e) => {
              e.preventDefault();
              if (navigate) {
                navigate('/');
              } else {
                document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                window.scrollTo(0, 0);
              }
            }}
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/logo/logo.webp" 
              alt="DS Muay Thai Ticket - Official Muay Thai tickets Bangkok & Phuket"
              width={64}
              height={64}
              className="h-16 w-auto object-contain"
            />
            <span 
              className="text-[38px] font-bold leading-none text-[#facc15]"
              style={{ color: 'rgba(250, 204, 21, 1)' }}
            >
              DS
            </span>
            <div className="text-xs text-gray-400 uppercase tracking-widest leading-tight">
              <div>Muay Thai</div>
              <div>Tickets</div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navItems.slice(0, 2).map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className="text-red-600 hover:text-white px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              {/* Tickets dropdown */}
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleTicketsMouseEnter}
                onMouseLeave={handleTicketsMouseLeave}
              >
                <button
                  onClick={() => setTicketsDropdownOpen(!ticketsDropdownOpen)}
                  className="text-red-600 hover:text-white px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1"
                >
                  {t.nav.tickets}
                  <ChevronDown className={`w-4 h-4 transition-transform ${ticketsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {ticketsDropdownOpen && availableProvinces.length > 0 && (
                  <div className="absolute top-full left-0 pt-2 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[180px] z-50">
                    {availableProvinces.map(([provinceId, names]) => (
                      <button
                        key={provinceId}
                        onClick={() => handleProvinceClick(provinceId)}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 hover:text-white transition-colors flex items-center"
                      >
                        <Ticket className="w-4 h-4 mr-2 text-red-500" />
                        {names[language] || names.en}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {navItems.slice(2).map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className="text-red-600 hover:text-white px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              {/* Language Toggle Button - hidden on payment page (English only for tourists) */}
              {!hideLanguageToggle && (
                <button
                  onClick={toggleLanguage}
                  className="text-red-600 hover:text-white px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center"
                  title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
                >
                  <Languages className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'TH' : 'EN'}
                </button>
              )}
            </div>
          </nav>

          {/* Mobile menu button and language toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {!hideLanguageToggle && (
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center p-2 rounded-md text-red-600 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
              >
                <Languages className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">{language === 'th' ? 'TH' : 'EN'}</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-red-600 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.slice(0, 2).map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  handleNavClick(item.href, e);
                  setMobileMenuOpen(false);
                }}
                className="text-red-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center"
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </a>
            ))}
            {/* Tickets - expandable provinces */}
            <div>
              <button
                onClick={() => setMobileTicketsExpanded(!mobileTicketsExpanded)}
                className="text-red-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center w-full text-left justify-between"
              >
                <span className="flex items-center">
                  <Ticket className="w-4 h-4 mr-3" />
                  {t.nav.tickets}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileTicketsExpanded ? 'rotate-180' : ''}`} />
              </button>
              {mobileTicketsExpanded && availableProvinces.length > 0 && (
                <div className="pl-6 pb-2 space-y-1">
                  {availableProvinces.map(([provinceId, names]) => (
                    <button
                      key={provinceId}
                      onClick={() => handleProvinceClick(provinceId)}
                      className="text-gray-300 hover:text-white block py-2 text-sm font-medium flex items-center w-full text-left"
                    >
                      <Ticket className="w-3 h-3 mr-2 text-red-500" />
                      {names[language] || names.en}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {navItems.slice(2).map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  handleNavClick(item.href, e);
                  setMobileMenuOpen(false);
                }}
                className="text-red-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center"
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </a>
            ))}
            {/* Language Toggle in Mobile Menu - hidden on payment page */}
            {!hideLanguageToggle && (
              <button
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="text-red-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center w-full text-left"
              >
                <Languages className="w-4 h-4 mr-3" />
                {language === 'th' ? 'ภาษาไทย' : 'English'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

