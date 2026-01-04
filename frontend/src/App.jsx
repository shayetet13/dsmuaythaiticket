import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

// Constants & Utils
import { translations } from './constants/translations';
import { getZones } from './constants/zones';

// Hooks
import { useDatabase } from './hooks/useDatabase';

// Components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import HighlightsSection from './components/HighlightsSection';
import UpcomingFightsSection from './components/UpcomingFightsSection';
import BookingSection from './components/BookingSection';
import PaymentPage from './components/PaymentPage';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

const API_URL = 'http://localhost:5000/api';

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
  const [ticketConfigs, setTicketConfigs] = useState({});

  // Load data from database
  const { heroImage, highlights, stadiums, weeklyFights, stadiumImageSchedules, specialMatches, dbLoaded } = useDatabase(language);

  // Translations and zones
  const t = translations[language];
  const zones = getZones(t);

  // Calculate total price based on selected ticket or zone
  const calculateTotalPrice = () => {
    if (!selectedStadium || !selectedZone) return 0;
    
    // Check if using ticket system (format: "type-ticketId")
    if (selectedZone.includes('-')) {
      const ticketConfig = ticketConfigs[selectedStadium];
      if (!ticketConfig) return 0;
      
      const [type, ticketId] = selectedZone.split('-');
      let ticket = null;
      
      if (type === 'regular') {
        ticket = ticketConfig.regularTickets?.find(t => t.id === ticketId);
      } else if (type === 'special') {
        ticket = ticketConfig.specialTickets?.find(t => t.id === ticketId);
      }
      
      if (ticket && ticket.price) {
        return parseFloat(ticket.price) * bookingForm.quantity;
      }
    } else {
      // Legacy zone system
      const selectedZoneData = zones.find(z => z.id === selectedZone);
      if (selectedZoneData) {
        return selectedZoneData.price * bookingForm.quantity;
      }
    }
    
    return 0;
  };
  
  const totalPrice = calculateTotalPrice();

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
      const [type, id] = selectedZone.split('-');
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
    } else {
      // Legacy zone system
      selectedZoneData = zones.find(z => z.id === selectedZone);
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

    setPaymentData(bookingData);
    setBookingStep('payment');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePaymentSuccess = (responseData) => {
    setBookingSuccess(true);
    
    // Reset form and go back to stadium selection
    setSelectedStadium('');
    setSelectedDate('');
    setSelectedZone('');
    setBookingForm({ name: '', email: '', phone: '', quantity: 1 });
    setPaymentData(null);
    setBookingStep('stadium');

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
        setTicketConfigs(prev => ({
          ...prev,
          [stadiumId]: response.data
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

      {/* Hero Section */}
      <HeroSection heroImage={heroImage} t={t} />

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

      {/* Upcoming Fights Section */}
      <UpcomingFightsSection
        weeklyFights={weeklyFights}
        language={language}
        stadiums={stadiums}
        t={t}
        ticketConfigs={ticketConfigs}
        stadiumImageSchedules={stadiumImageSchedules}
        specialMatches={specialMatches}
        setSelectedStadium={setSelectedStadium}
        setSelectedDate={setSelectedDate}
        setBookingStep={setBookingStep}
        setBookingCalendarMonth={setBookingCalendarMonth}
      />

      {/* Payment Page */}
      {bookingStep === 'payment' && paymentData ? (
        <PaymentPage
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
        />
      )}

      {/* About Section */}
      <AboutSection t={t} />

      {/* Contact Section */}
      <ContactSection t={t} />

      {/* Footer */}
      <Footer language={language} stadiums={stadiums} t={t} />
    </div>
  );
};

export default App;
