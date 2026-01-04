import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedItem from './AnimatedItem';
import { isSameDay, formatDateDisplay } from '../utils/dateHelpers';

// Get match name based on stadium and day of week
const getMatchName = (stadiumId, dayOfWeek, dateStr = null, stadiumImageSchedules = {}, specialMatches = []) => {
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
  const matchSchedule = {
    rajadamnern: {
      0: 'KIATPETCH MUAY THAI',  // Sunday
      1: 'RAJADAMNERN KNOCKOUT', // Monday
      2: 'RAJADAMNERN KNOCKOUT', // Tuesday
      3: 'NEW POWER MUAY THAI',  // Wednesday
      4: 'PETHYINDEE MUAY THAI', // Thursday
      5: 'RAJADAMNERN KNOCKOUT', // Friday
      6: 'RWS – MUAY THAI'       // Saturday
    },
    lumpinee: {
      5: 'ONE LUMPINEE',         // Friday
      6: 'ONE FIGHT NIGHT'       // Saturday
    },
    bangla: {
      0: 'MUAY THAI BANGLA PHUKET', // Sunday
      3: 'MUAY THAI BANGLA PHUKET', // Wednesday
      5: 'MUAY THAI BANGLA PHUKET'  // Friday
    },
    patong: {
      1: 'MUAY THAI PATONG PHUKET', // Monday
      4: 'MUAY THAI PATONG PHUKET', // Thursday
      6: 'MUAY THAI PATONG PHUKET'  // Saturday
    }
  };

  return matchSchedule[stadiumId]?.[dayOfWeek] || '';
};

