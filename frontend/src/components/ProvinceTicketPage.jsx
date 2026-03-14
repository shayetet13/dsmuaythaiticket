import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import Header from './Header';
import Footer from './Footer';
import UpcomingFightsSection from './UpcomingFightsSection';
import UpcomingFightsSectionSkeleton from './skeletons/UpcomingFightsSectionSkeleton';

// Constants & Utils
import { translations } from '../constants/translations';
import { getStadiumPageUrl } from '../utils/bookingUrls';

// Hooks
import { useDatabase } from '../hooks/useDatabase';

const getStadiumButtonName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/\s+Boxing\s+Stadium$/i, '')
    .replace(/\s+Stadium$/i, '')
    .trim();
};

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

const ProvinceTicketPage = ({ province: provinceProp }) => {
  const { province: provinceParam } = useParams();
  const province = provinceProp || provinceParam;
  const navigate = useNavigate();

  const [language, setLanguage] = useState(() => sessionStorage.getItem('language') || 'en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'en' ? 'th' : 'en';
    setLanguage(newLanguage);
    sessionStorage.setItem('language', newLanguage);
  }, [language]);

  const setBookingStep = useCallback((step) => {
    if (step === 'date' || step === 'payment') {
      navigate(`/muaythai-ticket-${province}?step=${step}`);
    }
  }, [navigate, province]);

  const { stadiums, stadiumImageSchedules, specialMatches, dailyImages, upcomingFightsBackground, dbLoaded } = useDatabase(language);
  const t = translations[language];
  const ticketConfigs = {};

  const provinceData = PROVINCES[province];
  const stadiumsInProvince = useMemo(() => {
    if (!stadiums || !province) return [];
    return stadiums.filter((s) => getProvinceFromLocation(s.location) === province);
  }, [stadiums, province]);

  const isValidProvince = province && PROVINCES[province] && stadiumsInProvince.length > 0;

  // Set document title
  React.useEffect(() => {
    if (provinceData && isValidProvince) {
      const name = provinceData[language] || provinceData.en;
      document.title = `${name} Muay Thai Tickets - DS MUAY THAI TICKET`;
    }
    return () => { document.title = 'DS MUAY THAI TICKET'; };
  }, [provinceData, language, isValidProvince]);

  if (dbLoaded && (!province || !PROVINCES[province])) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{language === 'th' ? 'ไม่พบจังหวัด' : 'Province not found'}</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg"
          >
            {language === 'th' ? 'กลับไปหน้าแรก' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="pt-20">
        {!dbLoaded || stadiums.length === 0 ? (
          <UpcomingFightsSectionSkeleton />
        ) : stadiumsInProvince.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-bold mb-2">
              {language === 'th' ? 'ไม่มีสนามในจังหวัดนี้' : 'No stadiums in this province'}
            </h1>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg mt-4"
            >
              {language === 'th' ? 'กลับไปหน้าแรก' : 'Back to Home'}
            </button>
          </div>
        ) : (
          <>
            <div className="py-8 px-4 text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-tight">
                {provinceData ? (provinceData[language] || provinceData.en) : province}
              </h1>
              <p className="text-gray-400">
                {language === 'th'
                  ? 'เลือกสนามมวยเพื่อดูการแข่งขันและจองตั๋ว'
                  : 'Select a stadium to view fights and book tickets'}
              </p>
            </div>

            {/* Stadium cards - 3 per row */}
            <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {stadiumsInProvince.map((stadium) => {
                    const displayName = (() => {
                      const translated = t?.stadiums?.[stadium.id] || t?.stadiums?.[String(stadium.id || '').toLowerCase().replace(/[\s\-_]/g, '')];
                      if (translated) return translated;
                      const raw = typeof stadium.name === 'string' ? stadium.name : (stadium.name?.en || stadium.name?.th || stadium.id);
                      return getStadiumButtonName(raw);
                    })();
                    const imageSrc = stadium.image || `/images/stadiums/${stadium.id}.webp`;
                    return (
                      <button
                        key={stadium.id}
                        onClick={() => navigate(getStadiumPageUrl(stadium.id))}
                        className="group block w-full text-left rounded-xl overflow-hidden bg-gray-800 border border-gray-700 hover:border-red-500 transition-all duration-300 hover:shadow-xl hover:shadow-red-900/20"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={imageSrc}
                            alt={`${displayName} - Muay Thai Stadium`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = `/images/stadiums/${stadium.id}.webp`;
                              e.target.onerror = () => { e.target.src = '/images/hero/World class fighters.webp'; };
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                            <h3 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                              {displayName}
                            </h3>
                            <p className="text-sm text-gray-300 mt-0.5">
                              {language === 'th' ? 'ดูการแข่งขันและจองตั๋ว' : 'View fights & book tickets'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <UpcomingFightsSection
              weeklyFights={{}}
              language={language}
              stadiums={stadiumsInProvince}
              t={t}
              ticketConfigs={ticketConfigs}
              stadiumImageSchedules={stadiumImageSchedules}
              specialMatches={specialMatches}
              dailyImages={dailyImages}
              upcomingFightsBackground={upcomingFightsBackground}
              setSelectedStadium={() => {}}
              setSelectedDate={() => {}}
              setBookingStep={setBookingStep}
              setBookingCalendarMonth={() => {}}
              eventLimit={8}
            />
          </>
        )}
      </div>

      {dbLoaded && stadiums.length > 0 && (
        <Footer language={language} stadiums={stadiums} t={t} />
      )}
    </div>
  );
};

export default ProvinceTicketPage;
