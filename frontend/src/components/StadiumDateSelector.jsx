import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedItem from './AnimatedItem';
import { isSameDay, canPurchaseTicketsForDate } from '../utils/dateHelpers';
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
  language,
  showBackButton = false,
  lightBackground = false
}) => {
  const navigate = useNavigate();
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState(new Date());
  const [availabilityCache, setAvailabilityCache] = useState({});

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
                <div
                  onClick={() => {
                    if (!isSoldOut) {
                      navigate(getBookingPageUrl(stadiumId, { date: item.dateString, step: 'payment' }), { replace: true });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`${dateCardBaseClass} rounded-lg p-4 border-2 transition-all ${
                    isSoldOut
                      ? dateCardSoldOutClass
                      : isToday
                      ? dateCardTodayClass
                      : dateCardDefaultClass
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-xs sm:text-sm uppercase mb-1 ${
                      isSoldOut ? (lightBackground ? 'text-red-500' : 'text-red-400') : (lightBackground ? 'text-gray-500' : 'text-gray-400')
                    }`}>
                      {dayName}
                    </div>
                    <div className={`text-2xl sm:text-3xl font-black ${
                      isSoldOut
                        ? (lightBackground ? 'text-red-500' : 'text-red-400')
                        : isToday
                        ? todayNumClass
                        : (lightBackground ? 'text-gray-900' : 'text-white')
                    }`}>
                      {dayNumber}
                    </div>
                    {!isSoldOut && matchName && (
                      <div className={`text-[10px] sm:text-xs mt-2 opacity-80 leading-tight ${matchNameClass}`}>
                        {matchName}
                      </div>
                    )}
                    {isSoldOut && (
                      <div className={`${soldOutTextClass} text-xs sm:text-sm font-bold uppercase mt-1`}>
                        {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedItem>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StadiumDateSelector;
