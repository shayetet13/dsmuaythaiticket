/**
 * Refactored UpcomingFightsSection
 * Uses backend API for business logic instead of frontend computation
 */

import React from 'react';
import { useAllUpcomingEvents } from '../hooks/useUpcomingEvents';

const UpcomingFightsSection = ({ 
  language, 
  stadiums, 
  t, 
  setSelectedStadium,
  setSelectedDate,
  setBookingStep,
  setBookingCalendarMonth
}) => {
  // Fetch upcoming events from backend API
  const { events, loading, error } = useAllUpcomingEvents();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      if (isNaN(date.getTime())) return '';
      
      const dayNum = date.getDate();
      const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                         'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      const monthName = monthNames[date.getMonth()];
      const yearNum = date.getFullYear();
      
      return `${dayNum} ${monthName} ${yearNum}`;
    } catch (e) {
      return '';
    }
  };

  const getStadiumName = (stadiumId) => {
    if (!stadiums || !Array.isArray(stadiums)) return stadiumId;
    const stadium = stadiums.find(s => s && s.id === stadiumId);
    return stadium ? stadium.name : stadiumId;
  };

  const EventCard = ({ event }) => {
    if (!event) return null;
    
    const stadiumName = getStadiumName(event.stadiumId || '');
    const eventName = event.name || `${stadiumName} Event`;
    const fullEventName = `${formatDate(event.date)} - ${eventName.toUpperCase()}`;
    const isSoldOut = event.isSoldOut || false;
    
    return (
      <div className={`bg-white rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-md ${
        isSoldOut 
          ? 'border-gray-300 opacity-75' 
          : 'border-gray-300 hover:border-red-600 hover:shadow-xl'
      }`}>
        {/* Image */}
        <div className={`relative h-80 sm:h-96 md:h-[400px] lg:h-[450px] overflow-hidden bg-gray-200 ${
          isSoldOut ? 'grayscale' : ''
        }`}>
          <img
            src={event.image || `/images/stadiums/${event.stadiumId || 'default'}.jpg`}
            alt={eventName}
            className="w-full h-full object-contain sm:object-cover"
            onError={(e) => {
              e.target.src = `/images/stadiums/${event.stadiumId || 'default'}.jpg`;
              e.target.onerror = () => {
                e.target.style.display = 'none';
              };
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-red-600 text-white font-black text-lg sm:text-xl md:text-2xl px-6 py-3 rounded-lg uppercase tracking-wider">
                {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t-2 border-gray-200">
          <div className={`text-xs sm:text-sm mb-2 uppercase tracking-wide font-semibold ${
            isSoldOut ? 'text-gray-400' : 'text-red-600'
          }`}>
            {stadiumName}
          </div>
          <div className={`text-sm sm:text-base mb-3 line-clamp-2 min-h-[2.5rem] font-medium ${
            isSoldOut ? 'text-gray-500' : 'text-gray-900'
          }`}>
            {fullEventName}
          </div>
          {/* Fixed height container for price */}
          <div className="h-[28px] mb-4 flex items-center">
          </div>
          <button
            onClick={() => {
              if (!isSoldOut && setSelectedStadium && setSelectedDate && setBookingStep && setBookingCalendarMonth) {
                setSelectedStadium(event.stadiumId);
                setSelectedDate(event.date);
                
                if (event.date) {
                  const [year, month, day] = event.date.split('-').map(Number);
                  const eventDate = new Date(year, month - 1, day);
                  setBookingCalendarMonth(eventDate);
                }
                
                setBookingStep('payment');
                
                setTimeout(() => {
                  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else if (!isSoldOut) {
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            disabled={isSoldOut}
            className={`w-full h-[44px] font-bold px-4 rounded-lg transition-all duration-200 text-sm sm:text-base uppercase tracking-wide flex items-center justify-center ${
              isSoldOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isSoldOut 
              ? (language === 'th' ? 'หมดแล้ว' : 'SOLD OUT')
              : (language === 'th' ? 'ซื้อตั๋ว' : 'GET TICKETS')
            }
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <section id="tickets" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-2 sm:mb-4 uppercase tracking-tight">
              {t?.upcomingFights?.title || (language === 'th' ? 'การแข่งขันที่กำลังจะมาถึง' : 'Upcoming Fights')}
            </h2>
            <p className="text-red-600 uppercase tracking-wider text-xs sm:text-sm font-semibold">
              {language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section id="tickets" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-2 sm:mb-4 uppercase tracking-tight">
              {t?.upcomingFights?.title || (language === 'th' ? 'การแข่งขันที่กำลังจะมาถึง' : 'Upcoming Fights')}
            </h2>
            <p className="text-red-600 uppercase tracking-wider text-xs sm:text-sm font-semibold">
              {language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error loading events'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Group stadiums by location for display
  const getStadiumsByLocation = () => {
    if (!stadiums || stadiums.length === 0) return { bangkok: [], phuket: [] };
    
    const bangkok = [];
    const phuket = [];
    
    stadiums.forEach(stadium => {
      if (!stadium || !stadium.id) return;
      
      const location = typeof stadium.location === 'string' 
        ? stadium.location.toLowerCase() 
        : (stadium.location?.en || stadium.location?.th || '').toLowerCase();
      
      if (location.includes('bangkok') || location.includes('กรุงเทพ')) {
        bangkok.push(stadium);
      } else if (location.includes('phuket') || location.includes('ภูเก็ต')) {
        phuket.push(stadium);
      } else {
        // Default to bangkok if location is unclear
        bangkok.push(stadium);
      }
    });
    
    return { bangkok, phuket };
  };

  const { bangkok: bangkokStadiums, phuket: phuketStadiums } = getStadiumsByLocation();

  return (
    <section id="tickets" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-2 sm:mb-4 uppercase tracking-tight">
            {t?.upcomingFights?.title || (language === 'th' ? 'การแข่งขันที่กำลังจะมาถึง' : 'Upcoming Fights')}
          </h2>
          <p className="text-red-600 uppercase tracking-wider text-xs sm:text-sm font-semibold">
            {language === 'th' ? 'ตั๋วการแข่งขันมวยไทย' : 'Muay Thai Fight Tickets'}
          </p>
        </div>

        {/* Bangkok Stadiums */}
        {bangkokStadiums.length > 0 && (
          <div className="mb-12 sm:mb-16">
            {bangkokStadiums.map((stadium) => {
              const stadiumEvents = events?.[stadium.id] || [];
              return (
                <div key={stadium.id} className={bangkokStadiums.indexOf(stadium) < bangkokStadiums.length - 1 ? 'mb-12 sm:mb-16' : ''}>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 mb-6 sm:mb-8 uppercase tracking-tight">
                    {language === 'th' ? `ตั๋ว${stadium.name}` : `${stadium.name.toUpperCase()} TICKETS`}
                  </h3>
                  {stadiumEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {stadiumEvents.map((event, index) => (
                        <EventCard key={event.id || `${stadium.id}-${index}`} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 py-8">
                      <p>{language === 'th' ? 'ไม่มีกิจกรรมในขณะนี้' : 'No events available'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Phuket Stadiums */}
        {phuketStadiums.length > 0 && (
          <div>
            {phuketStadiums.map((stadium) => {
              const stadiumEvents = events?.[stadium.id] || [];
              return (
                <div key={stadium.id} className={phuketStadiums.indexOf(stadium) < phuketStadiums.length - 1 ? 'mb-12 sm:mb-16' : ''}>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 mb-6 sm:mb-8 uppercase tracking-tight">
                    {language === 'th' ? `ตั๋ว${stadium.name}` : `${stadium.name.toUpperCase()} TICKETS`}
                  </h3>
                  {stadiumEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {stadiumEvents.map((event, index) => (
                        <EventCard key={event.id || `${stadium.id}-${index}`} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 py-8">
                      <p>{language === 'th' ? 'ไม่มีกิจกรรมในขณะนี้' : 'No events available'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingFightsSection;

