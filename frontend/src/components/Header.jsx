import React from 'react';
import { Menu, X, Languages, Home, Info, Phone, Sparkles, Ticket } from 'lucide-react';

const Header = ({ language, toggleLanguage, t, mobileMenuOpen, setMobileMenuOpen }) => {
  const navItems = [
    { name: t.nav.home, icon: Home, href: '#home' },
    { name: t.nav.highlight, icon: Sparkles, href: '#highlight' },
    { name: t.nav.tickets, icon: Ticket, href: '#booking' },
    { name: t.nav.about, icon: Info, href: '#about' },
    { name: t.nav.contact, icon: Phone, href: '#contact' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/98 backdrop-blur-lg border-b-2 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <a 
            href="#home" 
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
              window.scrollTo(0, 0);
            }}
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="text-5xl font-black bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-wider">
              FT
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest leading-tight">
              <div>Muay Thai</div>
              <div>Tickets</div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-yellow-400 px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="text-white hover:text-yellow-400 px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center"
                title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
              >
                <Languages className="w-4 h-4 mr-2" />
                {language === 'th' ? 'TH' : 'EN'}
              </button>
            </div>
          </nav>

          {/* Mobile menu button and language toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-yellow-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              <Languages className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">{language === 'th' ? 'TH' : 'EN'}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-yellow-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
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
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </a>
            ))}
            {/* Language Toggle in Mobile Menu */}
            <button
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="text-gray-300 hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium flex items-center w-full text-left"
            >
              <Languages className="w-4 h-4 mr-3" />
              {language === 'th' ? 'ภาษาไทย' : 'English'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

