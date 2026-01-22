import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
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

// Critical Components (loaded immediately - only essential for first paint)
import Header from './components/Header';
import HeroSection from './components/HeroSection';
// NewsPopup is lazy-loaded since it's not critical for first paint
const NewsPopup = lazy(() => import('./components/NewsPopup'));

// Lazy-loaded Components (code splitting)
const HighlightsSection = lazy(() => import('./components/HighlightsSection'));
const UpcomingFightsSection = lazy(() => import('./components/UpcomingFightsSection'));
const BookingSection = lazy(() => import('./components/BookingSection'));
const PaymentQRPage = lazy(() => import('./components/PaymentQRPage'));
const SuccessPage = lazy(() => import('./components/SuccessPage'));
const AboutSection = lazy(() => import('./components/AboutSection'));
const Footer = lazy(() => import('./components/Footer'));

// Skeleton Components
import HeroSectionSkeleton from './components/skeletons/HeroSectionSkeleton';
import HighlightsSectionSkeleton from './components/skeletons/HighlightsSectionSkeleton';
import UpcomingFightsSectionSkeleton from './components/skeletons/UpcomingFightsSectionSkeleton';
import BookingSectionSkeleton from './components/skeletons/BookingSectionSkeleton';

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

  // Listen for email verification events from other tabs/windows
  useEffect(() => {
    // Listen to BroadcastChannel for cross-tab communication
    let channel;
    try {
      channel = new BroadcastChannel('email_verification');
      channel.onmessage = (event) => {
        if (event.data.type === 'email_verified' && event.data.action === 'redirect_to_home') {
          console.log('[App] Email verified in another tab, reloading page...');
          // Reload the page to go back to home
          window.location.href = '/';
        }
      };
    } catch (e) {
      console.warn('[App] BroadcastChannel not supported');
    }
    
    // Fallback: Listen to localStorage events
    const handleStorageChange = (e) => {
      if (e.key === 'email_verification_redirect') {
        console.log('[App] Email verified in another tab (localStorage), reloading page...');
        window.location.href = '/';
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
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
  const { heroImage, highlights, stadiums, weeklyFights, stadiumImageSchedules, specialMatches, dailyImages, upcomingFightsBackground, dbLoaded } = useDatabase(language);

  // Translations and zones
  const t = translations[language];
  const zones = getZones(t);

  // Calculate total price based on selected ticket or zone (memoized for performance)
  const totalPrice = useMemo(() => {
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
  }, [selectedStadium, selectedZone, bookingForm.quantity, ticketConfigs, zones]);

  // Initialize performance monitoring (defer to avoid blocking FCP)
  useEffect(() => {
    // Defer performance monitoring to avoid blocking first paint
    // Run after initial render is complete using requestIdleCallback
    const initMonitoring = () => {
      const { isSlow } = initPerformanceMonitoring();
      
      // Adjust quality based on connection speed
      if (isSlow) {
        // Reduce image quality or disable some features for slow connections
      }
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initMonitoring, { timeout: 2000 });
    } else {
      // Fallback: defer by 500ms
      setTimeout(initMonitoring, 500);
    }
  }, []);

  // Update SEO meta tags dynamically when hero image is loaded (defer to avoid blocking FCP)
  useEffect(() => {
    // Defer SEO updates to avoid blocking first paint
    if (!heroImage) return;
    
    const timer = setTimeout(() => {
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
    }, 100);
    
    return () => clearTimeout(timer);
  }, [heroImage]);

  // Preload critical images (defer to avoid blocking TBT)
  useEffect(() => {
    if (dbLoaded && highlights.length > 0) {
      // Defer preloading to avoid blocking main thread
      const preloadImages = () => {
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
      };
      
      // Use requestIdleCallback to defer non-critical preloading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadImages, { timeout: 3000 });
      } else {
        setTimeout(preloadImages, 1000);
      }
    }
  }, [dbLoaded, highlights]);

  // Disable browser scroll restoration and scroll to top on page load (defer to avoid blocking TBT)
  useEffect(() => {
    // Defer scroll operations to avoid blocking main thread
    const initScroll = () => {
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
    };
    
    // Use requestIdleCallback to defer scroll operations
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initScroll, { timeout: 1000 });
    } else {
      setTimeout(initScroll, 50);
    }
  }, []);

  // Auto-rotate highlights (defer to avoid blocking TBT)
  useEffect(() => {
    if (highlights.length > 0) {
      // Defer interval setup to avoid blocking initial render
      const setupInterval = () => {
        const interval = setInterval(() => {
          setHighlightIndex((prevIndex) => (prevIndex + 1) % highlights.length);
        }, 5000);
        return () => clearInterval(interval);
      };
      
      // Use requestIdleCallback to defer interval setup
      let cleanup;
      if ('requestIdleCallback' in window) {
        const idleId = requestIdleCallback(() => {
          cleanup = setupInterval();
        }, { timeout: 2000 });
        return () => {
          cancelIdleCallback(idleId);
          if (cleanup) cleanup();
        };
      } else {
        const timer = setTimeout(() => {
          cleanup = setupInterval();
        }, 1000);
        return () => {
          clearTimeout(timer);
          if (cleanup) cleanup();
        };
      }
    }
  }, [highlights.length]);

  // Functions (memoized to reduce re-renders and TBT)
  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'th' : 'en');
  }, [language]);

  const nextHighlight = useCallback(() => {
    setHighlightIndex((prevIndex) => (prevIndex + 1) % highlights.length);
  }, [highlights.length]);

  const prevHighlight = useCallback(() => {
    setHighlightIndex((prevIndex) => (prevIndex - 1 + highlights.length) % highlights.length);
  }, [highlights.length]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedStadium || !selectedDate || !selectedZone) {
      alert(t.booking.selectAllFields);
      return;
    }


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
      
      // Validate quantity: max 15 or available quantity, whichever is lower
      if (selectedTicketData) {
        const availableQuantity = selectedTicketData.quantity || 0;
        const maxAllowed = Math.min(15, availableQuantity);
        if (bookingForm.quantity > maxAllowed) {
          alert(language === 'th' 
            ? `จำนวนตั๋วสูงสุดที่สามารถซื้อได้คือ ${maxAllowed} ใบ` 
            : `Maximum ${maxAllowed} tickets allowed`);
          return;
        }
        if (bookingForm.quantity > availableQuantity) {
          alert(language === 'th' 
            ? `จำนวนตั๋วที่เหลือมีเพียง ${availableQuantity} ใบ` 
            : `Only ${availableQuantity} tickets available`);
          return;
        }
      }
    } else {
      // Legacy zone system
      console.log('Using legacy zone system');
      selectedZoneData = zones.find(z => z.id === selectedZone);
      console.log('Found zone:', selectedZoneData);
      
      // Validate quantity for legacy zones: max 15
      if (bookingForm.quantity > 15) {
        alert(language === 'th' 
          ? 'จำนวนตั๋วสูงสุดที่สามารถซื้อได้คือ 15 ใบ' 
          : 'Maximum 15 tickets allowed');
        return;
      }
    }
    
    // Ensure quantity is at least 1
    if (bookingForm.quantity < 1) {
      alert(language === 'th' 
        ? 'กรุณาเลือกจำนวนตั๋วอย่างน้อย 1 ใบ' 
        : 'Please select at least 1 ticket');
      return;
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

  // Load all ticket configs for all stadiums (defer to avoid blocking TBT)
  useEffect(() => {
    const loadAllTicketConfigs = async () => {
      if (!stadiums || stadiums.length === 0) return;
      
      const configs = {};
      // Load configs sequentially with small delays to avoid blocking
      for (let i = 0; i < stadiums.length; i++) {
        const stadium = stadiums[i];
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
          
          // Update state incrementally to avoid blocking
          setTicketConfigs(prev => ({ ...prev, [stadium.id]: configs[stadium.id] }));
          
          // Small delay between requests to avoid blocking main thread
          if (i < stadiums.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (err) {
          console.error(`Error loading ticket config for ${stadium.id}:`, err);
          configs[stadium.id] = { regularTickets: [], specialTickets: [] };
          setTicketConfigs(prev => ({ ...prev, [stadium.id]: configs[stadium.id] }));
        }
      }
    };

    if (stadiums && stadiums.length > 0) {
      // Defer loading to avoid blocking initial render
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          loadAllTicketConfigs();
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          loadAllTicketConfigs();
        }, 500);
      }
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

      {/* Hero Section - Show immediately with actual hero image for better LCP */}
      <HeroSection 
        heroImage={heroImage || { 
          image: '/images/hero/World%20class%20fighters.webp', 
          alt: 'Muay Thai', 
          fallback: '/images/hero/World%20class%20fighters.webp' 
        }} 
        t={t} 
      />

      {/* Lazy-loaded sections with Suspense */}
      <Suspense fallback={<HighlightsSectionSkeleton />}>
        {/* Highlights Section */}
        {highlights.length === 0 && !dbLoaded ? (
          <HighlightsSectionSkeleton />
        ) : (
          <HighlightsSection
            highlights={highlights}
            highlightIndex={highlightIndex}
            setHighlightIndex={setHighlightIndex}
            prevHighlight={prevHighlight}
            nextHighlight={nextHighlight}
            language={language}
            t={t}
          />
        )}
      </Suspense>

      <Suspense fallback={<UpcomingFightsSectionSkeleton />}>
        {/* Upcoming Fights Section - Show skeleton when loading, content when loaded */}
        {!dbLoaded || stadiums.length === 0 ? (
          <UpcomingFightsSectionSkeleton />
        ) : (
          <UpcomingFightsSection
            weeklyFights={weeklyFights}
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
          />
        )}
      </Suspense>

      <Suspense fallback={<BookingSectionSkeleton />}>
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
        ) : /* Booking Section - Show skeleton when loading */
        !dbLoaded || stadiums.length === 0 ? (
          <BookingSectionSkeleton />
        ) : (
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
            dailyImages={dailyImages}
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
      
      {/* News Popup - Lazy loaded */}
      <Suspense fallback={null}>
        <NewsPopup language={language} />
      </Suspense>
    </div>
  );
};

export default App;
