import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import { ChevronRight } from 'lucide-react';

const UpcomingFightsSection = ({ 
  weeklyFights, 
  language, 
  stadiums, 
  t, 
  ticketConfigs = {}, 
  stadiumImageSchedules = {}, 
  specialMatches = [],
  upcomingFightsBackground = null,
  setSelectedStadium,
  setSelectedDate,
  setBookingStep,
  setBookingCalendarMonth
}) => {
  // Use default background only if not loaded yet
  const backgroundImage = upcomingFightsBackground?.image || null;
  const backgroundFallback = upcomingFightsBackground?.fallback || '/images/highlights/World class fighters.jpg';
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
  const getEventName = (stadiumId, dayOfWeek, dateStr = null) => {
    // First, check for special matches (exact date match)
    if (specialMatches && specialMatches.length > 0 && dateStr) {
      const specialMatch = specialMatches.find(match => 
        match.stadiumId === stadiumId && match.date === dateStr
      );
      if (specialMatch && specialMatch.name) {
        return specialMatch.name;
      }
    }

    // Second, check for scheduled images with names (day of week match)
    const schedules = stadiumImageSchedules[stadiumId] || [];
    if (schedules.length > 0) {
      const matchingSchedules = schedules.filter(schedule => 
        schedule.days && schedule.days.includes(dayOfWeek) && schedule.name
      );
      if (matchingSchedules.length > 0) {
        // Use the first matching schedule with a name
        return matchingSchedules[0].name;
      }
    }

    // Fallback to default names
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

  // ✅ State for caching ticket availability (fetched from backend API)
  const [availabilityCache, setAvailabilityCache] = useState({});

  // ✅ Fetch ticket availability from backend API (with cache)
  const checkAvailability = async (stadiumId, dateString, forceRefresh = false) => {
    const cacheKey = `${stadiumId}-${dateString}`;
    
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && availabilityCache[cacheKey] !== undefined) {
      return availabilityCache[cacheKey];
    }

    try {
      const response = await axios.get(`${API_URL}/tickets/check-availability`, {
        params: { stadiumId, date: dateString },
        // Add cache busting for force refresh
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      });

      const isAvailable = response.data.success && response.data.isAvailable;
      
      // Update cache immediately
      setAvailabilityCache(prev => {
        const newCache = { ...prev, [cacheKey]: isAvailable };
        return newCache;
      });

      return isAvailable;
    } catch (error) {
      console.error('Error checking availability:', error);
      // Return true on error to avoid showing false negatives
      return true;
    }
  };

  // ✅ Check if date has available tickets (using cache)
  const hasAvailableTickets = (dateString, stadiumId) => {
    const cacheKey = `${stadiumId}-${dateString}`;
    // Return cached value or true (optimistic) if not yet fetched
    return availabilityCache[cacheKey] !== undefined ? availabilityCache[cacheKey] : true;
  };

  // ✅ Pre-fetch availability for all upcoming events
  useEffect(() => {
    const fetchAllAvailability = async () => {
      if (!stadiums || stadiums.length === 0) return;
      
      const promises = [];

      stadiums.forEach(stadium => {
        const stadiumId = stadium.id;
        if (!stadium || !stadium.scheduleDays) return;

        // Get next 4 weeks of dates for this stadium
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();

        for (let i = 0; i <= 28; i++) {
          const checkDate = new Date(todayYear, todayMonth, todayDay + i, 12, 0, 0);
          const dayOfWeek = checkDate.getDay();

          if (stadium.scheduleDays.includes(dayOfWeek)) {
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            promises.push(checkAvailability(stadiumId, dateStr));
          }
        }
      });

      // Also fetch availability for special match dates - Force refresh these
      if (specialMatches && specialMatches.length > 0) {
        specialMatches.forEach(match => {
          if (match.date && match.stadiumId) {
            // Force refresh for special matches to ensure latest data
            promises.push(checkAvailability(match.stadiumId, match.date, true));
          }
        });
      }

      await Promise.all(promises);
    };

    if (stadiums && stadiums.length > 0) {
      fetchAllAvailability();
    }
  }, [stadiums, specialMatches]);

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
        
        const eventName = getEventName(stadiumId, dayOfWeek, dateStr);
        const isSoldOut = !hasAvailableTickets(dateStr, stadiumId);
        
        // Check if this is a special match
        const isSpecialMatch = specialMatches && specialMatches.length > 0 && 
          specialMatches.some(match => match.stadiumId === stadiumId && match.date === dateStr);
        
        events.push({
          id: `${stadiumId}-${dateStr}`,
          name: eventName,
          date: dateStr,
          image: getEventImage(stadiumId, dateStr, dayOfWeek, upcomingDates.length),
          price: null,
          priceRange: null,
          stadiumId: stadiumId,
          isSoldOut: isSoldOut,
          isSpecialMatch: isSpecialMatch
        });
        
        upcomingDates.push({ date: checkDate, dayOfWeek: dayOfWeek });
      }
    }
    
    // Sort by date
    const sortedEvents = events.sort((a, b) => {
      try {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      } catch (e) {
        return 0;
      }
    }).slice(0, 4);
    
    // Check for special matches that should be shown as 5th card
    // (special matches that are more than 3 days away from today)
    if (specialMatches && specialMatches.length > 0) {
      const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      
      specialMatches.forEach(match => {
        if (match.stadiumId === stadiumId && match.date) {
          try {
            const matchDate = new Date(match.date + 'T12:00:00');
            const todayDate = new Date(todayDateStr + 'T12:00:00');
            const daysDiff = Math.floor((matchDate - todayDate) / (1000 * 60 * 60 * 24));
            
            // Check if this special match is already in the 4 regular cards
            const isAlreadyInRegularCards = sortedEvents.some(event => event.date === match.date);
            
            // If special match is more than 3 days away and not already in regular cards, add as 5th card
            if (daysDiff > 3 && !isAlreadyInRegularCards) {
              // Check availability - use cache if available, otherwise default to available
              const cacheKey = `${stadiumId}-${match.date}`;
              const isSoldOut = availabilityCache[cacheKey] !== undefined ? !availabilityCache[cacheKey] : false;
              
              sortedEvents.push({
                id: `special-${stadiumId}-${match.date}`,
                name: match.name || getEventName(stadiumId, matchDate.getDay(), match.date),
                date: match.date,
                image: match.image || getEventImage(stadiumId, match.date, matchDate.getDay(), 0),
                price: null,
                priceRange: null,
                stadiumId: stadiumId,
                isSoldOut: isSoldOut,
                isSpecialMatch: true
              });
            }
          } catch (e) {
            console.error('Error processing special match:', e);
          }
        }
      });
    }
    
    return sortedEvents;
  };

  // Get events for all stadiums dynamically
  const getAllStadiumEvents = () => {
    if (!stadiums || stadiums.length === 0) return {};
    
    const eventsByStadium = {};
    stadiums.forEach(stadium => {
      if (stadium && stadium.id) {
        eventsByStadium[stadium.id] = getStadiumEvents(stadium.id);
      }
    });
    
    return eventsByStadium;
  };

  // Re-compute events when availabilityCache changes
  const eventsByStadium = React.useMemo(() => {
    return getAllStadiumEvents();
  }, [stadiums, specialMatches, stadiumImageSchedules, availabilityCache]);
  
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
    const isSoldOut = event.isSoldOut || false;
    const isSpecialMatch = event.isSpecialMatch || false;
    
    return (
      <div className={`rounded-lg transition-all duration-300 relative ${
        isSpecialMatch ? 'p-[3px] golden-card-glow' : ''
      }`}>
        {/* Special Match Label */}
        {isSpecialMatch && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-white px-3 py-1 rounded-full text-red-600 text-xs font-bold uppercase tracking-wider shadow-md border border-red-600/30">
              SPECIAL MATCH
            </span>
          </div>
        )}
        <div className={`bg-white rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-md relative h-full ${
          isSoldOut 
            ? 'border-gray-300 opacity-75' 
            : isSpecialMatch
            ? 'border-yellow-400 hover:border-yellow-500 shadow-lg shadow-yellow-500/70 animate-golden-glow'
            : 'border-gray-300 hover:border-red-600 hover:shadow-xl'
        } ${isSpecialMatch ? 'ring-4 ring-yellow-400 ring-opacity-60' : ''}`}
        style={isSpecialMatch ? {
          borderWidth: '3px',
          borderColor: '#facc15',
        } : {}}
        >
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
          {isSpecialMatch && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-yellow-500/20 pointer-events-none"></div>
          )}
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
            {(event.price || event.priceRange) && !isSoldOut && (
              <div className="text-red-600 text-sm sm:text-base font-bold">
                {formatPrice(event.price, event.priceRange)}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!isSoldOut && setSelectedStadium && setSelectedDate && setBookingStep && setBookingCalendarMonth) {
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
              } else if (!isSoldOut) {
                // Fallback if functions not provided
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
      </div>
    );
  };

  // Check if any stadium has 5 cards (special match)
  const hasFiveCards = Object.values(eventsByStadium).some(events => events.length > 4);

  return (
    <section id="tickets" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      <div className={`mx-auto ${hasFiveCards ? 'max-w-[100rem]' : 'max-w-7xl'}`}>
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
              const stadiumEvents = eventsByStadium[stadium.id] || [];
              return (
                <div key={stadium.id} className={bangkokStadiums.indexOf(stadium) < bangkokStadiums.length - 1 ? 'mb-12 sm:mb-16' : ''}>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 mb-6 sm:mb-8 uppercase tracking-tight">
                    {language === 'th' ? `ตั๋ว${stadium.name}` : `${stadium.name.toUpperCase()} TICKETS`}
                  </h3>
                  {stadiumEvents.length > 0 ? (
                    <div className="relative overflow-x-auto sm:overflow-x-visible -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth">
                      {/* Swipe indicator - only visible on mobile */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:hidden pointer-events-none z-10">
                        <ChevronRight className="w-10 h-10 text-yellow-500/80 animate-swipe-hint" />
                      </div>
                      <div className={`flex gap-4 sm:gap-6 snap-x snap-mandatory sm:snap-none ${
                        stadiumEvents.length <= 4 
                          ? 'sm:grid sm:grid-cols-2 lg:grid-cols-4' 
                          : 'sm:flex sm:flex-nowrap sm:justify-start'
                      }`}>
                        {stadiumEvents.map((event, index) => (
                          <div 
                            key={event.id || `${stadium.id}-${index}`} 
                            className={`flex-shrink-0 snap-center sm:snap-none ${
                              stadiumEvents.length <= 4
                                ? 'w-[calc(100vw-2rem)] min-w-[calc(100vw-2rem)] sm:w-auto sm:min-w-0'
                                : 'w-[calc(100vw-2rem)] min-w-[calc(100vw-2rem)] sm:w-[calc((80rem-4.5rem)/4)] sm:min-w-[calc((80rem-4.5rem)/4)] sm:max-w-[calc((80rem-4.5rem)/4)]'
                            }`}
                          >
                            <EventCard event={event} />
                          </div>
                        ))}
                      </div>
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
              const stadiumEvents = eventsByStadium[stadium.id] || [];
              return (
                <div key={stadium.id} className={phuketStadiums.indexOf(stadium) < phuketStadiums.length - 1 ? 'mb-12 sm:mb-16' : ''}>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 mb-6 sm:mb-8 uppercase tracking-tight">
                    {language === 'th' ? `ตั๋ว${stadium.name}` : `${stadium.name.toUpperCase()} TICKETS`}
                  </h3>
                  {stadiumEvents.length > 0 ? (
                    <div className="relative overflow-x-auto sm:overflow-x-visible -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth">
                      {/* Swipe indicator - only visible on mobile */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:hidden pointer-events-none z-10">
                        <ChevronRight className="w-10 h-10 text-yellow-500/80 animate-swipe-hint" />
                      </div>
                      <div className={`flex gap-4 sm:gap-6 snap-x snap-mandatory sm:snap-none ${
                        stadiumEvents.length <= 4 
                          ? 'sm:grid sm:grid-cols-2 lg:grid-cols-4' 
                          : 'sm:flex sm:flex-nowrap sm:justify-start'
                      }`}>
                        {stadiumEvents.map((event, index) => (
                          <div 
                            key={event.id || `${stadium.id}-${index}`} 
                            className={`flex-shrink-0 snap-center sm:snap-none ${
                              stadiumEvents.length <= 4
                                ? 'w-[calc(100vw-2rem)] min-w-[calc(100vw-2rem)] sm:w-auto sm:min-w-0'
                                : 'w-[calc(100vw-2rem)] min-w-[calc(100vw-2rem)] sm:w-[calc((80rem-4.5rem)/4)] sm:min-w-[calc((80rem-4.5rem)/4)] sm:max-w-[calc((80rem-4.5rem)/4)]'
                            }`}
                          >
                            <EventCard event={event} />
                          </div>
                        ))}
                      </div>
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
