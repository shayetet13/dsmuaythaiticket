import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedItem from './AnimatedItem';
import { isSameDay, canPurchaseTicketsForDate, formatDateDisplay } from '../utils/dateHelpers';
import { getMatchName } from '../utils/formatHelpers';
import { getBookingPageUrl } from '../utils/bookingUrls';
import axios from 'axios';
import { API_URL } from '../config/api.js';

const StadiumDateSelector = ({
  stadiumId,
  stadiums,
  stadiumImageSchedules = {},
  specialMatches = [],
  dailyImages = [],
  matchCards = [],
  language,
  showBackButton = false,
  lightBackground = false
}) => {
  const navigate = useNavigate();
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState(new Date());
  const [availabilityCache, setAvailabilityCache] = useState({});
  const [cardSelectionData, setCardSelectionData] = useState(null);

  const selectedStadiumData = stadiums?.find(s => s && s.id === stadiumId);
  if (!stadiumId || !selectedStadiumData) return null;

  const checkAvailability = async (sid, dateString) => {
    const cacheKey = `${sid}-${dateString}`;
    if (availabilityCache[cacheKey] !== undefined) {
      return availabilityCache[cacheKey];
    }
    try {
      const response = await axios.get(`${API_URL}/tickets/check-availability`, {
        params: { stadiumId: sid, date: dateString }
      });
      const isAvailable = response.data.success && response.data.isAvailable;
      setAvailabilityCache(prev => ({ ...prev, [cacheKey]: isAvailable }));
      return isAvailable;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  useEffect(() => {
    const stadiumData = stadiums?.find(s => s && s.id === stadiumId);
    if (!stadiumData?.scheduleDays) return;

    const fetchMonthAvailability = async () => {
      const year = bookingCalendarMonth.getFullYear();
      const month = bookingCalendarMonth.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const promises = [];
      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, month, day, 12, 0, 0);
        const dayOfWeek = date.getDay();
        if (date >= today && stadiumData.scheduleDays.includes(dayOfWeek)) {
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          promises.push(checkAvailability(stadiumId, dateString));
        }
      }
      await Promise.all(promises);
    };

    fetchMonthAvailability();
  }, [stadiumId, bookingCalendarMonth, stadiums]);

  const availableDates = (() => {
    const dates = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const year = bookingCalendarMonth.getFullYear();
    const month = bookingCalendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day, 12, 0, 0);
      const dayOfWeek = date.getDay();

      if (date >= today && selectedStadiumData.scheduleDays?.includes(dayOfWeek)) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cacheKey = `${stadiumId}-${dateString}`;
        const canPurchase = canPurchaseTicketsForDate(dateString);
        const isAvailableFromCache = availabilityCache[cacheKey] !== undefined ? availabilityCache[cacheKey] : true;
        const isAvailable = canPurchase && isAvailableFromCache;

        dates.push({
          date,
          dateString,
          isSoldOut: !isAvailable
        });
      }
    }
    return dates;
  })();

  const textClass = lightBackground ? 'text-red-600' : 'text-yellow-500';
  const hoverClass = lightBackground ? 'hover:text-red-500' : 'hover:text-yellow-400';
  const sectionBgClass = lightBackground ? 'bg-white' : '';
  const cardBgClass = lightBackground ? 'bg-gray-100' : 'bg-gray-900';
  const cardBorderClass = lightBackground ? 'border-gray-200' : 'border-gray-700';
  const cardTextClass = lightBackground ? 'text-gray-900' : 'text-white';
  const cardSubtextClass = lightBackground ? 'text-gray-600' : 'text-gray-400';
  const navHoverClass = lightBackground ? 'hover:bg-gray-200' : 'hover:bg-gray-800';
  const navIconClass = lightBackground ? 'text-gray-900' : 'text-white';
  const dateCardBaseClass = lightBackground ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700';
  const dateCardSoldOutClass = lightBackground ? 'border-red-500 bg-red-50 cursor-not-allowed' : 'border-red-500 bg-red-900/90 cursor-not-allowed';
  const dateCardTodayClass = lightBackground ? 'border-red-600 bg-red-50 cursor-pointer hover:scale-105' : 'border-yellow-500 bg-yellow-500/10 cursor-pointer hover:scale-105';
  const dateCardDefaultClass = lightBackground ? 'hover:border-red-600 cursor-pointer hover:scale-105' : 'hover:border-yellow-500 cursor-pointer hover:scale-105';
  const todayNumClass = lightBackground ? 'text-red-600' : 'text-yellow-500';
  const matchNameClass = lightBackground ? 'text-gray-600' : 'text-gray-300';
  const soldOutTextClass = lightBackground ? 'text-red-600' : 'text-red-400';

  return (
    <div className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${sectionBgClass}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          {showBackButton ? (
            <button
              onClick={() => navigate(getBookingPageUrl(stadiumId, { step: 'stadium' }), { replace: true })}
              className={`flex items-center ${textClass} ${hoverClass} transition-colors`}
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="font-semibold">{language === 'th' ? 'กลับ' : 'BACK'}</span>
            </button>
          ) : (
            <div className="w-24" />
          )}
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center ${textClass} uppercase`}>
            {language === 'th' ? 'เลือกวันที่' : 'Select Date'}
          </h1>
          <div className="w-24" />
        </div>

        <div className="mb-6">
          <div className={`${cardBgClass} rounded-lg p-4 sm:p-6 border ${cardBorderClass}`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${cardTextClass}`}>
              {typeof selectedStadiumData.name === 'string' ? selectedStadiumData.name : (selectedStadiumData.name?.en || selectedStadiumData.name?.th)}
            </h3>
            <p className={`${cardSubtextClass} text-sm sm:text-base`}>
              {selectedStadiumData.schedule}
            </p>
          </div>
        </div>

        <div className={`mb-6 ${cardBgClass} rounded-lg p-4 flex items-center justify-between border ${cardBorderClass}`}>
          <button
            onClick={() => {
              const newDate = new Date(bookingCalendarMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setBookingCalendarMonth(newDate);
            }}
            className={`p-2 ${navHoverClass} rounded-full transition-colors`}
            aria-label="Previous month"
          >
            <ChevronLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${navIconClass}`} />
          </button>

          <div className={`${navIconClass} text-center`}>
            <div className="font-bold text-lg sm:text-xl md:text-2xl">
              {(() => {
                const monthNames = language === 'th'
                  ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
                  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const year = bookingCalendarMonth.getFullYear();
                const thaiYear = language === 'th' ? year + 543 : year;
                return `${monthNames[bookingCalendarMonth.getMonth()]} ${thaiYear}`;
              })()}
            </div>
          </div>

          <button
            onClick={() => {
              const newDate = new Date(bookingCalendarMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setBookingCalendarMonth(newDate);
            }}
            className={`p-2 ${navHoverClass} rounded-full transition-colors`}
            aria-label="Next month"
          >
            <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 ${navIconClass}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {availableDates.map((item, index) => {
            const date = item.date;
            const isToday = isSameDay(date, new Date());
            const isSoldOut = item.isSoldOut;
            const dayNames = language === 'th'
              ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
              : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[date.getDay()];
            const dayNumber = date.getDate();
            const matchName = getMatchName(stadiumId, date.getDay(), item.dateString, stadiumImageSchedules, specialMatches, dailyImages);

            return (
              <AnimatedItem key={index} delay={index * 50}>
                {(() => {
                  const matchCardsForDate = matchCards.filter(
                    mc => (mc.stadiumId || mc.stadium_id) === stadiumId && mc.date === item.dateString
                  );
                  const hasAvailableMatchCard = matchCardsForDate.some(
                    mc => mc.tickets && mc.tickets.length > 0 && mc.tickets.some(t => t.quantity > 0)
                  );
                  const isInteractable = !isSoldOut || hasAvailableMatchCard;
                  return (
                <div
                  onClick={() => {
                    if (!isInteractable) return;
                    if (matchCardsForDate.length > 0) {
                      setCardSelectionData({ dateString: item.dateString, matchCardsForDate, regularIsSoldOut: isSoldOut });
                    } else {
                      navigate(getBookingPageUrl(stadiumId, { date: item.dateString, step: 'payment' }), { replace: true });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`${dateCardBaseClass} rounded-lg p-4 border-2 transition-all ${
                    !isInteractable
                      ? dateCardSoldOutClass
                      : isToday
                      ? dateCardTodayClass
                      : dateCardDefaultClass
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-xs sm:text-sm uppercase mb-1 ${
                      !isInteractable ? (lightBackground ? 'text-red-500' : 'text-red-400') : (lightBackground ? 'text-gray-500' : 'text-gray-400')
                    }`}>
                      {dayName}
                    </div>
                    <div className={`text-2xl sm:text-3xl font-black ${
                      !isInteractable
                        ? (lightBackground ? 'text-red-500' : 'text-red-400')
                        : isToday
                        ? todayNumClass
                        : (lightBackground ? 'text-gray-900' : 'text-white')
                    }`}>
                      {dayNumber}
                    </div>
                    {isInteractable && matchName && (
                      <div className={`text-[10px] sm:text-xs mt-2 opacity-80 leading-tight ${matchNameClass}`}>
                        {matchName}
                      </div>
                    )}
                    {!isInteractable && (
                      <div className={`${soldOutTextClass} text-xs sm:text-sm font-bold uppercase mt-1`}>
                        {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
                      </div>
                    )}
                  </div>
                </div>
                  ); // close return inside IIFE
                })()}
              </AnimatedItem>
            );
          })}
        </div>
      </div>

      {/* Card Selection Modal */}
      {cardSelectionData && (() => {
        const [yr, mo, dy] = cardSelectionData.dateString.split('-').map(Number);
        const dow = new Date(yr, mo - 1, dy).getDay();
        const regularImage = (() => {
          // Mirrors getEventImage priority in UpcomingFightsSection exactly:
          // 1. Special match image (exact date)
          const special = specialMatches?.find(m => (m.stadiumId || m.stadium_id) === stadiumId && m.date === cardSelectionData.dateString);
          if (special?.image) return special.image;
          // 2. Daily image (exact date)
          const daily = dailyImages?.find(img => (img.stadiumId || img.stadium_id) === stadiumId && img.date === cardSelectionData.dateString);
          if (daily?.image) return daily.image;
          // 3. Scheduled image — schedule.days is an array of day-of-week numbers
          const schedules = stadiumImageSchedules?.[stadiumId] || [];
          const sched = schedules.find(s => Array.isArray(s.days) && s.days.includes(dow));
          if (sched?.image) return sched.image;
          // 4. Per-stadium default match images (same as UpcomingFightsSection)
          const defaultStadiumImages = {
            rajadamnern: '/images/highlights/RWS (125 of 220).webp',
            lumpinee: '/images/highlights/OTA_COVER.webp',
            bangla: '/images/highlights/aow4.webp',
            patong: '/images/highlights/P7012865 (1).webp',
          };
          return defaultStadiumImages[stadiumId] || `/images/stadiums/${stadiumId}.webp`;
        })();
        const regularName = getMatchName(stadiumId, dow, cardSelectionData.dateString, stadiumImageSchedules, specialMatches, dailyImages) || (language === 'th' ? 'แมตช์ปกติ' : 'Regular Match');
        const allSelections = [
          { type: 'regular', image: regularImage, name: regularName, isSpecial: false, isSoldOut: cardSelectionData.regularIsSoldOut || false },
          ...cardSelectionData.matchCardsForDate.map(mc => ({
            type: 'matchcard', image: mc.image, name: mc.name, isSpecial: mc.isSpecial, id: mc.id,
            isSoldOut: !mc.tickets || mc.tickets.length === 0 || mc.tickets.every(t => t.quantity <= 0)
          }))
        ];

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85"
            onClick={() => setCardSelectionData(null)}
          >
            <div
              className="bg-gray-950 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl lg:max-w-3xl max-h-[92vh] flex flex-col border border-gray-800 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-700 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-yellow-400 uppercase tracking-wide">
                    {language === 'th' ? 'เลือกการแข่งขัน' : 'Select Match'}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {formatDateDisplay(new Date(yr, mo - 1, dy), language)}
                  </p>
                </div>
                <button
                  onClick={() => setCardSelectionData(null)}
                  className="text-gray-500 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto">
                <div className={`grid gap-3 sm:gap-4 ${allSelections.length > 2 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
                  {allSelections.map((sel, idx) => (
                    <button
                      key={idx}
                      disabled={sel.isSoldOut}
                      onClick={() => {
                        if (sel.isSoldOut) return;
                        setCardSelectionData(null);
                        if (sel.type === 'regular') {
                          navigate(getBookingPageUrl(stadiumId, { date: cardSelectionData.dateString, step: 'payment' }), { replace: true });
                        } else {
                          navigate(getBookingPageUrl(stadiumId, { date: cardSelectionData.dateString, step: 'payment', matchCardId: sel.id }), { replace: true });
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`relative rounded-xl overflow-hidden group focus:outline-none ${sel.isSoldOut ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                    >
                      <div className="relative w-full overflow-hidden rounded-xl" style={{ height: 'clamp(220px, 45vw, 420px)' }}>
                        <img
                          src={sel.image}
                          alt={sel.name}
                          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${sel.isSoldOut ? '' : 'group-hover:scale-105'}`}
                          onError={e => { e.target.src = `/images/stadiums/${stadiumId}.webp`; e.target.onerror = null; }}
                        />
                        {/* Sold Out overlay */}
                        {sel.isSoldOut && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-xl">
                            <div className="border-2 border-red-500 text-red-500 font-black text-lg sm:text-xl px-4 py-1.5 rounded uppercase tracking-widest rotate-[-12deg]">
                              {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
                            </div>
                          </div>
                        )}
                        <div className={`absolute inset-0 bg-gradient-to-t ${sel.isSpecial ? 'from-yellow-950/95 via-black/30' : 'from-black/95 via-black/30'} to-transparent`} />
                        {!sel.isSoldOut && (
                          <div className={`absolute inset-0 rounded-xl ring-2 transition-all duration-200 ${sel.isSpecial ? 'ring-yellow-500/70 group-hover:ring-yellow-400' : 'ring-transparent group-hover:ring-white/50'}`} />
                        )}
                        {sel.isSpecial && (
                          <div className="absolute top-2.5 right-2.5 bg-yellow-500 text-black text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shadow-lg">
                            ✨ Special
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-left">
                          <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold mb-1 ${sel.isSpecial ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {sel.type === 'regular'
                              ? (language === 'th' ? 'แมตช์ปกติ' : 'Regular Match')
                              : sel.isSpecial
                                ? (language === 'th' ? 'แมตช์พิเศษ' : 'Special Match')
                                : (language === 'th' ? 'การ์ดแมตช์' : 'Match Card')}
                          </div>
                          <div className={`font-black text-sm sm:text-base leading-tight line-clamp-2 uppercase ${sel.isSpecial ? 'text-yellow-300' : 'text-white'}`}>
                            {sel.name}
                          </div>
                          {!sel.isSoldOut && (
                            <div className={`mt-2 sm:mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all ${sel.isSpecial ? 'bg-yellow-500 text-black group-hover:bg-yellow-400' : 'bg-white/15 text-white group-hover:bg-white/30'}`}>
                              {language === 'th' ? 'เลือกการ์ดนี้' : 'Select This'}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StadiumDateSelector;
