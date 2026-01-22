import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// Components
import BookingSection from './BookingSection';
import PaymentQRPage from './PaymentQRPage';
import SuccessPage from './SuccessPage';
import EmailVerificationPage from './EmailVerificationPage';
import Footer from './Footer';
import Header from './Header';

// Constants & Utils
import { translations } from '../constants/translations';
import { getZones } from '../constants/zones';
import { API_URL } from '../config/api.js';

// Hooks
import { useDatabase } from '../hooks/useDatabase';

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get initial values from URL params
  const initialStadium = searchParams.get('stadium') || '';
  const initialDate = searchParams.get('date') || '';
  const stepFromUrl = searchParams.get('step') || 'stadium';
  
  // Check if email is verified (from sessionStorage)
  const emailVerifiedFromStorage = sessionStorage.getItem('emailVerified') === 'true';
  const verifiedBookingDataFromStorage = sessionStorage.getItem('verifiedBookingData');
  
  // Determine initial step: if email verified, go to payment; otherwise use URL param
  const initialStep = (emailVerifiedFromStorage && verifiedBookingDataFromStorage && stepFromUrl === 'payment')
    ? 'payment' 
    : stepFromUrl;
  
  // Language state - get from localStorage or default to 'en'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  // Toggle language function
  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'en' ? 'th' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  }, [language]);
  
  // UI states
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Booking states
  const [bookingStep, setBookingStep] = useState(initialStep);
  const [selectedStadium, setSelectedStadium] = useState(initialStadium);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedZone, setSelectedZone] = useState('');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1
  });
  const [verificationId, setVerificationId] = useState(null);
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState(
    initialDate ? (() => {
      const [year, month, day] = initialDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    })() : new Date()
  );
  
  // Initialize paymentData - will be set from sessionStorage when email is verified
  const [paymentData, setPaymentData] = useState(null);
  
  const [successData, setSuccessData] = useState(null);
  const [ticketConfigs, setTicketConfigs] = useState({});
  
  // Ref to track if we're updating URL from state (to prevent infinite loop)
  const isUpdatingUrlFromState = useRef(false);

  // Load data from database
  const { stadiums, stadiumImageSchedules, specialMatches, dailyImages, bookingBackground, dbLoaded } = useDatabase(language);

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

  // Sync state with URL params when URL changes (e.g., browser back/forward, navigation)
  useEffect(() => {
    // Skip if we're updating URL from state
    if (isUpdatingUrlFromState.current) {
      isUpdatingUrlFromState.current = false;
      return;
    }
    
    const stepFromUrl = searchParams.get('step') || 'stadium';
    const stadiumFromUrl = searchParams.get('stadium') || '';
    const dateFromUrl = searchParams.get('date') || '';
    
    // If URL has no params (stadium selection step), clear all selections immediately
    if (!stadiumFromUrl && !dateFromUrl) {
      // Always clear when URL has no params (on stadium selection step)
      if (selectedStadium || selectedDate || bookingStep !== 'stadium') {
        setSelectedStadium('');
        setSelectedDate('');
        setSelectedZone('');
        setBookingStep('stadium');
      }
      return;
    }
    
    // Always sync step from URL first
    if (stepFromUrl !== bookingStep) {
      setBookingStep(stepFromUrl);
    }
    
    // Sync stadium from URL
    if (stadiumFromUrl && stadiumFromUrl !== selectedStadium) {
      setSelectedStadium(stadiumFromUrl);
    } else if (!stadiumFromUrl && selectedStadium) {
      // Clear stadium if URL doesn't have it but state does
      setSelectedStadium('');
    }
    
    // Sync date from URL
    if (dateFromUrl !== selectedDate) {
      if (dateFromUrl) {
        setSelectedDate(dateFromUrl);
        // Update calendar month if date is provided
        const [year, month, day] = dateFromUrl.split('-').map(Number);
        setBookingCalendarMonth(new Date(year, month - 1, day));
      } else {
        // Clear date if URL doesn't have it
        setSelectedDate('');
      }
    }
    
    // Clear selectedZone when going back to date selection (but not when on payment step)
    if (stepFromUrl === 'date' && selectedZone) {
      setSelectedZone('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]); // Use toString() to detect URL changes

  // Update URL when booking step changes (but don't override navigation)
  useEffect(() => {
    // Skip if we're updating URL from state (to prevent infinite loop)
    if (isUpdatingUrlFromState.current) {
      return;
    }
    
    const currentUrl = window.location.pathname + window.location.search;
    const stepFromUrl = searchParams.get('step') || 'stadium';
    const stadiumFromUrl = searchParams.get('stadium') || '';
    const dateFromUrl = searchParams.get('date') || '';
    
    // If URL already matches state, don't update (to avoid overriding navigation)
    if (bookingStep === 'stadium') {
      if (!stadiumFromUrl && !dateFromUrl) {
        // URL already matches - no need to update
        return;
      }
      // Clear URL params when going back to stadium selection
      const newUrl = '/booking';
      if (newUrl !== currentUrl) {
        isUpdatingUrlFromState.current = true;
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      // Build expected URL from current state
      const params = new URLSearchParams();
      if (selectedStadium) params.set('stadium', selectedStadium);
      if (selectedDate) params.set('date', selectedDate);
      params.set('step', bookingStep);
      
      const expectedUrl = `/booking${params.toString() ? `?${params.toString()}` : ''}`;
      
      // Only update if URL doesn't match expected state
      // Check if URL step matches bookingStep - if not, update
      if (expectedUrl !== currentUrl) {
        const urlMatchesState = (
          stepFromUrl === bookingStep &&
          (stadiumFromUrl || '') === (selectedStadium || '') &&
          (dateFromUrl || '') === (selectedDate || '')
        );
        
        // Only update if URL doesn't match state (but be careful not to override navigation)
        if (!urlMatchesState && stepFromUrl !== bookingStep) {
          // Only update if step is different (most important)
          isUpdatingUrlFromState.current = true;
          window.history.replaceState({}, '', expectedUrl);
        }
      }
    }
  }, [selectedStadium, selectedDate, bookingStep]);

  // Listen for email verification events from other tabs/windows
  useEffect(() => {
    // Listen to BroadcastChannel for cross-tab communication
    let channel;
    try {
      channel = new BroadcastChannel('email_verification');
      channel.onmessage = (event) => {
        if (event.data.type === 'email_verified' && event.data.action === 'redirect_to_home') {
          console.log('[BookingPage] Email verified in another tab, redirecting to home...');
          // Only redirect if we're not on the payment page (to avoid interrupting the user)
          if (bookingStep !== 'payment') {
            navigate('/', { replace: true });
          }
        }
      };
    } catch (e) {
      console.warn('[BookingPage] BroadcastChannel not supported');
    }
    
    // Fallback: Listen to localStorage events
    const handleStorageChange = (e) => {
      if (e.key === 'email_verification_redirect') {
        console.log('[BookingPage] Email verified in another tab (localStorage), redirecting to home...');
        if (bookingStep !== 'payment') {
          navigate('/', { replace: true });
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [bookingStep, navigate]);

  // Check if email is verified from EmailVerificationHandler redirect
  // This runs on mount and when URL step changes to 'payment'
  useEffect(() => {
    const stepFromUrl = searchParams.get('step');
    
    // Only process if step is 'payment' (from email verification redirect)
    if (stepFromUrl === 'payment') {
      const emailVerified = sessionStorage.getItem('emailVerified');
      const verifiedBookingData = sessionStorage.getItem('verifiedBookingData');
      
      if (emailVerified === 'true' && verifiedBookingData) {
        try {
          const bookingData = JSON.parse(verifiedBookingData);
          console.log('[BookingPage] Email verified via redirect, loading booking data and switching to payment step');
          
          // Set payment data and change step to payment immediately
          setPaymentData(bookingData);
          setBookingStep('payment');
          
          // Clear verifiedBookingData but keep emailVerified for PaymentQRPage to check
          sessionStorage.removeItem('verifiedBookingData');
        } catch (error) {
          console.error('[BookingPage] Error parsing verified booking data:', error);
        }
      } else if (!emailVerified || !verifiedBookingData) {
        // If step is payment but no verified data, user might have navigated directly
        // In this case, we should check if we have paymentData from previous session
        console.log('[BookingPage] Payment step but no verified data - checking existing paymentData');
      }
    }
  }, [searchParams]);
  
  // Also check on initial mount if we're on payment step (for direct navigation from email link)
  useEffect(() => {
    // Check if we're on payment step and have verified data
    const stepFromUrl = searchParams.get('step');
    if (stepFromUrl === 'payment') {
      const emailVerified = sessionStorage.getItem('emailVerified');
      const verifiedBookingData = sessionStorage.getItem('verifiedBookingData');
      
      if (emailVerified === 'true' && verifiedBookingData) {
        try {
          const bookingData = JSON.parse(verifiedBookingData);
          console.log('[BookingPage] Initial mount: Email verified, loading booking data and switching to payment');
          setPaymentData(bookingData);
          setBookingStep('payment');
          sessionStorage.removeItem('verifiedBookingData');
        } catch (error) {
          console.error('[BookingPage] Error parsing verified booking data on mount:', error);
        }
      }
    }
  }, []); // Only run once on mount

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
      const firstDashIndex = selectedZone.indexOf('-');
      const type = selectedZone.substring(0, firstDashIndex);
      const id = selectedZone.substring(firstDashIndex + 1);
      
      ticketId = id;
      ticketType = type;
      zone = null;
      
      const ticketConfig = ticketConfigs[selectedStadium];
      
      if (ticketConfig) {
        if (type === 'regular') {
          selectedTicketData = ticketConfig.regularTickets?.find(t => t.id === id);
        } else if (type === 'special') {
          selectedTicketData = ticketConfig.specialTickets?.find(t => t.id === id);
        }
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
      selectedZoneData = zones.find(z => z.id === selectedZone);
      
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

    // Change to email verification page immediately (optimistic update)
    setPaymentData(bookingData);
    setBookingStep('email_verification');
    
    // Scroll to top when navigating to email verification page
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 100);
    
    // Initialize booking and send verification email in background
    try {
      const response = await axios.post(`${API_URL}/bookings/init`, bookingData);
      
      if (response.data && response.data.success) {
        setVerificationId(response.data.verificationId);
        console.log('[BookingPage] Verification email sent successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to initialize booking');
      }
    } catch (error) {
      console.error('[BookingPage] Error initializing booking:', error);
      // Show error but keep user on verification page
      alert(
        language === 'th'
          ? error.response?.data?.message || 'ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่อีกครั้ง'
          : error.response?.data?.message || 'Failed to send verification email. Please try again.'
      );
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!paymentData) return;

    try {
      const response = await axios.post(`${API_URL}/bookings/init`, paymentData);
      
      if (response.data && response.data.success) {
        setVerificationId(response.data.verificationId);
        alert(
          language === 'th'
            ? 'ส่งอีเมลยืนยันสำเร็จ กรุณาตรวจสอบอีเมลของคุณ'
            : 'Verification email sent successfully. Please check your email.'
        );
      }
    } catch (error) {
      console.error('[BookingPage] Error resending email:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = (responseData) => {
    console.log('[BookingPage] Payment success! Opening success page in new window...', responseData);
    
    // เก็บข้อมูลใน sessionStorage สำหรับหน้า success
    sessionStorage.setItem('successPageData', JSON.stringify(responseData));
    sessionStorage.setItem('language', language);
    
    // เปิดหน้า success ในหน้าต่างใหม่
    const successWindow = window.open('/success', '_blank', 'width=1024,height=768');
    
    if (!successWindow) {
      // ถ้าเปิดหน้าใหม่ไม่ได้ (popup blocked) ให้แสดงใน tab ปัจจุบัน
      console.warn('[BookingPage] Popup blocked, showing success inline');
      setSuccessData(responseData);
      setBookingStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // แสดง success banner และ reset form
    handleBackToHome();
  };

  const handleBackToHome = () => {
    console.log('[BookingPage] Returning to home...');
    
    // Navigate back to home
    navigate('/');
    
    // Reset everything
    setSelectedStadium('');
    setSelectedDate('');
    setSelectedZone('');
    setBookingForm({ name: '', email: '', phone: '', quantity: 1 });
    setPaymentData(null);
    setSuccessData(null);
    setVerificationId(null);
    setBookingStep('stadium');
  };

  const handlePaymentBack = () => {
    // Go back to zone selection step (payment step in BookingSection)
    setBookingStep('payment');
    // Clear paymentData when going back
    setPaymentData(null);
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

  // Load all ticket configs for all stadiums
  useEffect(() => {
    const loadAllTicketConfigs = async () => {
      if (!stadiums || stadiums.length === 0) return;
      
      const configs = {};
      for (let i = 0; i < stadiums.length; i++) {
        const stadium = stadiums[i];
        try {
          const response = await axios.get(`${API_URL}/stadiums/${stadium.id}/tickets`);
          configs[stadium.id] = {
            ...response.data,
            regularTickets: (response.data.regularTickets || []).map(ticket => ({
              ...ticket,
              days: typeof ticket.days === 'string' ? (ticket.days ? JSON.parse(ticket.days) : null) : ticket.days
            }))
          };
          
          setTicketConfigs(prev => ({ ...prev, [stadium.id]: configs[stadium.id] }));
          
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
      setTimeout(() => {
        loadAllTicketConfigs();
      }, 500);
    }
  }, [stadiums]);

  // Set initial calendar month if date is provided
  useEffect(() => {
    if (initialDate) {
      const [year, month, day] = initialDate.split('-').map(Number);
      setBookingCalendarMonth(new Date(year, month - 1, day));
    }
  }, [initialDate]);

  // Scroll to top when navigating to email verification page
  useEffect(() => {
    if (bookingStep === 'email_verification') {
      // Scroll to top immediately
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Also scroll after a short delay to ensure it works
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 100);
    }
  }, [bookingStep]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <Header
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navigate={navigate}
      />
      
      {/* Add padding top to account for fixed header */}
      <div className="pt-20">

      {/* Success Page */}
      {bookingStep === 'success' && successData ? (
        <SuccessPage
          bookingData={successData}
          onBackToHome={handleBackToHome}
          language={language}
          t={t}
        />
      ) : /* Email Verification Page */
      bookingStep === 'email_verification' && paymentData ? (
        <EmailVerificationPage
          email={paymentData.email}
          verificationId={verificationId}
          onResend={handleResendVerificationEmail}
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
      ) : /* Booking Section */
      dbLoaded && stadiums.length > 0 ? (
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
          bookingBackground={bookingBackground}
          lightBackground={true}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      )}

      {/* Footer */}
      {dbLoaded && stadiums.length > 0 && (
        <Footer language={language} stadiums={stadiums} t={t} />
      )}
      </div>
    </div>
  );
};

export default BookingPage;
