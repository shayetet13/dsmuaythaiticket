import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingPageUrl } from '../utils/bookingUrls';

// Components
import Header from './Header';
import Footer from './Footer';
import StadiumFightHighlightsSection from './StadiumFightHighlightsSection';
import UpcomingFightsSection from './UpcomingFightsSection';
import UpcomingFightsSectionSkeleton from './skeletons/UpcomingFightsSectionSkeleton';
import StadiumDateSelector from './StadiumDateSelector';

// Constants & Utils
import { translations } from '../constants/translations';

// Hooks
import { useDatabase } from '../hooks/useDatabase';

const StadiumUpcomingPage = ({ stadiumIdFromPath }) => {
  const { stadiumId: stadiumIdFromParams } = useParams();
  const stadiumId = stadiumIdFromPath ?? stadiumIdFromParams;
  const navigate = useNavigate();

  const [language, setLanguage] = useState(() => sessionStorage.getItem('language') || 'en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState(stadiumId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState(new Date());

  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'en' ? 'th' : 'en';
    setLanguage(newLanguage);
    sessionStorage.setItem('language', newLanguage);
  }, [language]);

  const setBookingStep = useCallback((step) => {
    if (step === 'date' || step === 'payment') {
      navigate(getBookingPageUrl(stadiumId, { step }));
    }
  }, [navigate, stadiumId]);

  const { stadiums, stadiumImageSchedules, specialMatches, dailyImages, upcomingFightsBackground, stadiumHighlightImages, stadiumDescriptions, dbLoaded } = useDatabase(language);
  const t = translations[language];
  const ticketConfigs = {};

  const stadiumExists = stadiums.some(s => s && s.id === stadiumId);
  const stadiumData = stadiums.find(s => s && s.id === stadiumId);

  // Set document title for stadium page
  React.useEffect(() => {
    if (stadiumData?.name) {
      const name = typeof stadiumData.name === 'string' ? stadiumData.name : stadiumData.name.en || stadiumData.name.th;
      const baseName = name.replace(/\s+Stadium$/i, '').replace(/\s+Boxing\s+Stadium$/i, '');
      document.title = `${baseName} Stadium Ticket - DS MUAY THAI TICKET`;
    }
    return () => { document.title = 'DS MUAY THAI TICKET'; };
  }, [stadiumData]);

  if (!stadiumId || (dbLoaded && !stadiumExists)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{language === 'th' ? 'ไม่พบสนาม' : 'Stadium not found'}</h1>
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
        navigate={navigate}
      />

      <div className="pt-20">
        {!dbLoaded || stadiums.length === 0 ? (
          <UpcomingFightsSectionSkeleton />
        ) : (
          <>
            <StadiumFightHighlightsSection
              stadiumHighlightImages={stadiumHighlightImages}
              stadiumId={stadiumId}
              stadiumName={stadiumData?.name ? (typeof stadiumData.name === 'string' ? stadiumData.name : stadiumData.name[language] || stadiumData.name.en || stadiumData.name.th) : ''}
            />
            <UpcomingFightsSection
              weeklyFights={{}}
              language={language}
              stadiums={stadiums}
              t={t}
              ticketConfigs={ticketConfigs}
              stadiumImageSchedules={stadiumImageSchedules}
              specialMatches={specialMatches}
              dailyImages={dailyImages}
              upcomingFightsBackground={upcomingFightsBackground}
              setSelectedStadium={setSelectedStadium}
              setSelectedDate={setSelectedDate}
              setBookingStep={setBookingStep}
              setBookingCalendarMonth={setBookingCalendarMonth}
              singleStadiumId={stadiumId}
              eventLimit={8}
            />
            <StadiumDateSelector
              stadiumId={stadiumId}
              stadiums={stadiums}
              stadiumImageSchedules={stadiumImageSchedules}
              specialMatches={specialMatches}
              dailyImages={dailyImages}
              language={language}
              showBackButton={false}
              lightBackground={true}
            />
            {(() => {
              const desc = stadiumDescriptions?.[stadiumId];
              const hasText = desc?.h1 || desc?.h2 || desc?.h3 || (Array.isArray(desc?.paragraphs) && desc.paragraphs.some(p => p && String(p).trim()));
              const hasImages = Array.isArray(desc?.images) && desc.images.length > 0;
              if (!desc || (!hasText && !hasImages)) return null;
              const bgColor = desc.backgroundColor || '#111827';
              const fontColor = desc.fontColor || '#d1d5db';
              const fontSize = desc.fontSize || '16px';
              const fontFamily = desc.fontFamily || 'inherit';
              return (
                <section
                  className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="max-w-3xl mx-auto text-center" style={{ color: fontColor, fontSize, fontFamily }}>
                    {desc.h1 && (
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 tracking-tight" style={{ color: fontColor }}>
                        {desc.h1}
                      </h1>
                    )}
                    {desc.h2 && (
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 tracking-tight" style={{ color: fontColor }}>
                        {desc.h2}
                      </h2>
                    )}
                    {desc.h3 && (
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-6 sm:mb-8 tracking-tight" style={{ color: fontColor }}>
                        {desc.h3}
                      </h3>
                    )}
                    {(desc.paragraphs || []).map((p, i) => (
                      <p key={i} className="leading-relaxed mb-4 last:mb-0" style={{ color: fontColor }}>
                        {p}
                      </p>
                    ))}
                    {(desc.images || []).length > 0 && (
                      <div className="mt-8 flex flex-wrap justify-center gap-4">
                        {desc.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="max-w-full h-auto rounded-lg max-h-64 object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}
          </>
        )}
      </div>

      {dbLoaded && stadiums.length > 0 && (
        <Footer language={language} stadiums={stadiums} t={t} />
      )}
    </div>
  );
};

export default StadiumUpcomingPage;
