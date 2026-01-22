import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { getStadiumName, getMatchName } from '../utils/formatHelpers';
import UpcomingFightsSectionSkeleton from './skeletons/UpcomingFightsSectionSkeleton';

const UpcomingFightsSection = ({ 
  weeklyFights, 
  language, 
  stadiums, 
  t, 
  ticketConfigs = {}, 
  stadiumImageSchedules = {}, 
  specialMatches = [],
  dailyImages = [],
  upcomingFightsBackground = null,
  setSelectedStadium,
  setSelectedDate,
  setBookingStep,
  setBookingCalendarMonth
}) => {
  const navigate = useNavigate();
  // Use default background only if not loaded yet
  const backgroundImage = upcomingFightsBackground?.image || null;
  const backgroundFallback = upcomingFightsBackground?.fallback || '/images/hero/World class fighters.webp';
  // Get events for each stadium
  // Default images for each stadium
  const defaultImages = {
    rajadamnern: [
      '/images/highlights/RWS (125 of 220).webp',
      '/images/highlights/RWS (131 of 220).webp',
      '/images/highlights/_DSC5122.webp',
      '/images/hero/World class fighters.webp'
    ],
    lumpinee: [
      '/images/highlights/OTA_COVER.webp',
      '/images/highlights/DSC_9319.webp',
      '/images/highlights/MEMO0026.webp',
      '/images/highlights/BOAT2132 3.webp'
    ],
    bangla: [
      '/images/highlights/aow4.webp',
      '/images/hero/World class fighters.webp',
      '/images/highlights/_NPX0152-2.webp',
      '/images/highlights/20230930-NPX_3584.webp'
    ],
    patong: [
      '/images/highlights/P7012865 (1).webp',
      '/images/highlights/S__89981064.webp',
      '/images/highlights/NPX_5549.webp',
      '/images/hero/World class fighters.webp'
    ]
  };

  // Use utility function for event/match name
  const getEventName = (stadiumId, dayOfWeek, dateStr = null) => 
    getMatchName(stadiumId, dayOfWeek, dateStr, stadiumImageSchedules, specialMatches, dailyImages);

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

    // Second, check for daily images (exact date match, links to regular tickets)
    if (dailyImages && dailyImages.length > 0 && dateStr) {
      const dailyImage = dailyImages.find(img => 
        img.stadiumId === stadiumId && img.date === dateStr
      );
      if (dailyImage && dailyImage.image) {
        return dailyImage.image;
      }
    }

    // Third, check for scheduled images (day of week match)
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
    const defaultStadiumImages = defaultImages[stadiumId] || [`/images/stadiums/${stadiumId}.webp`];
    return defaultStadiumImages[index % defaultStadiumImages.length];
  };

  // ✅ State for caching ticket availability (fetched from backend API)
  const [availabilityCache, setAvailabilityCache] = useState({});

  // ✅ State for event carousel (mobile only) - store index for each stadium
  const [eventCarouselIndices, setEventCarouselIndices] = useState({});

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

      // Also fetch availability for daily image dates - Force refresh these
      if (dailyImages && dailyImages.length > 0) {
        dailyImages.forEach(image => {
          if (image.date && image.stadiumId) {
            // Force refresh for daily images to ensure latest data
            promises.push(checkAvailability(image.stadiumId, image.date, true));
          }
        });
      }

      await Promise.all(promises);
    };

    if (stadiums && stadiums.length > 0) {
      fetchAllAvailability();
    }
  }, [stadiums, specialMatches, dailyImages]);

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

  // Use utility function for date formatting (custom format for this component)
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

  // Use utility function for stadium name
  const getStadiumNameLocal = (stadiumId) => getStadiumName(stadiumId, stadiums);

  // EventCard for Mobile - Separate UI
  const EventCardMobile = ({ event }) => {
    if (!event) return null;
    
    const stadiumName = getStadiumNameLocal(event.stadiumId || '');
    const eventName = event.name || `${stadiumName} Event`;
    const fullEventName = `${formatDate(event.date)} - ${eventName.toUpperCase()}${event.time ? ` (${event.time})` : ''}`;
    const isSoldOut = event.isSoldOut || false;
    const isSpecialMatch = event.isSpecialMatch || false;
    
    return (
      <div className={`rounded-lg transition-all duration-300 relative ${
        isSpecialMatch ? 'p-[2px]' : ''
      }`}>
        <div className={`bg-white rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-md relative h-full ${
          isSoldOut 
            ? 'border-gray-300 opacity-75' 
            : isSpecialMatch
            ? 'border-yellow-400/60 shadow-md shadow-yellow-500/30'
            : 'border-gray-300'
        } ${isSpecialMatch ? 'ring-2 ring-yellow-400/40' : ''}`}
        style={isSpecialMatch ? {
          borderWidth: '2px',
          borderColor: 'rgba(250, 204, 21, 0.6)',
        } : {}}
        >
          {/* Image - Mobile: Full card with object-cover */}
          <div className="relative h-80 overflow-hidden bg-gray-200">
            <img
              src={event.image || `/images/stadiums/${event.stadiumId || 'default'}.webp`}
              alt={eventName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `/images/stadiums/${event.stadiumId || 'default'}.webp`;
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
              <div className="bg-red-600 text-white font-black text-lg px-4 py-2 rounded-lg uppercase tracking-wider">
                {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
              </div>
            </div>
          )}
        </div>
        
        {/* Content - Mobile */}
        <div className="p-4 bg-gray-50 border-t-2 border-gray-200">
          <div className={`text-xs mb-2 uppercase tracking-wide font-semibold ${
            isSoldOut ? 'text-gray-400' : 'text-red-600'
          }`}>
            {stadiumName}
          </div>
          <div className={`text-sm mb-3 line-clamp-2 min-h-[2.5rem] font-medium ${
            isSoldOut ? 'text-gray-500' : 'text-gray-900'
          }`}>
            {fullEventName}
          </div>
          <div className="h-[28px] mb-4 flex items-center">
            {(event.price || event.priceRange) && !isSoldOut && (
              <div className="text-red-600 text-sm font-bold">
                {formatPrice(event.price, event.priceRange)}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!isSoldOut) {
                // Navigate to booking page with stadium and date parameters
                const params = new URLSearchParams();
                params.set('stadium', event.stadiumId);
                params.set('date', event.date);
                params.set('step', 'payment');
                navigate(`/booking?${params.toString()}`);
              }
            }}
            disabled={isSoldOut}
            className={`w-full h-[44px] font-bold px-4 rounded-lg transition-all duration-200 text-sm uppercase tracking-wide flex items-center justify-center ${
              isSoldOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white shadow-md'
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

  // EventCard for Desktop - Separate UI
  const EventCardDesktop = ({ event }) => {
    if (!event) return null;
    
    const stadiumName = getStadiumNameLocal(event.stadiumId || '');
    const eventName = event.name || `${stadiumName} Event`;
    const fullEventName = `${formatDate(event.date)} - ${eventName.toUpperCase()}${event.time ? ` (${event.time})` : ''}`;
    const isSoldOut = event.isSoldOut || false;
    const isSpecialMatch = event.isSpecialMatch || false;
    
    return (
      <div className={`rounded-lg transition-all duration-300 relative ${
        isSpecialMatch ? 'p-[3px] golden-card-glow' : ''
      }`}>
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
          {/* Image - Desktop: Full card with object-cover, no borders */}
          <div className="relative h-96 md:h-[400px] lg:h-[450px] overflow-hidden">
            <img
              src={event.image || `/images/stadiums/${event.stadiumId || 'default'}.webp`}
              alt={eventName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `/images/stadiums/${event.stadiumId || 'default'}.webp`;
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
              <div className="bg-red-600 text-white font-black text-xl md:text-2xl px-6 py-3 rounded-lg uppercase tracking-wider">
                {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
              </div>
            </div>
          )}
        </div>
        
        {/* Content - Desktop */}
        <div className="p-5 bg-gray-50 border-t-2 border-gray-200">
          <div className={`text-sm mb-2 uppercase tracking-wide font-semibold ${
            isSoldOut ? 'text-gray-400' : 'text-red-600'
          }`}>
            {stadiumName}
          </div>
          <div className={`text-base mb-3 line-clamp-2 min-h-[2.5rem] font-medium ${
            isSoldOut ? 'text-gray-500' : 'text-gray-900'
          }`}>
            {fullEventName}
          </div>
          <div className="h-[28px] mb-4 flex items-center">
            {(event.price || event.priceRange) && !isSoldOut && (
              <div className="text-red-600 text-base font-bold">
                {formatPrice(event.price, event.priceRange)}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!isSoldOut) {
                // Navigate to booking page with stadium and date parameters
                const params = new URLSearchParams();
                params.set('stadium', event.stadiumId);
                params.set('date', event.date);
                params.set('step', 'payment');
                navigate(`/booking?${params.toString()}`);
              }
            }}
            disabled={isSoldOut}
            className={`w-full h-[44px] font-bold px-4 rounded-lg transition-all duration-200 text-base uppercase tracking-wide flex items-center justify-center ${
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

  // Main EventCard - Auto-detect and render appropriate version
  const EventCard = ({ event }) => {
    const { isMobile } = useResponsive();
    
    // Separate UI for mobile and desktop
    if (isMobile) {
      return <EventCardMobile event={event} />;
    } else {
      return <EventCardDesktop event={event} />;
    }
  };

  // Check if any stadium has 5 cards (special match)
  const hasFiveCards = Object.values(eventsByStadium).some(events => events.length > 4);

  // ✅ Carousel navigation functions for mobile
  const getEventCarouselIndex = (stadiumId) => {
    return eventCarouselIndices[stadiumId] || 0;
  };

  const setEventCarouselIndex = (stadiumId, index) => {
    setEventCarouselIndices(prev => ({
      ...prev,
      [stadiumId]: index
    }));
  };

  const prevEvent = (stadiumId, events) => {
    const currentIndex = getEventCarouselIndex(stadiumId);
    const newIndex = currentIndex === 0 ? events.length - 1 : currentIndex - 1;
    setEventCarouselIndex(stadiumId, newIndex);
  };

  const nextEvent = (stadiumId, events) => {
    const currentIndex = getEventCarouselIndex(stadiumId);
    const newIndex = currentIndex === events.length - 1 ? 0 : currentIndex + 1;
    setEventCarouselIndex(stadiumId, newIndex);
  };

  // Show skeleton if no stadiums loaded
  if (!stadiums || stadiums.length === 0) {
    return <UpcomingFightsSectionSkeleton />;
  }

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
                    <div className="relative px-8 sm:px-0">
                      {/* Left Arrow Button - Mobile only */}
                      {stadiumEvents.length > 1 && (
                        <button
                          onClick={() => prevEvent(stadium.id, stadiumEvents)}
                          className="absolute left-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                          aria-label="Previous event"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}

                      {/* Right Arrow Button - Mobile only */}
                      {stadiumEvents.length > 1 && (
                        <button
                          onClick={() => nextEvent(stadium.id, stadiumEvents)}
                          className="absolute right-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                          aria-label="Next event"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}

                      {/* Carousel Container */}
                      <div className="relative overflow-hidden rounded-lg w-full sm:overflow-visible">
                        {/* Mobile: Carousel */}
                        <div className="sm:hidden">
                          <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${getEventCarouselIndex(stadium.id) * 100}%)` }}
                          >
                            {stadiumEvents.map((event, index) => (
                              <div key={event.id || `${stadium.id}-${index}`} className="min-w-full flex-shrink-0 w-full px-2">
                                <EventCard event={event} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Desktop: Grid/Flex */}
                        <div className={`hidden sm:flex gap-4 sm:gap-6 ${
                          stadiumEvents.length <= 4 
                            ? 'sm:grid sm:grid-cols-2 lg:grid-cols-4' 
                            : 'sm:flex sm:flex-nowrap sm:justify-start'
                        }`}>
                          {stadiumEvents.map((event, index) => (
                            <div 
                              key={event.id || `${stadium.id}-${index}`} 
                              className={stadiumEvents.length <= 4
                                ? 'sm:w-auto sm:min-w-0'
                                : 'sm:w-[calc((80rem-4.5rem)/4)] sm:min-w-[calc((80rem-4.5rem)/4)] sm:max-w-[calc((80rem-4.5rem)/4)]'
                              }
                            >
                              <EventCard event={event} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Navigation dots - Mobile only */}
                      {stadiumEvents.length > 1 && (
                        <div className="flex justify-center gap-2 mt-6 sm:hidden">
                          {stadiumEvents.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setEventCarouselIndex(stadium.id, index)}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                index === getEventCarouselIndex(stadium.id)
                                  ? 'w-8 bg-red-600'
                                  : 'w-2 bg-gray-600 hover:bg-gray-500'
                              }`}
                              aria-label={`Go to event ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
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
                    <div className="relative px-8 sm:px-0">
                      {/* Left Arrow Button - Mobile only */}
                      {stadiumEvents.length > 1 && (
                        <button
                          onClick={() => prevEvent(stadium.id, stadiumEvents)}
                          className="absolute left-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                          aria-label="Previous event"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}

                      {/* Right Arrow Button - Mobile only */}
                      {stadiumEvents.length > 1 && (
                        <button
                          onClick={() => nextEvent(stadium.id, stadiumEvents)}
                          className="absolute right-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                          aria-label="Next event"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}

                      {/* Carousel Container */}
                      <div className="relative overflow-hidden rounded-lg w-full sm:overflow-visible">
                        {/* Mobile: Carousel */}
                        <div className="sm:hidden">
                          <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${getEventCarouselIndex(stadium.id) * 100}%)` }}
                          >
                            {stadiumEvents.map((event, index) => (
                              <div key={event.id || `${stadium.id}-${index}`} className="min-w-full flex-shrink-0 w-full px-2">
                                <EventCard event={event} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Desktop: Grid/Flex */}
                        <div className={`hidden sm:flex gap-4 sm:gap-6 ${
                          stadiumEvents.length <= 4 
                            ? 'sm:grid sm:grid-cols-2 lg:grid-cols-4' 
                            : 'sm:flex sm:flex-nowrap sm:justify-start'
                        }`}>
                          {stadiumEvents.map((event, index) => (
                            <div 
                              key={event.id || `${stadium.id}-${index}`} 
                              className={stadiumEvents.length <= 4
                                ? 'sm:w-auto sm:min-w-0'
                                : 'sm:w-[calc((80rem-4.5rem)/4)] sm:min-w-[calc((80rem-4.5rem)/4)] sm:max-w-[calc((80rem-4.5rem)/4)]'
                              }
                            >
                              <EventCard event={event} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Navigation dots - Mobile only */}
                      {stadiumEvents.length > 1 && (
                        <div className="flex justify-center gap-2 mt-6 sm:hidden">
                          {stadiumEvents.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setEventCarouselIndex(stadium.id, index)}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                index === getEventCarouselIndex(stadium.id)
                                  ? 'w-8 bg-red-600'
                                  : 'w-2 bg-gray-600 hover:bg-gray-500'
                              }`}
                              aria-label={`Go to event ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
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
