import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { getStadiumPageUrl, getProvinceTicketPageUrl } from '../utils/bookingUrls';
import { translations } from '../constants/translations';
import Header from './Header';

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

const getStadiumButtonName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/\s+Boxing\s+Stadium$/i, '')
    .replace(/\s+Stadium$/i, '')
    .trim();
};

const MuayThaiTicketPage = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = React.useState(() => sessionStorage.getItem('language') || 'en');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { stadiums, dbLoaded } = useDatabase(language);
  const t = translations[language];

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'th' : 'en';
    setLanguage(newLanguage);
    sessionStorage.setItem('language', newLanguage);
  };

  const stadiumsByProvince = React.useMemo(() => {
    const grouped = { bangkok: [], phuket: [] };
    (stadiums || []).forEach((stadium) => {
      const province = getProvinceFromLocation(stadium.location);
      if (province && grouped[province]) {
        grouped[province].push(stadium);
      }
    });
    return grouped;
  }, [stadiums]);

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

  const handleProvinceClick = (provinceId) => {
    navigate(getProvinceTicketPageUrl(provinceId));
  };

  const handleStadiumClick = (stadiumId) => {
    navigate(getStadiumPageUrl(stadiumId));
  };

  const availableProvinces = Object.entries(PROVINCES).filter(
    ([id]) => (stadiumsByProvince[id] || []).length > 0
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-center mb-4 uppercase tracking-tight text-gray-900">
            {language === 'th' ? 'ตั๋วมวยไทย' : 'Muay Thai Tickets'}
          </h1>
          <p className="text-center text-gray-600 mb-12">
            {language === 'th'
              ? 'เลือกจังหวัดเพื่อดูสนามมวยและจองตั๋ว'
              : 'Select a province to view stadiums and book tickets'}
          </p>

          {!dbLoaded ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
            </div>
          ) : (
            <>
              {/* Province buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-16">
                {availableProvinces.map(([provinceId, names]) => (
                  <button
                    key={provinceId}
                    onClick={() => handleProvinceClick(provinceId)}
                    className="px-8 py-4 text-lg font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-red-600/30"
                  >
                    {names[language] || names.en}
                  </button>
                ))}
              </div>

              {/* Stadiums by province */}
              {availableProvinces.map(([provinceId, names]) => {
                const stadiumsInProvince = stadiumsByProvince[provinceId] || [];
                if (stadiumsInProvince.length === 0) return null;

                return (
                  <section
                    key={provinceId}
                    id={`province-${provinceId}`}
                    className="mb-12 scroll-mt-24"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 text-red-600 uppercase tracking-wider">
                      {names[language] || names.en}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {stadiumsInProvince.map((stadium) => (
                        <button
                          key={stadium.id}
                          onClick={() => handleStadiumClick(stadium.id)}
                          className="px-5 py-3 text-sm sm:text-base font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-200"
                        >
                          {getStadiumDisplayName(stadium)}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MuayThaiTicketPage;
