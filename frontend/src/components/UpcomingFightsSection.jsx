import React from 'react';

const UpcomingFightsSection = ({ 
  weeklyFights, 
  language, 
  stadiums, 
  t, 
  ticketConfigs = {}, 
  stadiumImageSchedules = {}, 
  specialMatches = [],
  setSelectedStadium,
  setSelectedDate,
  setBookingStep,
  setBookingCalendarMonth
}) => {
  // Get events for each stadium
  // Default images for each stadium
  const defaultImages = {
    rajadamnern: [
      '/images/highlights/RWS (125 of 220).jpg',
      '/images/highlights/RWS (131 of 220).jpg',
      '/images/highlights/_DSC5122.jpg',
      '/images/highlights/World class fighters.jpg'
    ],
    lumpinee: [
      '/images/highlights/OTA_COVER.jpg',
      '/images/highlights/DSC_9319.jpg',
      '/images/highlights/MEMO0026.jpg',
      '/images/highlights/BOAT2132 3.jpg'
    ],
    bangla: [
      '/images/highlights/aow4.jpg',
      '/images/highlights/_RMS0100.jpg',
      '/images/highlights/_NPX0152-2.jpg',
      '/images/highlights/20230930-NPX_3584.jpg'
    ],
    patong: [
      '/images/highlights/P7012865 (1).jpg',
      '/images/highlights/S__89981064.jpg',
      '/images/highlights/NPX_5549.JPG',
      '/images/highlights/World class fighters.jpg'
    ]
  };

  // Get event name based on stadium and day of week
  const getEventName = (stadiumId, dayOfWeek) => {
    if (stadiumId === 'rajadamnern') {
      const rajadamnernNames = {
        1: 'Rajadamnern Knockout', // Monday
        2: 'Rajadamnern Knockout', // Tuesday
        3: 'New Power Muay Thai', // Wednesday
        4: 'Petchyindee Muay Thai', // Thursday
        5: 'Rajadamnern Knockout', // Friday
        6: 'RWS - Muay Thai', // Saturday
        0: 'Kiatpetch Muay Thai' // Sunday
      };
      return rajadamnernNames[dayOfWeek] || 'Rajadamnern Event';
    } else if (stadiumId === 'lumpinee') {
      return 'ONE LUMPINEE';
    } else if (stadiumId === 'bangla') {
      return 'MUAY THAI BANGLA PHUKET';
    } else if (stadiumId === 'patong') {
      return 'MUAY THAI PATONG PHUKET';
    }
    return `${stadiumId.charAt(0).toUpperCase() + stadiumId.slice(1)} Event`;
  };

  // Get next occurrence of a specific day of week
  const getNextDateForDay = (targetDay, startDate = new Date()) => {
    const currentDay = startDate.getDay();
    let daysUntilTarget = targetDay - currentDay;
    
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + daysUntilTarget);
    return nextDate;
  };

  // Get image for an event based on date, stadium, and day of week
  const getEventImage = (stadiumId, dateStr, dayOfWeek, index = 0) => {
    // First, check for special matches (exact date match)
    if (specialMatches && specialMatches.length > 0 && dateStr) {
      const specialMatch = specialMatches.find(match => 
        match.stadiumId === stadiumId && match.date === dateStr
      );
      if (specialMatch && specialMatch.image) {
        return specialMatch.image;
      }
    }

    // Second, check for scheduled images (day of week match)
    const schedules = stadiumImageSchedules[stadiumId] || [];
    if (schedules.length > 0) {
      const matchingSchedules = schedules.filter(schedule => 
        schedule.days && schedule.days.includes(dayOfWeek)
      );
      if (matchingSchedules.length > 0) {
        // Use the first matching schedule, or rotate based on index
        const scheduleIndex = index % matchingSchedules.length;
        return matchingSchedules[scheduleIndex].image;
      }
    }

    // Fallback to default images
    const defaultStadiumImages = defaultImages[stadiumId] || [`/images/stadiums/${stadiumId}.jpg`];
    return defaultStadiumImages[index % defaultStadiumImages.length];
  };

  const getStadiumEvents = (stadiumId) => {
    const events = [];
    
    // Always create events based on schedule days (don't use ticketConfigs for event display)
    // This ensures images are unique per date and prices are not shown
    // Get current date in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60; // UTC+7 in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const today = new Date(utc + (thailandOffset * 60000));
    
    // Get schedule days for stadium
    const stadium = stadiums?.find(s => s && s.id === stadiumId);
    const scheduleDays = stadium?.scheduleDays || [1, 2, 3, 4, 5, 6, 0]; // Default: all days
    
    // Get next 4 occurrences starting from today
    const upcomingDates = [];
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    for (let i = 0; i <= 28; i++) { // Start from today, check next 4 weeks
      // Create date using local date components to avoid timezone issues
      const checkDate = new Date(todayYear, todayMonth, todayDay + i, 12, 0, 0);
      const dayOfWeek = checkDate.getDay();
      
      if (scheduleDays.includes(dayOfWeek) && upcomingDates.length < 4) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const eventName = getEventName(stadiumId, dayOfWeek);
        
        events.push({
          id: `${stadiumId}-${dateStr}`,
          name: eventName,
          date: dateStr,
          image: getEventImage(stadiumId, dateStr, dayOfWeek, upcomingDates.length),
          price: null,
          priceRange: null,
          stadiumId: stadiumId
        });
        
        upcomingDates.push({ date: checkDate, dayOfWeek: dayOfWeek });
      }
    }
    
    // Sort by date
    return events.sort((a, b) => {
      try {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      } catch (e) {
        return 0;
      }
    }).slice(0, 4);
  };

  const rajadamnernEvents = getStadiumEvents('rajadamnern');
  const lumpineeEvents = getStadiumEvents('lumpinee');
  const banglaEvents = getStadiumEvents('bangla');
  const patongEvents = getStadiumEvents('patong');

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Parse date string (YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid timezone issues
      
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

  const formatPrice = (price, priceRange) => {
    if (priceRange) {
      return priceRange;
    }
    if (price) {
      try {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numPrice)) return '';
        return `฿${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } catch (e) {
        return '';
      }
    }
    return '';
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
    // Format: "4 JANUARY 2026 - RAJADAMNERN KNOCKOUT"
    const fullEventName = `${formatDate(event.date)} - ${eventName.toUpperCase()}${event.time ? ` (${event.time})` : ''}`;
    
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
        {/* Image */}
        <div className="relative h-80 sm:h-96 md:h-[400px] lg:h-[450px] overflow-hidden bg-gray-800">
          <img
            src={event.image || `/images/stadiums/${event.stadiumId || 'default'}.jpg`}
            alt={eventName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `/images/stadiums/${event.stadiumId || 'default'}.jpg`;
              e.target.onerror = () => {
                e.target.style.display = 'none';
              };
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-5 bg-gray-900">
          <div className="text-gray-400 text-xs sm:text-sm mb-2 uppercase tracking-wide">
            {stadiumName}
          </div>
          <div className="text-white text-sm sm:text-base mb-3 line-clamp-2 min-h-[2.5rem]">
            {fullEventName}
          </div>
          {(event.price || event.priceRange) && (
            <div className="text-yellow-400 text-sm sm:text-base font-semibold mb-4">
              {formatPrice(event.price, event.priceRange)}
            </div>
          )}
          <button
            onClick={() => {
              if (setSelectedStadium && setSelectedDate && setBookingStep && setBookingCalendarMonth) {
                // Set selected stadium
                setSelectedStadium(event.stadiumId);
                
                // Set selected date
                setSelectedDate(event.date);
                
                // Set calendar month to the event date
                if (event.date) {
                  const [year, month, day] = event.date.split('-').map(Number);
                  const eventDate = new Date(year, month - 1, day);
                  setBookingCalendarMonth(eventDate);
                }
                
                // Go directly to payment step (Select Ticket & Payment)
                setBookingStep('payment');
                
                // Scroll to booking section
                setTimeout(() => {
                  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                // Fallback if functions not provided
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base uppercase tracking-wide"
          >
            {language === 'th' ? 'ซื้อตั๋ว' : 'GET TICKETS'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="tickets" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/upcoming-fights-bg.jpg"
          alt="Upcoming Fights Background"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-yellow-500 mb-2 sm:mb-4 uppercase tracking-tight">
            {t?.upcomingFights?.title || (language === 'th' ? 'การแข่งขันที่กำลังจะมาถึง' : 'Upcoming Fights')}
          </h2>
          <p className="text-gray-400 uppercase tracking-wider text-xs sm:text-sm">
            {language === 'th' ? 'ตั๋วการแข่งขันมวยไทย' : 'Muay Thai Fight Tickets'}
          </p>
        </div>

        {/* Bangkok Stadiums - Row 1 */}
        <div className="mb-12 sm:mb-16">
          {/* Rajadamnern Tickets Section */}
          <div className="mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 mb-6 sm:mb-8 uppercase tracking-tight">
              {language === 'th' ? 'ตั๋วราชดำเนิน' : 'RAJADAMNERN TICKETS'}
            </h3>
            {rajadamnernEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {rajadamnernEvents.map((event, index) => (
                  <EventCard key={event.id || `rajadamnern-${index}`} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>{language === 'th' ? 'ไม่มีกิจกรรมในขณะนี้' : 'No events available'}</p>
              </div>
            )}
          </div>

          {/* Lumpinee Tickets Section */}
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 mb-6 sm:mb-8 uppercase tracking-tight">
              {language === 'th' ? 'ตั๋วลุมพินี' : 'LUMPINEE TICKETS'}
            </h3>
            {lumpineeEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {lumpineeEvents.map((event, index) => (
                  <EventCard key={event.id || `lumpinee-${index}`} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>{language === 'th' ? 'ไม่มีกิจกรรมในขณะนี้' : 'No events available'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Phuket Stadiums - Row 2 */}
        <div>
          {/* Bangla Tickets Section */}
          <div className="mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 mb-6 sm:mb-8 uppercase tracking-tight">
              {language === 'th' ? 'ตั๋วบังลา' : 'BANGLA TICKETS'}
            </h3>
            {banglaEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {banglaEvents.map((event, index) => (
                  <EventCard key={event.id || `bangla-${index}`} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>{language === 'th' ? 'ไม่มีกิจกรรมในขณะนี้' : 'No events available'}</p>
              </div>
            )}
          </div>

          {/* Patong Tickets Section */}
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 mb-6 sm:mb-8 uppercase tracking-tight">
              {language === 'th' ? 'ตั๋วป่าตอง' : 'PATONG TICKETS'}
            </h3>
            {patongEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {patongEvents.map((event, index) => (
                  <EventCard key={event.id || `patong-${index}`} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>{language === 'th' ? 'ไม่มีกิจกรรมในขณะนี้' : 'No events available'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingFightsSection;
