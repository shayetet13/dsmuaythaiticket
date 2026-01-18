import React, { useState, useEffect, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedItem from './AnimatedItem';
import { isSameDay, formatDateDisplay, canPurchaseTicketsForDate } from '../utils/dateHelpers';
import { checkTicketAvailability } from '../hooks/useAvailableTickets';
import { getMatchName } from '../utils/formatHelpers';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import StadiumCardSkeleton from './skeletons/StadiumCardSkeleton';
import Skeleton from './Skeleton';

// Helper functions for stadium data processing
const getLocationString = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location.toLowerCase();
  if (typeof location === 'object') {
    const loc = location.en || location.th || '';
    return typeof loc === 'string' ? loc.toLowerCase() : '';
  }
  return '';
};

const getNameString = (name, language) => {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') {
    return name[language] || name.en || name.th || '';
  }
  return '';
};

const getScheduleString = (schedule, language) => {
  if (!schedule) return '';
  if (typeof schedule === 'string') return schedule;
  if (typeof schedule === 'object') {
    return schedule[language] || schedule.en || schedule.th || '';
  }
  return '';
};

// StadiumCard content (without animation wrapper)
const StadiumCardContent = memo(({ stadium, language, onStadiumSelect, setBookingStep }) => {
  const stadiumName = getNameString(stadium.name, language);
  const stadiumSchedule = getScheduleString(stadium.schedule, language);
  
  const handleClick = () => {
    onStadiumSelect(stadium.id);
    setBookingStep('date');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div 
      className="relative rounded-lg overflow-hidden cursor-pointer group sm:hover:scale-[1.02] transition-all duration-300 flex flex-col bg-black border-2 border-yellow-500"
      onClick={handleClick}
    >
      {/* Stadium Name and Schedule - Above Image, Centered */}
      <div className="text-center p-4 sm:p-5 md:p-6 pb-3 sm:pb-4 bg-black">
        {/* Stadium Name - Yellow, Large */}
        <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-yellow-500 uppercase tracking-tight mb-2">
          {stadiumName.toUpperCase()}
        </h3>
        
        {/* Schedule - White, Smaller */}
        <p className="text-white text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">
          {stadiumSchedule}
        </p>
      </div>

      {/* Image Section - Full Width */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[400px]">
        {stadium.image ? (
          <img
            src={stadium.image}
            alt={stadiumName}
            className="w-full h-full object-contain sm:object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const placeholder = e.target.nextElementSibling;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full bg-gray-800 flex items-center justify-center ${stadium.image ? 'hidden' : 'flex'}`}
        >
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">ไม่มีภาพ</p>
            <p className="text-gray-600 text-xs">No Image</p>
          </div>
        </div>
      </div>

      {/* GET TICKETS Button - Below Image, Centered, No Background */}
      <div className="flex justify-center pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6 bg-black">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="bg-yellow-500 text-black font-black text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded uppercase tracking-wider hover:bg-yellow-400 transition-colors"
        >
          {language === 'th' ? 'ซื้อตั๋ว' : 'GET TICKETS'}
        </button>
      </div>
    </div>
  );
});

StadiumCardContent.displayName = 'StadiumCardContent';

// Memoized StadiumCard component with animation for desktop
const StadiumCard = memo(({ stadium, index, language, onStadiumSelect, setBookingStep }) => {
  return (
    <AnimatedItem key={stadium.id} delay={index * 100} once={true}>
      <StadiumCardContent 
        stadium={stadium}
        language={language}
        onStadiumSelect={onStadiumSelect}
        setBookingStep={setBookingStep}
      />
    </AnimatedItem>
  );
});

StadiumCard.displayName = 'StadiumCard';

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
  specialMatches = [],
  dailyImages = []
}) => {
  // ✅ State for available tickets (fetched from backend)
  const [availableTickets, setAvailableTickets] = useState({
    regularTickets: [],
    specialTickets: []
  });
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  // ✅ Cache for ticket availability checks (to avoid repeated API calls)
  const [availabilityCache, setAvailabilityCache] = useState({});

  // ✅ State for payment images
  const [paymentImages, setPaymentImages] = useState([]);

  // ✅ State for stadium carousel (mobile only)
  const [bangkokStadiumIndex, setBangkokStadiumIndex] = useState(0);
  const [phuketStadiumIndex, setPhuketStadiumIndex] = useState(0);

  // ✅ Fetch available tickets when date is selected
  useEffect(() => {
    if (!selectedStadium || !selectedDate) {
      setAvailableTickets({ regularTickets: [], specialTickets: [] });
      return;
    }

    const fetchAvailableTickets = async () => {
      setLoadingTickets(true);
      try {
        const response = await axios.get(`${API_URL}/tickets/available`, {
          params: { stadiumId: selectedStadium, date: selectedDate }
        });

        if (response.data.success) {
          setAvailableTickets({
            regularTickets: response.data.regularTickets || [],
            specialTickets: response.data.specialTickets || []
          });
        }
      } catch (error) {
        console.error('Error fetching available tickets:', error);
        setAvailableTickets({ regularTickets: [], specialTickets: [] });
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchAvailableTickets();
  }, [selectedStadium, selectedDate]);

  // ✅ Fetch payment images when stadium is selected
  useEffect(() => {
    if (!selectedStadium) {
      setPaymentImages([]);
      return;
    }

    const fetchPaymentImages = async () => {
      try {
        const response = await axios.get(`${API_URL}/stadiums/${selectedStadium}/payment-images`);
        setPaymentImages(response.data || []);
      } catch (error) {
        console.error('Error fetching payment images:', error);
        setPaymentImages([]);
      }
    };

    fetchPaymentImages();
  }, [selectedStadium]);

  // ✅ Get payment image for selected day
  const getPaymentImageForDate = useMemo(() => {
    if (!selectedDate || paymentImages.length === 0) {
      return null;
    }

    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();

    // Find payment image that matches the day of week
    const matchingImage = paymentImages.find(img => 
      img.days && img.days.includes(dayOfWeek)
    );

    return matchingImage?.image || null;
  }, [selectedDate, paymentImages]);

  // ✅ Helper function to check availability (with cache)
  const checkAvailability = async (stadiumId, dateString) => {
    const cacheKey = `${stadiumId}-${dateString}`;
    
    // Check cache first
    if (availabilityCache[cacheKey] !== undefined) {
      return availabilityCache[cacheKey];
    }

    try {
      const response = await axios.get(`${API_URL}/tickets/check-availability`, {
        params: { stadiumId, date: dateString }
      });

      const isAvailable = response.data.success && response.data.isAvailable;
      
      // Update cache
      setAvailabilityCache(prev => ({
        ...prev,
        [cacheKey]: isAvailable
      }));

      return isAvailable;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  // ✅ Pre-fetch availability for all dates in the month when stadium or month changes
  useEffect(() => {
    if (!selectedStadium || bookingStep !== 'date') return;

    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
    if (!selectedStadiumData) return;

    const fetchMonthAvailability = async () => {
      const year = bookingCalendarMonth.getFullYear();
      const month = bookingCalendarMonth.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch availability for all dates in the month
      const promises = [];
      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, month, day, 12, 0, 0);
        const dayOfWeek = date.getDay();

        // Only check dates that are in the stadium's schedule
        if (date >= today && selectedStadiumData.scheduleDays?.includes(dayOfWeek)) {
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          promises.push(checkAvailability(selectedStadium, dateString));
        }
      }

      await Promise.all(promises);
    };

    fetchMonthAvailability();
  }, [selectedStadium, bookingCalendarMonth, bookingStep, stadiums]);

  // Memoize stadium filtering to prevent recalculation on every render
  const { bangkokStadiums, phuketStadiums } = useMemo(() => {
    const bangkok = stadiums.filter(s => {
      const locationStr = getLocationString(s.location);
      return locationStr.includes('bangkok') || locationStr.includes('กรุงเทพ');
    });
    
    const phuket = stadiums.filter(s => {
      const locationStr = getLocationString(s.location);
      return locationStr.includes('phuket') || locationStr.includes('ภูเก็ต');
    });

    return { bangkokStadiums: bangkok, phuketStadiums: phuket };
  }, [stadiums, language]);

  // ✅ Carousel navigation functions for mobile
  const prevBangkokStadium = () => {
    setBangkokStadiumIndex((prev) => (prev === 0 ? bangkokStadiums.length - 1 : prev - 1));
  };

  const nextBangkokStadium = () => {
    setBangkokStadiumIndex((prev) => (prev === bangkokStadiums.length - 1 ? 0 : prev + 1));
  };

  const prevPhuketStadium = () => {
    setPhuketStadiumIndex((prev) => (prev === 0 ? phuketStadiums.length - 1 : prev - 1));
  };

  const nextPhuketStadium = () => {
    setPhuketStadiumIndex((prev) => (prev === phuketStadiums.length - 1 ? 0 : prev + 1));
  };

  // Show skeleton if no stadiums loaded
  if (stadiums.length === 0) {
    return (
      <section id="booking" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8 md:space-y-12">
            {/* Bangkok Section Skeleton */}
            <div>
              <div className="h-8 sm:h-10 md:h-12 w-48 sm:w-64 mx-auto mb-6">
                <Skeleton className="w-full h-full rounded" variant="dark" />
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((index) => (
                  <StadiumCardSkeleton key={index} />
                ))}
              </div>
              <div className="sm:hidden">
                <StadiumCardSkeleton />
              </div>
            </div>
            {/* Phuket Section Skeleton */}
            <div>
              <div className="h-8 sm:h-10 md:h-12 w-48 sm:w-64 mx-auto mb-6">
                <Skeleton className="w-full h-full rounded" variant="dark" />
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2].map((index) => (
                  <StadiumCardSkeleton key={index} />
                ))}
              </div>
              <div className="sm:hidden">
                <StadiumCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Step 1: Select Stadium */}
        {bookingStep === 'stadium' && (
            <div className="space-y-8 md:space-y-12">
              {/* กรุงเทพ Section */}
              {bangkokStadiums.length > 0 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 uppercase mb-6 text-center">
                    {language === 'th' ? 'กรุงเทพ' : 'BANGKOK'}
                  </h2>
                  <div className="relative px-2 sm:px-0">
                    {/* Left Arrow Button - Mobile only */}
                    {bangkokStadiums.length > 1 && (
                      <button
                        onClick={prevBangkokStadium}
                        className="absolute left-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                        aria-label="Previous stadium"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}

                    {/* Right Arrow Button - Mobile only */}
                    {bangkokStadiums.length > 1 && (
                      <button
                        onClick={nextBangkokStadium}
                        className="absolute right-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                        aria-label="Next stadium"
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
                          style={{ transform: `translateX(-${bangkokStadiumIndex * 100}%)` }}
                        >
                            {bangkokStadiums.map((stadium, index) => (
                              <div key={stadium.id} className="min-w-full flex-shrink-0 w-full px-0">
                                <StadiumCardContent
                                stadium={stadium} 
                                language={language}
                                onStadiumSelect={setSelectedStadium}
                                setBookingStep={setBookingStep}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desktop: Grid */}
                      <div className="hidden sm:grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                        {bangkokStadiums.map((stadium, index) => (
                          <StadiumCard 
                            key={stadium.id}
                            stadium={stadium} 
                            index={index}
                            language={language}
                            onStadiumSelect={setSelectedStadium}
                            setBookingStep={setBookingStep}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Navigation dots - Mobile only */}
                    {bangkokStadiums.length > 1 && (
                      <div className="flex justify-center gap-2 mt-6 sm:hidden">
                        {bangkokStadiums.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setBangkokStadiumIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === bangkokStadiumIndex
                                ? 'w-8 bg-yellow-500'
                                : 'w-2 bg-gray-600 hover:bg-gray-500'
                            }`}
                            aria-label={`Go to stadium ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ภูเก็ต Section */}
              {phuketStadiums.length > 0 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 uppercase mb-6 text-center">
                    {language === 'th' ? 'ภูเก็ต' : 'PHUKET'}
                  </h2>
                  <div className="relative px-2 sm:px-0">
                    {/* Left Arrow Button - Mobile only */}
                    {phuketStadiums.length > 1 && (
                      <button
                        onClick={prevPhuketStadium}
                        className="absolute left-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                        aria-label="Previous stadium"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}

                    {/* Right Arrow Button - Mobile only */}
                    {phuketStadiums.length > 1 && (
                      <button
                        onClick={nextPhuketStadium}
                        className="absolute right-0 sm:hidden top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                        aria-label="Next stadium"
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
                          style={{ transform: `translateX(-${phuketStadiumIndex * 100}%)` }}
                        >
                            {phuketStadiums.map((stadium, index) => (
                              <div key={stadium.id} className="min-w-full flex-shrink-0 w-full px-0">
                                <StadiumCardContent
                                stadium={stadium} 
                                language={language}
                                onStadiumSelect={setSelectedStadium}
                                setBookingStep={setBookingStep}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desktop: Grid */}
                      <div className="hidden sm:grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                        {phuketStadiums.map((stadium, index) => (
                          <StadiumCard 
                            key={stadium.id}
                            stadium={stadium} 
                            index={index}
                            language={language}
                            onStadiumSelect={setSelectedStadium}
                            setBookingStep={setBookingStep}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Navigation dots - Mobile only */}
                    {phuketStadiums.length > 1 && (
                      <div className="flex justify-center gap-2 mt-6 sm:hidden">
                        {phuketStadiums.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setPhuketStadiumIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === phuketStadiumIndex
                                ? 'w-8 bg-yellow-500'
                                : 'w-2 bg-gray-600 hover:bg-gray-500'
                            }`}
                            aria-label={`Go to stadium ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
        )}

        {/* Step 2: Select Date */}
        {bookingStep === 'date' && selectedStadium && (() => {
          const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
          if (!selectedStadiumData) return null;

          // ✅ Check if date has available tickets (using cache from API)

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
                  const cacheKey = `${selectedStadium}-${dateString}`;
                  
                  // Check if tickets can be purchased (20:30 cutoff for today)
                  const canPurchase = canPurchaseTicketsForDate(dateString);
                  
                  // Check availability from cache
                  const isAvailableFromCache = availabilityCache[cacheKey] !== undefined ? availabilityCache[cacheKey] : true;
                  
                  // Ticket is sold out if: cannot purchase (time restriction) OR not available from cache
                  const isAvailable = canPurchase && isAvailableFromCache;
                  
                  dates.push({
                    date: date,
                    dateString: dateString,
                    isSoldOut: !isAvailable
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
                  const matchName = selectedStadium ? getMatchName(selectedStadium, date.getDay(), item.dateString, stadiumImageSchedules, specialMatches, dailyImages) : '';

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

          // ✅ Use available tickets from state (fetched from backend API)
          const availableRegularTickets = availableTickets.regularTickets || [];
          const specialTicketsForDate = availableTickets.specialTickets || [];
          
          // ✅ Combine all available tickets (renamed to avoid conflict)
          const allTickets = [
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
          const useLegacyZones = allTickets.length === 0;

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
                  const matchName = getMatchName(selectedStadium, dayOfWeek, selectedDate, stadiumImageSchedules, specialMatches, dailyImages);
                  
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

              {/* Promotional Image Section */}
              {(getPaymentImageForDate || selectedStadiumData?.paymentImage) && (
                <div className="mb-6 flex justify-center">
                  <div className="w-full max-w-2xl">
                    <img 
                      src={getPaymentImageForDate || selectedStadiumData.paymentImage} 
                      alt="Promotional" 
                      className="w-full h-auto rounded-lg object-cover shadow-lg"
                      onError={(e) => {
                        // Fallback to default image if payment image fails to load
                        e.target.src = 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop';
                      }}
                    />
                  </div>
                </div>
              )}

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
                    {allTickets.map(ticket => {
                      const isSelected = selectedZone === `${ticket.type}-${ticket.ticketId}`;
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
                              {ticket.type === 'special' && ticket.image && (
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                  {language === 'th' ? 'พิเศษ' : 'SPECIAL'}
                                </span>
                              )}
                            </div>
                          )}
                          {!isOutOfStock && ticket.type === 'special' && ticket.image && (
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
                  // Split only at first dash (UUID contains multiple dashes)
                  const firstDashIndex = selectedZone.indexOf('-');
                  const type = selectedZone.substring(0, firstDashIndex);
                  const ticketId = selectedZone.substring(firstDashIndex + 1);
                  
                  selectedTicketData = allTickets.find(t => t.ticketId === ticketId && t.type === type);
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
                
                // Calculate max quantity: min(15, available quantity)
                let maxQuantity = 15; // Default max is 15
                if (!useLegacyZones && selectedTicketData) {
                  const availableQuantity = selectedTicketData.quantity || 0;
                  maxQuantity = Math.min(15, availableQuantity);
                }
                
                return (
                  <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-base sm:text-lg font-semibold text-white">{t.booking.quantity}</label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            const newQuantity = Math.max(1, bookingForm.quantity - 1);
                            setBookingForm({ ...bookingForm, quantity: newQuantity });
                          }}
                          disabled={bookingForm.quantity <= 1}
                          className="w-10 h-10 bg-gray-700 rounded hover:bg-gray-600 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={bookingForm.quantity}
                          onChange={(e) => {
                            let newQuantity = parseInt(e.target.value) || 1;
                            // Ensure quantity is between 1 and maxQuantity
                            newQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
                            setBookingForm({ ...bookingForm, quantity: newQuantity });
                          }}
                          className="w-16 text-center text-lg font-bold bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-yellow-500"
                        />
                        <button
                          onClick={() => {
                            const newQuantity = Math.min(maxQuantity, bookingForm.quantity + 1);
                            setBookingForm({ ...bookingForm, quantity: newQuantity });
                          }}
                          disabled={bookingForm.quantity >= maxQuantity}
                          className="w-10 h-10 bg-gray-700 rounded hover:bg-gray-600 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {maxQuantity < 15 && (
                      <p className="text-sm text-gray-400 mt-2">
                        {language === 'th' 
                          ? `จำนวนสูงสุด: ${maxQuantity} ใบ (ตามจำนวนที่มี)` 
                          : `Maximum: ${maxQuantity} tickets (available stock)`}
                      </p>
                    )}
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

