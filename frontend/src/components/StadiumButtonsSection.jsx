import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getStadiumPageUrl } from '../utils/bookingUrls';

// Get stadium name for button (without "Stadium" or "Boxing Stadium")
const getStadiumButtonName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/\s+Boxing\s+Stadium$/i, '')
    .replace(/\s+Stadium$/i, '')
    .trim();
};

const StadiumButtonsSection = ({ stadiums = [], lightBackground = false, language = 'en', t }) => {
  const navigate = useNavigate();
  const headingText = t?.stadiums?.selectTicketStadium ?? 'Select Ticket Stadium';

  const handleStadiumClick = (stadiumId) => {
    navigate(getStadiumPageUrl(stadiumId));
  };

  const getStadiumDisplayName = (stadium) => {
    if (!stadium) return '';
    const id = stadium.id;
    let translated = t?.stadiums?.[id];
    if (!translated) {
      const normalizedId = String(id || '').toLowerCase().replace(/[\s\-_]/g, '');
      translated = t?.stadiums?.[normalizedId];
    }
    if (translated) return translated;
    const name = stadium.name;
    if (!name) return id || '';
    const raw = typeof name === 'string' ? name : (name[language] || name.en || name.th || '');
    if (/world\s*siam/i.test(raw)) return language === 'th' ? 'เวิร์ลสยาม' : 'World Siam';
    return getStadiumButtonName(raw);
  };

  if (!stadiums || stadiums.length === 0) return null;

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black text-center mb-10 sm:mb-12 uppercase tracking-tight ${lightBackground ? 'text-gray-900' : 'text-white'}`}>
          {headingText}
        </h1>
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
          {stadiums.map((stadium) => (
            <button
              key={stadium.id}
              onClick={() => handleStadiumClick(stadium.id)}
              className="px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-200"
            >
              {getStadiumDisplayName(stadium)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StadiumButtonsSection;
