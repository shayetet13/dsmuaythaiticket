import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingPageUrl } from '../utils/bookingUrls';

// Components
import Header from './Header';
import Footer from './Footer';
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

  const { stadiums, stadiumImageSchedules, specialMatches, dailyImages, upcomingFightsBackground, dbLoaded } = useDatabase(language);
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
