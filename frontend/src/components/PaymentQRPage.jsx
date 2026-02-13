import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, QrCode, RefreshCw, CheckCircle, AlertCircle, X, Home, Download, CreditCard } from 'lucide-react';
import axios from 'axios';
import ConfirmationDialog from './ConfirmationDialog';
import EmailWarningModal from './EmailWarningModal';
import { API_URL } from '../config/api.js';

const PaymentQRPage = ({
  bookingData,
  onBack,
  onPaymentSuccess,
  language,
  t
}) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [completedPayment, setCompletedPayment] = useState(null); // Store completed payment data
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [customerInfo, setCustomerInfo] = useState({
    name: bookingData.name || '',
    email: bookingData.email || '',
    phone: bookingData.phone || ''
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [showRefreshLimitDialog, setShowRefreshLimitDialog] = useState(false);
  const [showTicketSoldOutDialog, setShowTicketSoldOutDialog] = useState(false);
  const [showRefundDisclaimerModal, setShowRefundDisclaimerModal] = useState(false);
  const [showEmailWarningModal, setShowEmailWarningModal] = useState(false);
  const [isCheckingTicket, setIsCheckingTicket] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'qr' or 'credit'
  const [emailVerified, setEmailVerified] = useState(false);
  const timerRef = useRef(null);
  const statusCheckRef = useRef(null);
  const successSectionRef = useRef(null);

  // Check if email is verified
  useEffect(() => {
    const verified = sessionStorage.getItem('emailVerified') === 'true';
    setEmailVerified(verified);
    
    // If email is not verified and we're on payment page, show warning modal
    // But only show once when component mounts, not every time
    if (!verified && !showQRCode) {
      // Don't show immediately - wait for user to try to generate QR code
      // The modal will be shown when handleGenerateQR is called
    }
  }, []);

  // Check if customer info already exists (from BookingSection flow)
  useEffect(() => {
    if (bookingData.name && bookingData.email && bookingData.phone) {
      // Customer info already filled, pre-populate the form
      setCustomerInfo({
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone
      });
      // But still require user to click "GENERATE QR CODE" button
    }
  }, []); // Only run once on mount

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!paymentData) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPaymentStatus('expired');
          // Show expired dialog when time runs out
          setShowExpiredDialog(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentData]);

  // Check payment status periodically (every 2 seconds for faster response)
  useEffect(() => {
    if (!paymentData || paymentStatus !== 'pending') return;

    statusCheckRef.current = setInterval(async () => {
      await checkPaymentStatus();
    }, 2000);

    return () => {
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, [paymentData, paymentStatus]);

  // Scroll to success section when payment is successful
  useEffect(() => {
    if (paymentStatus === 'paid' && successSectionRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        successSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [paymentStatus]);

  // Scroll to success section when payment is successful
  useEffect(() => {
    if (paymentStatus === 'paid' && successSectionRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        const element = successSectionRef.current;
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset from top

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  }, [paymentStatus]);

  /**
   * Check if selected ticket is still available
   */
  const checkTicketAvailability = async () => {
    if (!bookingData.stadium || !bookingData.date) {
      return false;
    }

    try {
      const response = await axios.get(`${API_URL}/tickets/available`, {
        params: {
          stadiumId: bookingData.stadium,
          date: bookingData.date
        }
      });

      if (response.data.success) {
        // If using ticket system (ticketId exists)
        if (bookingData.ticketId && bookingData.ticketType) {
          const availableTickets = bookingData.ticketType === 'regular'
            ? response.data.regularTickets || []
            : response.data.specialTickets || [];

          // Check if the selected ticket still exists and has available quantity
          const selectedTicket = availableTickets.find(t => t.id === bookingData.ticketId);
          if (!selectedTicket || selectedTicket.availableQuantity < bookingData.quantity) {
            return false;
          }
        } else {
          // Legacy zone system - check if any tickets are available
          const regularTickets = response.data.regularTickets || [];
          const specialTickets = response.data.specialTickets || [];
          const hasAnyTickets = regularTickets.length > 0 || specialTickets.length > 0;
          if (!hasAnyTickets) {
            return false;
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking ticket availability:', error);
      return false;
    }
  };

  /**
   * Handle Generate QR Code button click
   */
  const handleGenerateQR = async () => {
    console.log('=== handleGenerateQR clicked ===');
    console.log('customerInfo:', customerInfo);
    console.log('bookingData.totalPrice:', bookingData.totalPrice);

    // Check if email is verified
    if (!emailVerified) {
      setShowEmailWarningModal(true);
      return;
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      console.error('Validation failed:', customerInfo);
      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }

    // Check ticket availability before generating QR code
    setIsCheckingTicket(true);
    const isAvailable = await checkTicketAvailability();
    setIsCheckingTicket(false);

    if (!isAvailable) {
      setShowTicketSoldOutDialog(true);
      return;
    }

    // Show refund disclaimer modal first
    setShowRefundDisclaimerModal(true);
  };

  const handleEmailWarningConfirm = () => {
    setShowEmailWarningModal(false);
    setEmailVerified(true);
    sessionStorage.setItem('emailVerified', 'true');
    
    // If user was trying to pay, continue with selected method
    if (customerInfo.name && customerInfo.email && customerInfo.phone) {
      setTimeout(() => {
        if (paymentMethod === 'qr') {
          handleGenerateQR();
        } else if (paymentMethod === 'credit') {
          setShowRefundDisclaimerModal(true);
        }
      }, 100);
    }
  };

  const handleEmailWarningCancel = () => {
    setShowEmailWarningModal(false);
    if (onBack) {
      onBack();
    } else {
      navigate('/booking');
    }
  };

  /**
   * Handle confirm after reading refund disclaimer
   * Supports both QR Code and Credit Card (Stripe) payment methods
   */
  const handleConfirmRefundDisclaimer = async () => {
    setShowRefundDisclaimerModal(false);
    
    // Double check email verification before proceeding
    if (!emailVerified) {
      setShowEmailWarningModal(true);
      return;
    }
    
    console.log('Validation passed, payment method:', paymentMethod);
    
    if (paymentMethod === 'credit') {
      // Credit Card: Create Stripe Checkout and redirect
      await createStripeCheckout();
    } else {
      // QR Code: Create payment and show QR
      setShowQRCode(true);
      createPayment();
    }
  };

  /**
   * Create payment and generate QR code
   */
  const createPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Merge customer info with booking data
      const completeBookingData = {
        ...bookingData,
        ...customerInfo
      };

      console.log('Creating payment with data:', completeBookingData);

      const response = await axios.post(`${API_URL}/payments/create`, completeBookingData);

      if (response.data && response.data.success) {
        const { payment, qrCode, expireDate, orderNo, referenceNo } = response.data.data;

        console.log('[PaymentQR] Payment created - ID:', payment.id, 'Order No:', orderNo, 'Full payment:', payment);

        setPaymentData({
          id: payment.id,
          orderNo,
          referenceNo,
          expireDate,
          amount: payment.amount
        });

        setQrCodeImage(qrCode);

        // Calculate time left from expire date
        const expireTime = new Date(expireDate).getTime();
        const currentTime = new Date().getTime();
        const secondsLeft = Math.floor((expireTime - currentTime) / 1000);
        setTimeLeft(Math.max(0, Math.min(600, secondsLeft)));

        // Reset refresh count for new QR code
        setRefreshCount(0);

        setIsLoading(false);
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to generate QR code');
      setIsLoading(false);
    }
  };

  /**
   * Create Stripe Checkout for credit card payment
   * Uses same booking amount as QR Code - pulls totalPrice from selected ticket
   */
  const createStripeCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const completeBookingData = {
        ...bookingData,
        ...customerInfo
      };

      console.log('[PaymentQR] Creating Stripe checkout with amount:', bookingData.totalPrice);

      const response = await axios.post(`${API_URL}/payments/create-stripe-checkout`, completeBookingData);

      if (response.data && response.data.success && response.data.data?.checkoutUrl) {
        // Store success page data for when user returns (webhook will create booking)
        const successPageData = {
          stadium: bookingData.stadiumData?.name || 'N/A',
          stadiumData: bookingData.stadiumData,
          date: bookingData.dateDisplay || bookingData.date || 'N/A',
          dateDisplay: bookingData.dateDisplay,
          ticketName: bookingData.ticketData?.name || 'N/A',
          ticketData: bookingData.ticketData,
          zoneName: bookingData.zoneData?.name || 'N/A',
          zoneData: bookingData.zoneData,
          quantity: bookingData.quantity || 1,
          totalPrice: bookingData.totalPrice || 0,
          referenceNo: response.data.data.referenceNo,
          orderNo: 'N/A',
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone
        };
        sessionStorage.setItem('successPageData', JSON.stringify(successPageData));
        sessionStorage.setItem('language', language);

        // Redirect to Stripe Checkout
        window.location.href = response.data.data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout');
      }
    } catch (error) {
      console.error('Error creating Stripe checkout:', error);
      setError(error.response?.data?.message || error.message || (language === 'th' ? 'ไม่สามารถเปิดหน้าชำระเงินได้' : 'Failed to open payment page'));
      setIsLoading(false);
    }
  };

  /**
   * Refresh QR code (generate new one)
   */
  const handleRefreshQR = async () => {
    if (!paymentData || isRefreshing) return;

    // Check refresh count limit
    const newRefreshCount = refreshCount + 1;
    if (newRefreshCount > 3) {
      setShowRefreshLimitDialog(true);
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/payments/${paymentData.referenceNo}/refresh`
      );

      if (response.data && response.data.success) {
        const { payment, qrCode, expireDate, orderNo, referenceNo } = response.data.data;

        setPaymentData({
          id: payment.id,
          orderNo,
          referenceNo,
          expireDate,
          amount: payment.amount
        });

        setQrCodeImage(qrCode);

        // Reset timer
        const expireTime = new Date(expireDate).getTime();
        const currentTime = new Date().getTime();
        const secondsLeft = Math.floor((expireTime - currentTime) / 1000);
        setTimeLeft(Math.max(0, Math.min(600, secondsLeft)));

        setPaymentStatus('pending');
        setRefreshCount(newRefreshCount);
        setIsRefreshing(false);
      } else {
        throw new Error('Failed to refresh QR code');
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      setError(error.response?.data?.message || error.message || 'Failed to refresh QR code');
      setIsRefreshing(false);
    }
  };

  /**
   * Send email confirmation
   */
  // ลบฟังก์ชันนี้ออก - ให้ webhook ส่ง email แทน
  // const sendEmailConfirmation = async () => {
  //   try {
  //     console.log('[PaymentQR] Sending email confirmation...');
  //
  //     const emailData = {
  //       customerName: customerInfo.name,
  //       customerEmail: customerInfo.email,
  //       customerPhone: customerInfo.phone,
  //       stadiumName: bookingData.stadiumData?.name || 'N/A',
  //       date: bookingData.dateDisplay || bookingData.date,
  //       ticketName: bookingData.ticketData?.name,
  //       zoneName: bookingData.zoneData?.name,
  //       quantity: bookingData.quantity,
  //       totalPrice: bookingData.totalPrice,
  //       referenceNo: paymentData.referenceNo,
  //       orderNo: paymentData.orderNo
  //     };
  //
  //     await axios.post(`${API_URL}/payments/send-confirmation`, emailData);
  //     console.log('[PaymentQR] Email confirmation sent successfully!');
  //   } catch (error) {
  //     console.error('[PaymentQR] Error sending email confirmation:', error);
  //     // Don't block user flow if email fails
  //   }
  // };

  /**
   * Check payment status
   */
  const checkPaymentStatus = async () => {
    if (!paymentData) return;

    try {
      console.log('[PaymentQR] Checking payment status for:', paymentData.referenceNo);

      const response = await axios.get(
        `${API_URL}/payments/reference/${paymentData.referenceNo}`
      );

      console.log('[PaymentQR] Payment status response:', response.data);

      if (response.data && response.data.success) {
        const payment = response.data.data;
        const status = payment.status || response.data.status;

        console.log('[PaymentQR] Current status:', status);

        if (status === 'paid' || status === 'completed') {
          console.log('[PaymentQR] Payment successful! Redirecting to success page...');
          setPaymentStatus('paid');
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          if (timerRef.current) clearInterval(timerRef.current);

          // Store completed payment data for later use
          setCompletedPayment(payment);

          // Store booking data in sessionStorage for success page
          const successPageData = {
            stadium: bookingData.stadiumData?.name || payment.stadium_name || 'N/A',
            stadiumData: bookingData.stadiumData,
            date: bookingData.dateDisplay || bookingData.date || payment.date || 'N/A',
            dateDisplay: bookingData.dateDisplay,
            ticketName: bookingData.ticketData?.name || payment.ticket_name || 'N/A',
            ticketData: bookingData.ticketData,
            zoneName: bookingData.zoneData?.name || payment.zone_name || 'N/A',
            zoneData: bookingData.zoneData,
            quantity: bookingData.quantity || payment.quantity || 1,
            totalPrice: bookingData.totalPrice || payment.amount || 0,
            referenceNo: paymentData.referenceNo,
            orderNo: payment.id ? String(payment.id).padStart(6, '0') : 'N/A', // ใช้ ID แทน order_no และ format เป็น 000001
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone
          };
          
          console.log('[PaymentQR] Storing success page data:', successPageData);
          sessionStorage.setItem('successPageData', JSON.stringify(successPageData));
          sessionStorage.setItem('language', language);

          // ไม่ส่ง email จาก frontend - ให้ webhook ส่งเท่านั้น
          // sendEmailConfirmation(); // ลบออก เพราะ webhook จะส่งให้

          // Redirect to success page in the same window (not opening new window)
          setTimeout(() => {
            navigate(`/success?ref=${paymentData.referenceNo}`);
          }, 1000); // Small delay to ensure data is stored
        } else if (status === 'expired' || status === 'cancelled') {
          console.log('[PaymentQR] Payment', status);
          setPaymentStatus(status);
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
        }
      }
    } catch (error) {
      console.error('[PaymentQR] Error checking payment status:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    onBack();
  };

  const handleBackToCalendar = () => {
    // Reset states and go back to booking calendar
    setShowExpiredDialog(false);
    setShowRefreshLimitDialog(false);
    setShowTicketSoldOutDialog(false);
    setRefreshCount(0);
    onBack();
  };

  const handleBackToHome = () => {
    // Reset states and navigate to home page
    setShowExpiredDialog(false);
    setShowRefreshLimitDialog(false);
    setShowTicketSoldOutDialog(false);
    setRefreshCount(0);
    navigate('/');
  };

  /**
   * Download QR code image
   */
  const handleDownloadQRCode = async () => {
    if (!qrCodeImage) return;

    try {
      // If qrCodeImage is a base64 string, convert it to blob
      let blob;
      if (qrCodeImage.startsWith('data:image')) {
        // Base64 image
        const response = await fetch(qrCodeImage);
        blob = await response.blob();
      } else {
        // URL - fetch the image
        const response = await fetch(qrCodeImage);
        blob = await response.blob();
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with reference number if available
      const filename = paymentData?.referenceNo 
        ? `qr-code-${paymentData.referenceNo}.png`
        : `qr-code-${Date.now()}.png`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert(language === 'th' 
        ? 'เกิดข้อผิดพลาดในการดาวน์โหลด QR Code' 
        : 'Failed to download QR Code');
    }
  };

  const selectedStadiumData = bookingData.stadiumData;
  const selectedZoneData = bookingData.zoneData;
  const selectedTicketData = bookingData.ticketData;

  // Debug: Log booking data and button state
  const isButtonDisabled = !customerInfo.name || !customerInfo.email || !customerInfo.phone;

  console.log('PaymentQRPage received bookingData:', {
    totalPrice: bookingData.totalPrice,
    quantity: bookingData.quantity,
    ticketData: bookingData.ticketData,
    zoneData: bookingData.zoneData,
    stadiumData: bookingData.stadiumData,
    name: bookingData.name,
    email: bookingData.email,
    phone: bookingData.phone
  });

  console.log('Button state:', {
    customerInfo,
    isButtonDisabled,
    showQRCode,
    isLoading
  });

  return (
    <section
      id="payment"
      className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black min-h-screen"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title={language === 'th' ? 'ยืนยันการยกเลิก' : 'Confirm Cancellation'}
        message={language === 'th' ? 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการชำระเงิน?' : 'Are you sure you want to cancel the payment?'}
        confirmText={language === 'th' ? 'ใช่' : 'YES'}
        cancelText={language === 'th' ? 'ไม่ใช่' : 'NO'}
        language={language}
      />

      {/* Expired Time Dialog */}
      {showExpiredDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white uppercase mb-2">
                  {language === 'th' ? 'หมดเวลา' : 'Time Expired'}
                </h3>
                <p className="text-gray-300">
                  {language === 'th'
                    ? 'คุณไม่ได้ทำตามเวลาที่กำหนดกรุณาทำรายการใหม่อีกครั้ง'
                    : 'You did not complete within the time limit. Please make a new transaction.'}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleBackToCalendar}
                className="bg-yellow-500 text-black font-black py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider"
              >
                {language === 'th' ? 'ย้อนกลับไปหน้าปฏิทิน' : 'BACK TO CALENDAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Limit Dialog */}
      {showRefreshLimitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white uppercase mb-2">
                  {language === 'th' ? 'เกินจำนวนครั้งที่กำหนด' : 'Refresh Limit Exceeded'}
                </h3>
                <p className="text-gray-300">
                  {language === 'th'
                    ? 'คุณได้กด refresh เกินกำหนด กรุณาทำรายใหม่อีกครั้ง'
                    : 'You have exceeded the refresh limit. Please make a new transaction.'}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleBackToHome}
                className="bg-yellow-500 text-black font-black py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider"
              >
                {language === 'th' ? 'กลับหน้าหลัก' : 'BACK TO HOME'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Sold Out Dialog */}
      {showTicketSoldOutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white uppercase mb-2">
                  {language === 'th' ? 'ตั๋วหมดแล้ว' : 'Ticket Sold Out'}
                </h3>
                <p className="text-gray-300">
                  {language === 'th'
                    ? 'ขณะนี้ตั๋วหมดแล้ว กรุณาเลือกตั๋วอื่น และทำรายการใหม่'
                    : 'Tickets are now sold out. Please select another ticket and make a new transaction.'}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleBackToCalendar}
                className="bg-yellow-500 text-black font-black py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider"
              >
                {language === 'th' ? 'ย้อนกลับไปเลือกตั๋ว' : 'BACK TO SELECT TICKET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Disclaimer Modal */}
      {showRefundDisclaimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-gray-900 border-2 border-red-500 rounded-xl p-6 sm:p-8 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-red-500/30">
              <div className="p-3 bg-red-500/20 rounded-full flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black text-red-400 uppercase tracking-wide mb-2">
                  {language === 'th' ? 'ข้อกำหนดการคืนเงิน' : 'Refund Disclaimer'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {language === 'th'
                    ? 'กรุณาอ่านข้อกำหนดการคืนเงินก่อนดำเนินการต่อ'
                    : 'Please read the refund policy before proceeding'}
                </p>
              </div>
              <button
                onClick={() => setShowRefundDisclaimerModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Single Language Based on Selection */}
            <div className="mb-8">
              <div className="bg-gray-800/50 rounded-lg p-5 sm:p-6 border border-gray-700">
                <div className="text-gray-300 text-sm sm:text-base space-y-4 leading-relaxed">
                  {language === 'th' ? (
                    <>
                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>
                          การซื้อบัตรทุกกรณีถือเป็นที่สิ้นสุด ไม่สามารถขอคืนเงินได้ เว้นแต่กรณีที่กิจกรรมถูกยกเลิกหรือเลื่อนการจัดงาน
                        </span>
                      </p>

                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>
                          ค่าธรรมเนียมการดำเนินการและค่าบริการต่าง ๆ ไม่สามารถขอคืนเงินได้ในทุกกรณี
                        </span>
                      </p>

                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>
                          ในกรณีที่กิจกรรมถูกยกเลิก จะคืนเงินเฉพาะมูลค่าบัตรเข้าชมเท่านั้น
                        </span>
                      </p>

                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>
                          หากกิจกรรมถูกเลื่อนออกไป และผู้จัดงานตัดสินใจเปิดให้มีการคืนเงิน จะคืนเงินเฉพาะราคาบัตรเข้าชมเท่านั้น
                        </span>
                      </p>

                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>
                          ในกรณีอื่น ๆ ทั้งหมด บัตรเข้าชมไม่สามารถขอคืนเงินได้ เว้นแต่จะได้รับอนุญาตจากผู้จัดงานโดยตรง
                        </span>
                      </p>

                    </>
                  ) : (
                    <>
                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>All sales are final. Tickets are non-refundable except in the event of cancellation or postponement of the event.</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>Processing fees and service charges are strictly non-refundable under all circumstances.</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>In the event of cancellation, only the face value of the ticket will be eligible for a refund.</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>If the event is postponed and the organizer elects to offer a refund, only the ticket price will be refunded.</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span>In all other cases, tickets are non-refundable unless explicitly authorized by the event organizer.</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-red-500/30">
              <button
                onClick={() => setShowRefundDisclaimerModal(false)}
                className="bg-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors uppercase tracking-wider"
              >
                {language === 'th' ? 'ยกเลิก' : 'CANCEL'}
              </button>
              <button
                onClick={handleConfirmRefundDisclaimer}
                className="bg-red-600 text-white font-black px-8 py-3 rounded-lg hover:bg-red-700 transition-colors uppercase tracking-wider shadow-lg hover:shadow-xl"
              >
                {language === 'th' ? 'ยืนยันและดำเนินการต่อ' : 'CONFIRM & CONTINUE'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackClick}
            className="flex items-center text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">{language === 'th' ? 'กลับ' : 'BACK'}</span>
          </button>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-yellow-500 uppercase">
            {language === 'th' ? 'ชำระเงิน' : 'PAYMENT'}
          </h2>
          <div className="w-24"></div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mb-4"></div>
            <p className="text-white text-lg">
              {paymentMethod === 'credit'
                ? (language === 'th' ? 'กำลังเปิดหน้าชำระเงินบัตรเครดิต...' : 'Opening credit card payment...')
                : (language === 'th' ? 'กำลังสร้าง QR Code...' : 'Generating QR Code...')}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-red-500">
                {language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error'}
              </h3>
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={createPayment}
              className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {language === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Payment Success State */}
        {paymentStatus === 'paid' && (
          <div ref={successSectionRef} className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-6">
              <div className="flex flex-col items-center gap-3 mb-4">
                <CheckCircle className="w-20 h-20 text-green-500" />
                <h3 className="text-2xl font-bold text-green-500">
                  {language === 'th' ? 'ชำระเงินสำเร็จ!' : 'Payment Successful!'}
                </h3>
                <p className="text-green-400 text-center">
                  {language === 'th' ? 'ระบบได้ส่ง email ยืนยันไปที่อีเมลของคุณแล้ว' : 'Email confirmation has been sent'}
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-gray-900 rounded-lg p-6 border-2 border-yellow-500">
              <h3 className="text-xl font-bold text-yellow-500 mb-4 uppercase">
                {language === 'th' ? '🎫 รายละเอียดการจอง' : '🎫 Booking Details'}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">{language === 'th' ? 'สนามมวย' : 'Stadium'}</p>
                    <p className="text-white font-bold">{selectedStadiumData?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{language === 'th' ? 'วันที่' : 'Date'}</p>
                    <p className="text-white font-bold">{bookingData.dateDisplay || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">
                      {selectedTicketData ? (language === 'th' ? 'ตั๋ว' : 'Ticket') : (language === 'th' ? 'โซน' : 'Zone')}
                    </p>
                    <p className="text-white font-bold">
                      {selectedTicketData?.name || selectedZoneData?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{language === 'th' ? 'จำนวน' : 'Quantity'}</p>
                    <p className="text-white font-bold">{bookingData.quantity || 1}</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-gray-400 text-sm">{language === 'th' ? 'ราคารวม' : 'Total Price'}</p>
                  <p className="text-3xl font-black text-yellow-500">
                    ฿{typeof bookingData.totalPrice === 'number'
                      ? bookingData.totalPrice.toLocaleString()
                      : '0'}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-gray-400 text-xs">{language === 'th' ? 'หมายเลขอ้างอิง' : 'Reference No'}</p>
                    <p className="text-white font-mono font-bold text-lg">{paymentData?.referenceNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">{language === 'th' ? 'หมายเลขคำสั่งซื้อ' : 'Order No'}</p>
                    <p className="text-white font-mono font-bold text-lg">{paymentData?.id ? String(paymentData.id).padStart(6, '0') : paymentData?.orderNo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">
                {language === 'th' ? '👤 ข้อมูลผู้ซื้อ' : '👤 Customer Information'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === 'th' ? 'ชื่อ' : 'Name'}:</span>
                  <span className="text-white font-bold">{customerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === 'th' ? 'อีเมล' : 'Email'}:</span>
                  <span className="text-white font-bold">{customerInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === 'th' ? 'เบอร์โทร' : 'Phone'}:</span>
                  <span className="text-white font-bold">{customerInfo.phone}</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-400 text-sm text-center">
                {language === 'th'
                  ? '📧 กรุณาตรวจสอบอีเมลของคุณสำหรับรายละเอียดเพิ่มเติม'
                  : '📧 Please check your email for further details'}
              </p>
            </div>

            {/* Back to Home Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  // Notify parent component to navigate back to home
                  onPaymentSuccess({
                    ...bookingData,
                    paymentData: completedPayment || paymentData
                  });
                }}
                className="flex items-center gap-3 bg-yellow-500 text-black font-black text-lg px-8 py-4 rounded-lg uppercase tracking-wider hover:bg-yellow-400 transition-colors shadow-lg"
              >
                <Home className="w-6 h-6" />
                {language === 'th' ? 'กลับหน้าหลัก' : 'BACK TO HOME'}
              </button>
            </div>
          </div>
        )}

        {/* Customer Information Form (if not yet filled) */}
        {!showQRCode && !isLoading && (
          <>
            {/* Booking Summary */}
            <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-yellow-500">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                {language === 'th' ? 'สรุปการจอง' : 'Booking Summary'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">{language === 'th' ? 'สนามมวย' : 'Stadium'}</p>
                  <p className="text-white font-bold">{selectedStadiumData?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">{language === 'th' ? 'วันที่' : 'Date'}</p>
                  <p className="text-white font-bold">{bookingData.dateDisplay || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">
                    {selectedTicketData ? (language === 'th' ? 'ตั๋ว' : 'Ticket') : (language === 'th' ? 'โซน' : 'Zone')}
                  </p>
                  <p className="text-white font-bold">
                    {selectedTicketData?.name || selectedZoneData?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{language === 'th' ? 'จำนวน' : 'Quantity'}</p>
                  <p className="text-white font-bold">{bookingData.quantity || 1}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400">{language === 'th' ? 'ราคารวม' : 'Total Price'}</p>
                  <p className="text-2xl font-black text-yellow-500">
                    ฿{typeof bookingData.totalPrice === 'number'
                      ? bookingData.totalPrice.toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-yellow-500">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                {language === 'th' ? 'ข้อมูลผู้ซื้อ' : 'Customer Information'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder={language === 'th' ? 'กรอกชื่อ-นามสกุล' : 'Enter your full name'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {language === 'th' ? 'อีเมล' : 'Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder={language === 'th' ? 'กรอกอีเมล' : 'Enter your email'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder={language === 'th' ? 'กรอกเบอร์โทรศัพท์' : 'Enter your phone number'}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-yellow-500">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                {language === 'th' ? 'เลือกวิธีการชำระเงิน' : 'Select Payment Method'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* QR Code Payment Option */}
                <button
                  onClick={() => {
                    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
                      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
                      return;
                    }
                    
                    // Check email verification first
                    const verified = sessionStorage.getItem('emailVerified') === 'true';
                    if (!verified) {
                      setShowEmailWarningModal(true);
                      // Store that user wants to generate QR after confirming
                      setPaymentMethod('qr');
                      return;
                    }
                    
                    setPaymentMethod('qr');
                    handleGenerateQR();
                  }}
                  disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || isCheckingTicket}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-yellow-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <QrCode className={`w-12 h-12 ${paymentMethod === 'qr' ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <p className={`font-bold text-lg ${paymentMethod === 'qr' ? 'text-yellow-500' : 'text-white'}`}>
                        {language === 'th' ? 'QR Code' : 'QR Code'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {language === 'th' ? 'สแกนเพื่อชำระเงิน' : 'Scan to pay'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Credit Card Payment Option - Stripe Checkout with ticket amount */}
                <button
                  onClick={() => {
                    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
                      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
                      return;
                    }
                    const verified = sessionStorage.getItem('emailVerified') === 'true';
                    if (!verified) {
                      setShowEmailWarningModal(true);
                      setPaymentMethod('credit');
                      return;
                    }
                    setPaymentMethod('credit');
                    setShowRefundDisclaimerModal(true);
                  }}
                  disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || isCheckingTicket}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    paymentMethod === 'credit'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-blue-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <CreditCard className={`w-12 h-12 ${paymentMethod === 'credit' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <p className={`font-bold text-lg ${paymentMethod === 'credit' ? 'text-blue-500' : 'text-white'}`}>
                        {language === 'th' ? 'เครดิตการ์ด' : 'Credit Card'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {language === 'th' ? 'ชำระด้วยบัตร' : 'Pay with card'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Back Button - Moved to bottom */}
            <div className="flex justify-center">
              <button
                onClick={handleBackClick}
                className="bg-gray-700 text-white font-black text-lg px-8 py-4 rounded-lg uppercase tracking-wider hover:bg-gray-600 transition-colors"
              >
                {language === 'th' ? 'ย้อนกลับ' : 'BACK'}
              </button>
            </div>
          </>
        )}

        {/* Main Content - QR Code Display */}
        {/* Only show QR code if email is verified */}
        {!isLoading && !error && paymentStatus === 'pending' && showQRCode && emailVerified && (
          <>
            {/* Booking Summary */}
            <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-yellow-500">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                {language === 'th' ? 'สรุปการจอง' : 'Booking Summary'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">{language === 'th' ? 'สนามมวย' : 'Stadium'}</p>
                  <p className="text-white font-bold">{selectedStadiumData?.name}</p>
                </div>
                <div>
                  <p className="text-gray-400">{language === 'th' ? 'วันที่' : 'Date'}</p>
                  <p className="text-white font-bold">{bookingData.dateDisplay}</p>
                </div>
                <div>
                  <p className="text-gray-400">
                    {bookingData.ticketData ? (language === 'th' ? 'ตั๋ว' : 'Ticket') : (language === 'th' ? 'โซน' : 'Zone')}
                  </p>
                  <p className="text-white font-bold">
                    {bookingData.ticketData?.name || selectedZoneData?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{language === 'th' ? 'จำนวน' : 'Quantity'}</p>
                  <p className="text-white font-bold">{bookingData.quantity}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400">{language === 'th' ? 'ราคารวม' : 'Total Price'}</p>
                  <p className="text-2xl font-black text-yellow-500">
                    ฿{bookingData.totalPrice.toLocaleString()}
                  </p>
                </div>
                {paymentData && (
                  <>
                    <div>
                      <p className="text-gray-400">{language === 'th' ? 'หมายเลขอ้างอิง' : 'Reference No'}</p>
                      <p className="text-white font-mono text-lg">{paymentData.referenceNo}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">{language === 'th' ? 'หมายเลขคำสั่งซื้อ' : 'Order No'}</p>
                      <p className="text-white font-mono text-lg">{paymentData.id ? String(paymentData.id).padStart(6, '0') : paymentData.orderNo}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border-2 border-yellow-500">
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-gray-400 text-sm mb-1 text-center">
                    {language === 'th' ? 'เวลาที่เหลือ' : 'Time Remaining'}
                  </p>
                  <p className={`text-4xl font-black text-center ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-yellow-500'
                    }`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
              {timeLeft === 0 && (
                <p className="text-red-500 text-center mt-4 font-semibold">
                  {language === 'th' ? 'QR Code หมดอายุแล้ว กรุณารีเฟรช QR Code' : 'QR Code expired. Please refresh.'}
                </p>
              )}
            </div>

            {/* QR Code Display */}
            <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border-2 border-yellow-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-yellow-500" />
                  {language === 'th' ? 'สแกน QR Code เพื่อชำระเงิน' : 'Scan QR Code to Pay'}
                </h3>
                <button
                  onClick={handleRefreshQR}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing
                    ? (language === 'th' ? 'กำลังรีเฟรช...' : 'Refreshing...')
                    : (language === 'th' ? 'รีเฟรช' : 'Refresh')
                  }
                </button>
              </div>

              {qrCodeImage ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border-4 border-yellow-500 shadow-lg">
                    <img
                      src={qrCodeImage}
                      alt="QR Code for Muay Thai ticket payment - Scan to complete your booking"
                      className="w-64 h-64 sm:w-80 sm:h-80"
                    />
                  </div>
                  {/* Download QR Code Button */}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleDownloadQRCode}
                      className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-400 transition-colors shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      {language === 'th' ? 'ดาวน์โหลด QR Code' : 'Download QR Code'}
                    </button>
                  </div>
                  {/* PaySolutions Logo */}
                  <div className="mt-4 flex justify-center">
                    <a
                      href="https://www.paysolutions.asia"
                      target="_blank"
                      rel="www.paysolutions.asia"
                      className="inline-block"
                    >
                      <img
                        src="https://s3-payso-images.s3.ap-southeast-1.amazonaws.com/image-logocode/Internet-4.png"
                        alt="PaySolutions payment gateway - Secure payment processing for Muay Thai tickets"
                        className="h-auto max-w-full scale-50"
                      />
                    </a>
                  </div>
                  <p className="text-gray-400 text-sm mt-4 text-center max-w-md">
                    {language === 'th'
                      ? 'กรุณาสแกน QR Code ด้วยแอพธนาคารของคุณเพื่อชำระเงิน ระบบจะตรวจสอบการชำระเงินอัตโนมัติ'
                      : 'Please scan the QR Code with your banking app to complete payment. The system will automatically verify your payment.'
                    }
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {language === 'th' ? 'ไม่สามารถโหลด QR Code ได้' : 'Unable to load QR Code'}
                </div>
              )}
            </div>

            {/* Payment Instructions */}
            <div className="mb-6 bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {language === 'th' ? 'คำแนะนำ' : 'Instructions'}
              </h4>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>{language === 'th' ? 'สแกน QR Code ด้วยแอพธนาคารของคุณ' : 'Scan QR Code with your banking app'}</li>
                <li>{language === 'th' ? 'ตรวจสอบยอดเงินให้ถูกต้อง' : 'Verify the amount is correct'}</li>
                <li>{language === 'th' ? 'ทำรายการภายใน 10 นาที' : 'Complete within 10 minutes'}</li>
                <li>{language === 'th' ? 'ระบบจะตรวจสอบอัตโนมัติ' : 'System will verify automatically'}</li>
              </ul>
            </div>

            {/* Auto Checking Status Message */}
            <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-green-400 font-bold">
                    {language === 'th' ? '🔄 ระบบกำลังตรวจสอบการชำระเงินอัตโนมัติ' : '🔄 Automatically Checking Payment Status'}
                  </p>
                  <p className="text-green-300 text-sm">
                    {language === 'th'
                      ? 'เมื่อโอนเงินเสร็จ ระบบจะอัพเดทสถานะโดยอัตโนมัติภายใน 5-10 วินาที'
                      : 'After payment, status will update automatically within 5-10 seconds'}
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={handleBackClick}
                className="bg-gray-700 text-white font-black text-lg px-8 py-4 rounded-lg uppercase tracking-wider hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                {language === 'th' ? 'ย้อนกลับ' : 'BACK'}
              </button>
            </div>
          </>
        )}

        {/* Expired State */}
        {paymentStatus === 'expired' && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <h3 className="text-xl font-bold text-red-500">
                {language === 'th' ? 'QR Code หมดอายุ' : 'QR Code Expired'}
              </h3>
              <button
                onClick={handleRefreshQR}
                disabled={isRefreshing}
                className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
              >
                {isRefreshing
                  ? (language === 'th' ? 'กำลังสร้าง QR Code ใหม่...' : 'Generating new QR Code...')
                  : (language === 'th' ? 'สร้าง QR Code ใหม่' : 'Generate New QR Code')
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Warning Modal - Show before QR code */}
      {showEmailWarningModal && (
        <EmailWarningModal
          onConfirm={handleEmailWarningConfirm}
          onCancel={handleEmailWarningCancel}
          language={language}
        />
      )}
    </section>
  );
};

export default PaymentQRPage;

