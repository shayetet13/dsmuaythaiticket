import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

// Constants & Utils
import { translations } from './constants/translations';
import { getZones } from './constants/zones';
import { API_URL } from './config/api.js';

// Hooks
import { useDatabase } from './hooks/useDatabase';

// Utils
import { initPerformanceMonitoring, preloadCriticalResources } from './utils/performanceMonitor';

// Critical Components (loaded immediately)
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import NewsPopup from './components/NewsPopup';

// Lazy-loaded Components (code splitting)
const HighlightsSection = lazy(() => import('./components/HighlightsSection'));
const UpcomingFightsSection = lazy(() => import('./components/UpcomingFightsSection'));
const BookingSection = lazy(() => import('./components/BookingSection'));
const PaymentQRPage = lazy(() => import('./components/PaymentQRPage'));
const SuccessPage = lazy(() => import('./components/SuccessPage'));
const AboutSection = lazy(() => import('./components/AboutSection'));
const Footer = lazy(() => import('./components/Footer'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
  </div>
);

const App = () => {
  // Language state
  const [language, setLanguage] = useState('en');
  
  // UI states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  
  // Booking states
  const [bookingStep, setBookingStep] = useState('stadium');
  const [selectedStadium, setSelectedStadium] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1
  });
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState(new Date());
  const [paymentData, setPaymentData] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [ticketConfigs, setTicketConfigs] = useState({});

  // Load data from database
  const { heroImage, highlights, stadiums, weeklyFights, stadiumImageSchedules, specialMatches, upcomingFightsBackground, dbLoaded } = useDatabase(language);

  // Translations and zones
  const t = translations[language];
  const zones = getZones(t);

  // Calculate total price based on selected ticket or zone
  const calculateTotalPrice = () => {
    if (!selectedStadium || !selectedZone) return 0;
    
    const quantity = bookingForm.quantity || 1;
    
    // Check if using ticket system (format: "type-ticketId")
    if (selectedZone.includes('-')) {
      const ticketConfig = ticketConfigs[selectedStadium];
      if (!ticketConfig) return 0;
      
      // Split only at first dash (UUID contains multiple dashes)
      const firstDashIndex = selectedZone.indexOf('-');
      const type = selectedZone.substring(0, firstDashIndex);
      const ticketId = selectedZone.substring(firstDashIndex + 1);
      
      let ticket = null;
      
      if (type === 'regular') {
        ticket = ticketConfig.regularTickets?.find(t => t.id === ticketId);
      } else if (type === 'special') {
        ticket = ticketConfig.specialTickets?.find(t => t.id === ticketId);
      }
      
      if (ticket && ticket.price) {
        return parseFloat(ticket.price) * quantity;
      }
    } else {
      // Legacy zone system
      const selectedZoneData = zones.find(z => z.id === selectedZone);
      if (selectedZoneData) {
        return selectedZoneData.price * quantity;
      }
    }
    
    return 0;
  };
  
  const totalPrice = calculateTotalPrice();

  // Initialize performance monitoring
  useEffect(() => {
    // Initialize performance monitoring
    const { isSlow } = initPerformanceMonitoring();
    
    // Adjust quality based on connection speed
    if (isSlow) {
      console.log('[App] Slow connection detected, adjusting settings...');
      // You can add logic here to reduce image quality or disable some features
    }
  }, []);

  // Update SEO meta tags dynamically when hero image is loaded
  useEffect(() => {
    const baseUrl = window.location.origin;
    const currentUrl = window.location.href;
    
    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', currentUrl);
    
    // Update image meta tags if hero image is available
    if (heroImage && heroImage.image) {
      // Always use hero-social.webp for social sharing (created from current hero image)
      // This ensures consistent social media preview regardless of which hero image is used
      let socialImage = '/images/hero/hero-social.webp';
      
      // Convert to absolute URL (required by Facebook and other social platforms)
      const imageUrl = socialImage.startsWith('http') 
        ? socialImage 
        : `${baseUrl}${socialImage.startsWith('/') ? '' : '/'}${socialImage}`;
      
      // Update Open Graph image
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', imageUrl);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        meta.setAttribute('content', imageUrl);
        document.head.appendChild(meta);
      }
      
      // Update Twitter image
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        twitterImage.setAttribute('content', imageUrl);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:image');
        meta.setAttribute('content', imageUrl);
        document.head.appendChild(meta);
      }
    }
  }, [heroImage]);

  // Preload critical images (excluding hero image - it's preloaded in HeroSection)
  useEffect(() => {
    if (dbLoaded && highlights.length > 0) {
      const criticalResources = [];
      
      // Only preload highlights (hero image is handled in HeroSection component)
      highlights.slice(0, 2).forEach(highlight => {
        if (highlight.image && !highlight.image.includes('/hero/')) {
          criticalResources.push({ url: highlight.image, type: 'image' });
        }
      });
      
      if (criticalResources.length > 0) {
        preloadCriticalResources(criticalResources);
      }
    }
  }, [dbLoaded, highlights]);

  // Disable browser scroll restoration and scroll to top on page load
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const handleLoad = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    window.addEventListener('load', handleLoad);
    
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Auto-rotate highlights
  useEffect(() => {
    if (highlights.length > 0) {
      const interval = setInterval(() => {
        setHighlightIndex((prevIndex) => (prevIndex + 1) % highlights.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [highlights.length]);

  // Functions
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  const nextHighlight = () => {
    setHighlightIndex((prevIndex) => (prevIndex + 1) % highlights.length);
  };

  const prevHighlight = () => {
    setHighlightIndex((prevIndex) => (prevIndex - 1 + highlights.length) % highlights.length);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedStadium || !selectedDate || !selectedZone) {
      alert(t.booking.selectAllFields);
      return;
    }

    console.log('=== handleBooking Debug ===');
    console.log('selectedStadium:', selectedStadium);
    console.log('selectedZone:', selectedZone);
    console.log('bookingForm:', bookingForm);
    console.log('ticketConfigs:', ticketConfigs);

    // Prepare booking data and navigate to payment page
    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
    
    // Determine if using ticket system or legacy zone system
    let ticketId = null;
    let ticketType = null;
    let zone = selectedZone;
    let selectedTicketData = null;
    let selectedZoneData = null;
    
    if (selectedZone.includes('-')) {
      // Using ticket system
      // Split only at first dash (UUID contains multiple dashes)
      const firstDashIndex = selectedZone.indexOf('-');
      const type = selectedZone.substring(0, firstDashIndex);
      const id = selectedZone.substring(firstDashIndex + 1);
      
      ticketId = id;
      ticketType = type;
      zone = null;
      
      console.log('Using ticket system:', { type, id });
      
      const ticketConfig = ticketConfigs[selectedStadium];
      console.log('ticketConfig for', selectedStadium, ':', ticketConfig);
      
      if (ticketConfig) {
        if (type === 'regular') {
          selectedTicketData = ticketConfig.regularTickets?.find(t => t.id === id);
          console.log('Found regular ticket:', selectedTicketData);
        } else if (type === 'special') {
          selectedTicketData = ticketConfig.specialTickets?.find(t => t.id === id);
          console.log('Found special ticket:', selectedTicketData);
        }
      } else {
        console.error('No ticket config found for stadium:', selectedStadium);
      }
    } else {
      // Legacy zone system
      console.log('Using legacy zone system');
      selectedZoneData = zones.find(z => z.id === selectedZone);
      console.log('Found zone:', selectedZoneData);
    }
    
    const bookingData = {
      stadium: selectedStadium,
      date: selectedDate,
      zone: zone,
      ticketId: ticketId,
      ticketType: ticketType,
      ...bookingForm,
      totalPrice,
      stadiumData: selectedStadiumData,
      zoneData: selectedZoneData,
      ticketData: selectedTicketData,
      dateDisplay: (() => {
        const date = new Date(selectedDate);
        const dayNames = language === 'th'
          ? ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
          : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = language === 'th'
          ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
          : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const year = language === 'th' ? date.getFullYear() + 543 : date.getFullYear();
        return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
      })()
    };

    console.log('Final bookingData:', {
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      totalPrice: bookingData.totalPrice,
      quantity: bookingData.quantity
    });

    setPaymentData(bookingData);
    setBookingStep('payment');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePaymentSuccess = (responseData) => {
    console.log('[App] Payment success! Opening success page in new window...', responseData);
    
    // เก็บข้อมูลใน sessionStorage สำหรับหน้า success
    sessionStorage.setItem('successPageData', JSON.stringify(responseData));
    sessionStorage.setItem('language', language);
    
    // เปิดหน้า success ในหน้าต่างใหม่
    const successWindow = window.open('/success', '_blank', 'width=1024,height=768');
    
    if (!successWindow) {
      // ถ้าเปิดหน้าใหม่ไม่ได้ (popup blocked) ให้แสดงใน tab ปัจจุบัน
      console.warn('[App] Popup blocked, showing success inline');
      setSuccessData(responseData);
      setBookingStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // แสดง success banner และ reset form
    handleBackToHome();
  };

  const handleBackToHome = () => {
    console.log('[App] Returning to home...');
    
    // แสดง success banner
    setBookingSuccess(true);
    
    // Reset ทุกอย่าง
    setSelectedStadium('');
    setSelectedDate('');
    setSelectedZone('');
    setBookingForm({ name: '', email: '', phone: '', quantity: 1 });
    setPaymentData(null);
    setSuccessData(null);
    setBookingStep('stadium');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // ซ่อน success banner หลัง 5 วินาที
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const handlePaymentBack = () => {
    // Go back to zone selection step (payment step in BookingSection)
    setBookingStep('payment');
    // Clear paymentData when going back
    setPaymentData(null);
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load ticket configs when stadium is selected
  useEffect(() => {
    const loadTicketConfig = async (stadiumId) => {
      if (!stadiumId) return;
      try {
        const response = await axios.get(`${API_URL}/stadiums/${stadiumId}/tickets`);
        // Parse days from JSON string to array for regular tickets
        const config = {
          ...response.data,
          regularTickets: (response.data.regularTickets || []).map(ticket => ({
            ...ticket,
            days: typeof ticket.days === 'string' ? (ticket.days ? JSON.parse(ticket.days) : null) : ticket.days
          }))
        };
        setTicketConfigs(prev => ({
          ...prev,
          [stadiumId]: config
        }));
      } catch (err) {
        console.error('Error loading ticket config:', err);
        // Set empty config if error
        setTicketConfigs(prev => ({
          ...prev,
          [stadiumId]: { regularTickets: [], specialTickets: [] }
        }));
      }
    };

    if (selectedStadium) {
      loadTicketConfig(selectedStadium);
    }
  }, [selectedStadium]);

  // Load all ticket configs for all stadiums (for UpcomingFightsSection)
  useEffect(() => {
    const loadAllTicketConfigs = async () => {
      if (!stadiums || stadiums.length === 0) return;
      
      const configs = {};
      for (const stadium of stadiums) {
        try {
          const response = await axios.get(`${API_URL}/stadiums/${stadium.id}/tickets`);
          // Parse days from JSON string to array for regular tickets
          configs[stadium.id] = {
            ...response.data,
            regularTickets: (response.data.regularTickets || []).map(ticket => ({
              ...ticket,
              days: typeof ticket.days === 'string' ? (ticket.days ? JSON.parse(ticket.days) : null) : ticket.days
            }))
          };
        } catch (err) {
          console.error(`Error loading ticket config for ${stadium.id}:`, err);
          configs[stadium.id] = { regularTickets: [], specialTickets: [] };
        }
      }
      
      setTicketConfigs(prev => ({ ...prev, ...configs }));
    };

    if (stadiums && stadiums.length > 0) {
      loadAllTicketConfigs();
    }
  }, [stadiums]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Success Message */}
      {bookingSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {t.booking.bookingConfirmed}
        </div>
      )}

      {/* Header */}
      <Header
              language={language}
        toggleLanguage={toggleLanguage}
        t={t}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Hero Section - Show when data is loaded, or show with fallback if heroImage exists */}
      {dbLoaded ? (
        <HeroSection heroImage={heroImage || { image: '/images/highlights/World class fighters.jpg', alt: 'Muay Thai', fallback: '/images/highlights/World class fighters.jpg' }} t={t} />
      ) : (
        <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
          <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          </div>
        </section>
      )}

      {/* Lazy-loaded sections with Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        {/* Highlights Section */}
        <HighlightsSection
          highlights={highlights}
          highlightIndex={highlightIndex}
          setHighlightIndex={setHighlightIndex}
          prevHighlight={prevHighlight}
          nextHighlight={nextHighlight}
                language={language}
          t={t}
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        {/* Upcoming Fights Section - Only show when data is loaded */}
        {dbLoaded && (
          <UpcomingFightsSection
            weeklyFights={weeklyFights}
            language={language}
            stadiums={stadiums}
            t={t}
            ticketConfigs={ticketConfigs}
            stadiumImageSchedules={stadiumImageSchedules}
            specialMatches={specialMatches}
            upcomingFightsBackground={upcomingFightsBackground}
            setSelectedStadium={setSelectedStadium}
            setSelectedDate={setSelectedDate}
            setBookingStep={setBookingStep}
            setBookingCalendarMonth={setBookingCalendarMonth}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        {/* Success Page */}
        {bookingStep === 'success' && successData ? (
          <SuccessPage
            bookingData={successData}
            onBackToHome={handleBackToHome}
            language={language}
            t={t}
          />
        ) : /* Payment QR Page */
        bookingStep === 'payment' && paymentData ? (
          <PaymentQRPage
            bookingData={paymentData}
            onBack={handlePaymentBack}
            onPaymentSuccess={handlePaymentSuccess}
            language={language}
            t={t}
          />
        ) : (
          /* Booking Section */
          <BookingSection
            bookingStep={bookingStep}
            setBookingStep={setBookingStep}
            stadiums={stadiums}
            selectedStadium={selectedStadium}
            setSelectedStadium={setSelectedStadium}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            bookingCalendarMonth={bookingCalendarMonth}
            setBookingCalendarMonth={setBookingCalendarMonth}
            zones={zones}
            totalPrice={totalPrice}
            handleBooking={handleBooking}
            language={language}
            t={t}
            ticketConfigs={ticketConfigs}
            stadiumImageSchedules={stadiumImageSchedules}
            specialMatches={specialMatches}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        {/* About Section */}
        <AboutSection t={t} />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        {/* Footer */}
        <Footer language={language} stadiums={stadiums} t={t} />
      </Suspense>
      
      {/* News Popup */}
      <NewsPopup language={language} />
    </div>
  );
};

export default App;