const BookingSection = ({
  bookingStep,
  setBookingStep,
  stadiums,
  selectedStadium,
  setSelectedStadium,
  selectedDate,
  setSelectedDate,
  selectedZone,
  setSelectedZone,
  bookingForm,
  setBookingForm,
  bookingCalendarMonth,
  setBookingCalendarMonth,
  zones,
  totalPrice,
  handleBooking,
  language,
  t,
  ticketConfigs,
  stadiumImageSchedules = {},
  specialMatches = []
}) => {
  return (
    <section id="booking" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-800" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Step 1: Select Stadium */}
        {bookingStep === 'stadium' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {stadiums.map((stadium, index) => (
                <AnimatedItem key={stadium.id} delay={index * 100}>
                  <div 
                    className="relative rounded-lg overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-300 flex flex-col"
                    onClick={() => {
                      setSelectedStadium(stadium.id);
                      setBookingStep('date');
                      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {/* Stadium Name and Schedule - Above Image, Centered */}
                    <div className="text-center p-4 sm:p-5 md:p-6 pb-3 sm:pb-4">
                      {/* Stadium Name - Yellow, Large */}
                      <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-yellow-500 uppercase tracking-tight mb-2">
                        {stadium.name.toUpperCase()}
                      </h3>
                      
                      {/* Schedule - White, Smaller */}
                      <p className="text-white text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">
                        {stadium.schedule}
                      </p>
                    </div>

                    {/* Image Section - Full Width */}
                    <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[400px]">
                      <img
                        src={stadium.image}
                        alt={stadium.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/highlights/World class fighters.jpg';
                        }}
                      />
                    </div>

                    {/* GET TICKETS Button - Below Image, Centered, No Background */}
                    <div className="flex justify-center pt-4 sm:pt-5 md:pt-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStadium(stadium.id);
                          setBookingStep('date');
                          document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-yellow-500 text-black font-black text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded uppercase tracking-wider hover:bg-yellow-400 transition-colors"
                      >
                        {language === 'th' ? 'ซื้อตั๋ว' : 'GET TICKETS'}
                      </button>
                    </div>
                  </div>
                </AnimatedItem>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date */}
        {bookingStep === 'date' && selectedStadium && (() => {
          const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
          if (!selectedStadiumData) return null;

          // Get ticket config for this stadium
          const ticketConfig = ticketConfigs[selectedStadium] || { regularTickets: [], specialTickets: [] };

          // Check if date has available tickets
          const hasAvailableTickets = (dateString) => {
            // Parse date string (YYYY-MM-DD) directly to avoid timezone issues
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid timezone issues
            const dayOfWeek = date.getDay();
            
            // Check regular tickets - must have days that include this day of week and quantity > 0
            const hasRegularTickets = ticketConfig.regularTickets && ticketConfig.regularTickets.length > 0
              && ticketConfig.regularTickets.some(ticket => {
                // Parse days if it's a string (JSON)
                let ticketDays = ticket.days;
                if (typeof ticketDays === 'string') {
                  try {
                    ticketDays = ticketDays ? JSON.parse(ticketDays) : null;
                  } catch (e) {
                    ticketDays = null;
                  }
                }
                
                // Ensure ticketDays is an array
                if (!Array.isArray(ticketDays)) {
                  ticketDays = [];
                }
                
                // Check if ticket has days array and it includes the selected day
                const hasMatchingDay = ticketDays.length > 0 && ticketDays.includes(dayOfWeek);
                const hasQuantity = (ticket.quantity || 0) > 0;
                return hasMatchingDay && hasQuantity;
              });
            
            // Check special tickets for this date - at least one must have quantity > 0
            const specialTicketsForDate = ticketConfig.specialTickets && ticketConfig.specialTickets.filter(ticket => {
              const ticketDate = new Date(ticket.date);
              ticketDate.setHours(0, 0, 0, 0);
              return ticketDate.getTime() === date.getTime();
            }) || [];
            
            const hasSpecialTickets = specialTicketsForDate.length > 0
              && specialTicketsForDate.some(ticket => (ticket.quantity || 0) > 0);
            
            // Return true if either regular or special tickets are available
            return hasRegularTickets || hasSpecialTickets;
          };

          // Get available dates for this stadium based on selected month and scheduleDays
          const availableDates = (() => {
            const dates = [];
            // Get today's date in local timezone
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
            
            // Get first and last day of the selected month
            const year = bookingCalendarMonth.getFullYear();
            const month = bookingCalendarMonth.getMonth();
            const lastDay = new Date(year, month + 1, 0);
            
            // Get all days in the month
            for (let day = 1; day <= lastDay.getDate(); day++) {
              const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid timezone issues
              const dayOfWeek = date.getDay();
              
              // Only show dates that are today or in the future
              if (date >= today) {
                // Check if this day is in the stadium's schedule
                if (selectedStadiumData.scheduleDays && selectedStadiumData.scheduleDays.includes(dayOfWeek)) {
                  // Create dateString directly from year, month, day to avoid timezone issues
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  dates.push({
                    date: date,
                    dateString: dateString,
                    isSoldOut: !hasAvailableTickets(dateString)
                  });
                }
              }
            }
            
            return dates;
          })();

          return (
            <div>
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setBookingStep('stadium')}
                  className="flex items-center text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{language === 'th' ? 'กลับ' : 'BACK'}</span>
                </button>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-yellow-500 uppercase">
                  {language === 'th' ? 'เลือกวันที่' : 'SELECT DATE'}
                </h2>
                <div className="w-24"></div> {/* Spacer for centering */}
              </div>

              <div className="mb-6">
                <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {selectedStadiumData.name}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {selectedStadiumData.schedule}
                  </p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="mb-6 bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    const newDate = new Date(bookingCalendarMonth);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setBookingCalendarMonth(newDate);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>

                <div className="text-white text-center">
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
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                  const matchName = selectedStadium ? getMatchName(selectedStadium, date.getDay(), item.dateString, stadiumImageSchedules, specialMatches) : '';

                  return (
                    <AnimatedItem key={index} delay={index * 50}>
                      <div
                        onClick={() => {
                          if (!isSoldOut) {
                            setSelectedDate(item.dateString);
                            setBookingStep('payment');
                            document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className={`bg-gray-900 rounded-lg p-4 border-2 transition-all ${
                          isSoldOut
                            ? 'border-red-500/50 bg-red-900/20 cursor-not-allowed opacity-60'
                            : isToday
                            ? 'border-yellow-500 bg-yellow-500/10 cursor-pointer hover:scale-105'
                            : 'border-gray-700 hover:border-yellow-500 cursor-pointer hover:scale-105'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-xs sm:text-sm uppercase mb-1 ${
                            isSoldOut ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {dayName}
                          </div>
                          <div className={`text-2xl sm:text-3xl font-black ${
                            isSoldOut
                              ? 'text-red-400'
                              : isToday
                              ? 'text-yellow-500'
                              : 'text-white'
                          }`}>
                            {dayNumber}
                          </div>
                          {!isSoldOut && matchName && (
                            <div className="text-[10px] sm:text-xs mt-2 opacity-80 leading-tight text-gray-300">
                              {matchName}
                            </div>
                          )}
                          {isSoldOut && (
                            <div className="text-red-400 text-xs sm:text-sm font-bold uppercase mt-1">
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
          );
        })()}

        {/* Step 3: Select Zone and Payment */}
        {bookingStep === 'payment' && selectedStadium && selectedDate && (() => {
          const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
          if (!selectedStadiumData) return null;

          // Get ticket config for this stadium
          const ticketConfig = ticketConfigs[selectedStadium] || { regularTickets: [], specialTickets: [] };
          
          // Get regular tickets and special tickets for selected date
          // Parse date string (YYYY-MM-DD) directly to avoid timezone issues
          const [year, month, day] = selectedDate.split('-').map(Number);
          const selectedDateObj = new Date(year, month - 1, day, 12, 0, 0);
          const dayOfWeek = selectedDateObj.getDay();
          
          const specialTicketsForDate = ticketConfig.specialTickets?.filter(ticket => {
            // Parse ticket date string directly
            const [tYear, tMonth, tDay] = ticket.date.split('-').map(Number);
            const ticketDate = new Date(tYear, tMonth - 1, tDay, 12, 0, 0);
            return ticketDate.getTime() === selectedDateObj.getTime() && (ticket.quantity || 0) > 0;
          }) || [];
          
          // Filter regular tickets by day of week - only show tickets that have this day in their days array
          const availableRegularTickets = ticketConfig.regularTickets?.filter(ticket => {
            // Parse days if it's a string (JSON)
            let ticketDays = ticket.days;
            if (typeof ticketDays === 'string') {
              try {
                ticketDays = ticketDays ? JSON.parse(ticketDays) : null;
              } catch (e) {
                ticketDays = null;
              }
            }
            
            // Ensure ticketDays is an array
            if (!Array.isArray(ticketDays)) {
              ticketDays = [];
            }
            
            // Ticket must have days array with the selected day of week and quantity > 0
            return ticketDays.length > 0 && ticketDays.includes(dayOfWeek) && (ticket.quantity || 0) > 0;
          }) || [];
          
          // Combine all available tickets
          const availableTickets = [
            ...availableRegularTickets.map(ticket => ({
              ...ticket,
              type: 'regular',
              ticketId: ticket.id,
              ticketType: 'regular'
            })),
            ...specialTicketsForDate.map(ticket => ({
              ...ticket,
              type: 'special',
              ticketId: ticket.id,
              ticketType: 'special'
            }))
          ];

          // Fallback to zones if no tickets configured
          const useLegacyZones = availableTickets.length === 0;

          return (
            <div>
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setBookingStep('date')}
                  className="flex items-center text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{language === 'th' ? 'กลับ' : 'BACK'}</span>
                </button>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-yellow-500 uppercase">
                  {language === 'th' ? 'เลือกตั๋วและชำระเงิน' : 'SELECT TICKET & PAYMENT'}
                </h2>
                <div className="w-24"></div> {/* Spacer for centering */}
              </div>

              {/* Selected Stadium and Date Info */}
              <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                {(() => {
                  const selectedDateObj = new Date(selectedDate);
                  const dayOfWeek = selectedDateObj.getDay();
                  const matchName = getMatchName(selectedStadium, dayOfWeek, selectedDate, stadiumImageSchedules, specialMatches);
                  
                  return (
                    <div className={`grid gap-4 ${matchName ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">{language === 'th' ? 'สนามมวย' : 'Stadium'}</p>
                        <p className="text-white font-bold text-lg">{selectedStadiumData.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">{language === 'th' ? 'วันที่' : 'Date'}</p>
                        <p className="text-white font-bold text-lg">
                          {formatDateDisplay(new Date(selectedDate), language)}
                        </p>
                      </div>
                      {matchName && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">{language === 'th' ? 'ชื่อแมตช์' : 'Match Name'}</p>
                          <p className="text-white font-bold text-lg">{matchName}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Ticket Selection */}
              <div className="mb-6">
                <label className="block text-lg sm:text-xl font-bold mb-4 text-white">
                  {useLegacyZones ? t.booking.selectZone : (language === 'th' ? 'เลือกตั๋ว' : 'SELECT TICKET')}
                </label>
                {useLegacyZones ? (
                  // Fallback to zones if no tickets configured
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {zones.map(zone => (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZone(zone.id)}
                        className={`p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedZone === zone.id
                            ? 'border-yellow-500 bg-yellow-500/10'
                            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base sm:text-lg font-bold text-white">{zone.name}</h4>
                          <span className="text-yellow-500 font-black text-lg sm:text-xl">฿{zone.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">{zone.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show tickets from backend
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTickets.map(ticket => {
                      const isSelected = selectedZone === ticket.ticketId && selectedZone.startsWith(ticket.type);
                      const remaining = ticket.quantity || 0;
                      const isLowStock = remaining <= 10 && remaining > 0;
                      const isOutOfStock = remaining === 0;
                      
                      return (
                        <div
                          key={`${ticket.type}-${ticket.ticketId}`}
                          onClick={() => !isOutOfStock && setSelectedZone(`${ticket.type}-${ticket.ticketId}`)}
                          className={`p-4 sm:p-6 rounded-lg border-2 transition-all ${
                            isOutOfStock
                              ? 'border-gray-700 bg-gray-900/50 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'border-yellow-500 bg-yellow-500/10 cursor-pointer'
                              : 'border-gray-700 bg-gray-900 hover:border-gray-600 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-base sm:text-lg font-bold text-white">{ticket.name || '-'}</h4>
                            <span className="text-yellow-500 font-black text-lg sm:text-xl">
                              {ticket.price ? `฿${parseFloat(ticket.price).toLocaleString()}` : '-'}
                            </span>
                          </div>
                          {isOutOfStock && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-red-400">
                                {language === 'th' ? 'หมดแล้ว' : 'SOLD OUT'}
                              </span>
                              {ticket.type === 'special' && (
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                  {language === 'th' ? 'พิเศษ' : 'SPECIAL'}
                                </span>
                              )}
                            </div>
                          )}
                          {!isOutOfStock && ticket.type === 'special' && (
                            <div className="flex items-center justify-end">
                              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                {language === 'th' ? 'พิเศษ' : 'SPECIAL'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quantity and Total */}
              {selectedZone && (() => {
                // Calculate price based on selected ticket
                let ticketPrice = 0;
                let selectedTicketData = null;
                
                if (!useLegacyZones && selectedZone.includes('-')) {
                  const [type, ticketId] = selectedZone.split('-');
                  selectedTicketData = availableTickets.find(t => t.ticketId === ticketId && t.type === type);
                  if (selectedTicketData) {
                    ticketPrice = parseFloat(selectedTicketData.price) || 0;
                  }
                } else if (useLegacyZones) {
                  const zoneData = zones.find(z => z.id === selectedZone);
                  if (zoneData) {
                    ticketPrice = zoneData.price || 0;
                    selectedTicketData = zoneData;
                  }
                }
                
                const calculatedTotal = ticketPrice * bookingForm.quantity;
                
                return (
                  <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-base sm:text-lg font-semibold text-white">{t.booking.quantity}</label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            const newQuantity = Math.max(1, bookingForm.quantity - 1);
                            // Check stock availability
                            if (!useLegacyZones && selectedTicketData) {
                              const maxQuantity = selectedTicketData.quantity || 0;
                              if (newQuantity > maxQuantity) return;
                            }
                            setBookingForm({ ...bookingForm, quantity: newQuantity });
                          }}
                          className="w-10 h-10 bg-gray-700 rounded hover:bg-gray-600 text-lg font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-lg font-bold">{bookingForm.quantity}</span>
                        <button
                          onClick={() => {
                            const newQuantity = bookingForm.quantity + 1;
                            // Check stock availability
                            if (!useLegacyZones && selectedTicketData) {
                              const maxQuantity = selectedTicketData.quantity || 0;
                              if (newQuantity > maxQuantity) return;
                            }
                            setBookingForm({ ...bookingForm, quantity: newQuantity });
                          }}
                          disabled={!useLegacyZones && selectedTicketData && bookingForm.quantity >= (selectedTicketData.quantity || 0)}
                          className="w-10 h-10 bg-gray-700 rounded hover:bg-gray-600 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-lg sm:text-xl font-bold text-white">{t.booking.totalPrice}</span>
                      <span className="text-2xl sm:text-3xl font-black text-yellow-500">
                        {ticketPrice ? `฿${calculatedTotal.toLocaleString()}` : '-'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Customer Information */}
              {selectedZone && (
                <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                  <h3 className="text-lg sm:text-xl font-bold mb-4 text-white">
                    {language === 'th' ? 'ข้อมูลผู้ซื้อ' : 'Customer Information'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t.booking.fullName}</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t.booking.email}</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">{t.booking.phone}</label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm and Pay Button */}
              {selectedZone && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!bookingForm.name || !bookingForm.email || !bookingForm.phone) {
                      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
                      return;
                    }
                    handleBooking(e);
                  }}
                  disabled={!selectedZone || !bookingForm.name || !bookingForm.email || !bookingForm.phone}
                  className="w-full bg-yellow-500 text-black font-black text-lg sm:text-xl px-8 py-4 rounded-lg uppercase tracking-wider hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  {language === 'th' ? 'ยืนยันและชำระเงิน' : 'CONFIRM & PAY'}
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default BookingSection;

