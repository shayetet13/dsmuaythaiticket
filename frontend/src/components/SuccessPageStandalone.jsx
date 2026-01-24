import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Ticket, Mail, Phone, User, CreditCard, Hash, Home, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import { formatDate, formatCurrency } from '../utils/formatHelpers';

const SuccessPageStandalone = () => {
  const [bookingData, setBookingData] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      // Get reference number from URL query parameter
      const ref = searchParams.get('ref');
      const savedLanguage = sessionStorage.getItem('language') || 'en';
      setLanguage(savedLanguage);

      if (ref) {
        // Load data from API using reference number
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/payments/reference/${ref}`);
          
          if (response.data && response.data.success && response.data.data) {
            const payment = response.data.data;
            
            // Parse booking_metadata to get full booking details
            let bookingMetadata = null;
            if (payment.booking_metadata) {
              try {
                bookingMetadata = JSON.parse(payment.booking_metadata);
              } catch (e) {
                console.warn('[SuccessPageStandalone] Error parsing booking_metadata:', e.message);
              }
            }
            
            // Get booking data from database
            const bookingResponse = await axios.get(`${API_URL}/bookings`);
            const bookings = bookingResponse.data || [];
            const booking = bookings.find(b => b.ticket_number === ref || b.payment_reference_no === ref);
            
            // Get stadium name from metadata or database
            let stadiumName = 'N/A';
            let ticketName = 'N/A';
            let zoneName = 'N/A';
            
            if (bookingMetadata) {
              // Get stadium name from metadata
              if (bookingMetadata.stadiumData?.name) {
                stadiumName = bookingMetadata.stadiumData.name;
              } else if (bookingMetadata.stadium) {
                stadiumName = bookingMetadata.stadium;
              }
              
              // Get ticket name from metadata
              if (bookingMetadata.ticketData?.name) {
                ticketName = bookingMetadata.ticketData.name;
              } else if (bookingMetadata.ticketName) {
                ticketName = bookingMetadata.ticketName;
              }
              
              // Get zone name from metadata
              if (bookingMetadata.zoneData?.name) {
                zoneName = bookingMetadata.zoneData.name;
              } else if (bookingMetadata.zoneName) {
                zoneName = bookingMetadata.zoneName;
              }
            }
            
            // Fallback to booking record if metadata not available
            if (stadiumName === 'N/A' && booking?.stadium) {
              stadiumName = booking.stadium;
            }
            if (ticketName === 'N/A' && booking?.ticket_name) {
              ticketName = booking.ticket_name;
            }
            if (zoneName === 'N/A' && booking?.zone_name) {
              zoneName = booking.zone_name;
            }
            
            // Get date
            const date = bookingMetadata?.date || bookingMetadata?.dateDisplay || payment.date || booking?.date || 'N/A';
            
            // Get quantity
            const quantity = bookingMetadata?.quantity || booking?.quantity || payment.quantity || 1;
            
            // Format booking data for display
            console.log('[SuccessPageStandalone] Payment data:', payment);
            console.log('[SuccessPageStandalone] Payment ID:', payment.id);
            console.log('[SuccessPageStandalone] Payment order_no:', payment.order_no);
            
            const formattedData = {
              stadium: stadiumName,
              date: date,
              ticketName: ticketName,
              zoneName: zoneName,
              quantity: quantity,
              totalPrice: payment.amount || booking?.total_price || 0,
              referenceNo: ref,
              orderNo: payment.id ? String(payment.id).padStart(6, '0') : (payment.order_no || 'N/A'), // ใช้ ID แทน order_no และ format เป็น 000001
              customerName: payment.customer_name || booking?.name || 'N/A',
              customerEmail: payment.customer_email || booking?.email || 'N/A',
              customerPhone: payment.customer_phone || booking?.phone || 'N/A'
            };
            
            setBookingData(formattedData);
            console.log('[SuccessPageStandalone] Loaded booking data from API:', formattedData);
            console.log('[SuccessPageStandalone] Order Number (formatted):', formattedData.orderNo);
          }
        } catch (error) {
          console.error('[SuccessPageStandalone] Error loading data from API:', error);
          // Fallback to sessionStorage
          const savedData = sessionStorage.getItem('successPageData');
          if (savedData) {
            try {
              const data = JSON.parse(savedData);
              setBookingData(data);
            } catch (e) {
              console.error('[SuccessPageStandalone] Error parsing sessionStorage data:', e);
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Load data from sessionStorage first (primary source)
        const savedData = sessionStorage.getItem('successPageData');
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setBookingData(data);
            console.log('[SuccessPageStandalone] Loaded booking data from sessionStorage:', data);
            setLoading(false);
          } catch (error) {
            console.error('[SuccessPageStandalone] Error parsing booking data:', error);
            setLoading(false);
          }
        } else {
          console.warn('[SuccessPageStandalone] No booking data found in sessionStorage');
          setLoading(false);
        }
      }
    };

    loadData();
  }, [searchParams]);

  const handleBackToHome = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('successPageData');
    
    // Navigate to home page (don't try to close window)
    navigate('/');
  };


  const t = language === 'th' ? {
    title: 'ชำระเงินสำเร็จ!',
    subtitle: 'ขอบคุณที่เลือกใช้บริการ ตั๋วของคุณถูกจองเรียบร้อยแล้ว',
    bookingDetails: 'รายละเอียดการจอง',
    referenceNumber: 'หมายเลขการจอง',
    stadium: 'สนามมวย',
    date: 'วันที่',
    event: 'การแข่งขัน',
    ticketType: 'ประเภทตั๋ว',
    quantity: 'จำนวน',
    seats: 'ที่นั่ง',
    totalPaid: 'ยอดชำระทั้งหมด',
    customerInfo: 'ข้อมูลผู้จอง',
    name: 'ชื่อ',
    email: 'อีเมล',
    phone: 'เบอร์โทร',
    importantInfo: 'ข้อมูลสำคัญ',
    info1: 'ตั๋วอิเล็กทรอนิกส์ได้ถูกส่งไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam/Junk folder)',
    info2: 'กรุณานำตั๋วอิเล็กทรอนิกส์หรือหมายเลขการจองมาแสดงที่ประตูทางเข้าสนามมวย',
    info3: 'ควรมาถึงสนามก่อนเวลาเริ่มการแข่งขันอย่างน้อย 30 นาที เพื่อเข้าชมได้อย่างสะดวก',
    info4: 'กรุณาเก็บหมายเลขการจองนี้ไว้เพื่อใช้อ้างอิงในกรณีมีปัญหา',
    needHelp: 'ต้องการความช่วยเหลือ?',
    contactUs: 'หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราได้ที่:',
    backToHome: 'กลับหน้าหลัก',
    printTicket: '🖨️ พิมพ์ตั๋ว',
    footer: 'ขอบคุณที่ใช้บริการ เจอกันที่สนามมวย! 🥊',
    closeWindow: 'ปิดหน้าต่าง'
  } : {
    title: 'Payment Successful!',
    subtitle: 'Thank you for your booking. Your tickets have been confirmed.',
    bookingDetails: 'Booking Details',
    referenceNumber: 'Reference Number',
    stadium: 'Stadium',
    date: 'Date',
    event: 'Event',
    ticketType: 'Ticket Type',
    quantity: 'Quantity',
    seats: 'Ticket(s)',
    totalPaid: 'Total Paid',
    customerInfo: 'Customer Information',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    importantInfo: 'Important Information',
    info1: 'Your e-ticket has been sent to your email address. Please check your inbox (including Spam/Junk folder)',
    info2: 'Please present your e-ticket or booking reference number at the stadium entrance',
    info3: 'Please arrive at least 30 minutes before the event starts for smooth entry',
    info4: 'Please keep this reference number for any inquiries',
    needHelp: 'Need Help?',
    contactUs: 'If you have any questions or need assistance, please contact us at:',
    backToHome: 'Back to Home',
    printTicket: '🖨️ Print Ticket',
    footer: 'Thank you for your booking. See you at the stadium! 🥊',
    closeWindow: 'Close Window'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mb-4 mx-auto"></div>
          <p className="text-white text-lg">{language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl text-white mb-4">{language === 'th' ? 'ไม่พบข้อมูลการจอง' : 'No Booking Data Found'}</h1>
          <button
            onClick={handleBackToHome}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Close Button (Top Right) */}
        <button
          onClick={handleBackToHome}
          className="fixed top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-all"
          title={t.closeWindow}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Success Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce-once shadow-2xl">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 uppercase tracking-tight">
            {t.title}
          </h1>
          
          <p className="text-xl text-gray-300">
            {t.subtitle}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl shadow-2xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <h2 className="text-2xl font-black text-black uppercase">
              {t.bookingDetails}
            </h2>
          </div>

          {/* Booking Info */}
          <div className="p-6 space-y-6">
            {/* Reference Number */}
            <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Hash className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">
                    {t.referenceNumber}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-yellow-500 tracking-wider break-all">
                    {bookingData?.paymentData?.reference_no || bookingData?.referenceNo || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stadium */}
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {t.stadium}
                </p>
                <p className="text-xl font-bold text-white break-words">
                  {bookingData?.stadium || bookingData?.stadiumData?.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start space-x-4">
              <Calendar className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {t.date}
                </p>
                <p className="text-xl font-bold text-white">
                  {formatDate(bookingData?.date, language) || bookingData?.dateDisplay || 'N/A'}
                </p>
              </div>
            </div>

            {/* Event Name (if available) */}
            {bookingData?.eventName && (
              <div className="flex items-start space-x-4">
                <Ticket className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">
                    {t.event}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {bookingData.eventName}
                  </p>
                </div>
              </div>
            )}

            {/* Ticket Zone/Type */}
            <div className="flex items-start space-x-4">
              <Ticket className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {t.ticketType}
                </p>
                <p className="text-xl font-bold text-white break-words">
                  {bookingData?.ticketData?.name || bookingData?.ticketName || bookingData?.zoneData?.name || bookingData?.zoneName || bookingData?.zone || 'Standard'}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-start space-x-4">
              <Hash className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {t.quantity}
                </p>
                <p className="text-xl font-bold text-white">
                  {bookingData?.quantity || 1} {t.seats}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-4"></div>

            {/* Total Price */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <p className="text-lg font-semibold text-gray-300">
                    {t.totalPaid}
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-yellow-500">
                  {formatCurrency(bookingData?.totalPrice || bookingData?.amount || 0, language)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gray-900 px-6 py-3 border-b border-gray-700">
            <h3 className="text-lg font-bold text-yellow-500 uppercase">
              {t.customerInfo}
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Name */}
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{t.name}</p>
                <p className="text-base font-semibold text-white">{bookingData?.customerName || bookingData?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{t.email}</p>
                <p className="text-base font-semibold text-white break-all">{bookingData?.customerEmail || bookingData?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Phone */}
            {(bookingData?.customerPhone || bookingData?.phone) && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{t.phone}</p>
                  <p className="text-base font-semibold text-white">{bookingData?.customerPhone || bookingData?.phone}</p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-700 my-4"></div>

            {/* Reference Number */}
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{language === 'th' ? 'หมายเลขอ้างอิง' : 'Reference Number'}</p>
                <p className="text-base font-mono font-semibold text-white break-all">{bookingData?.referenceNo || 'N/A'}</p>
              </div>
            </div>

            {/* Order Number */}
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{language === 'th' ? 'หมายเลขคำสั่งซื้อ' : 'Order Number'}</p>
                <p className="text-base font-mono font-semibold text-yellow-500">{bookingData?.orderNo || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3">
            📧 {t.importantInfo}
          </h3>
          <ul className="space-y-2 text-sm sm:text-base text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>{t.info1}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>{t.info2}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>{t.info3}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>{t.info4}</span>
            </li>
          </ul>
        </div>

        {/* Support Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-base font-bold text-gray-300 mb-3">
            💬 {t.needHelp}
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            {t.contactUs}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              📧 Email: <a href="mailto:dsmuaythaiticket@gmail.com" className="text-yellow-500 hover:text-yellow-400 hover:underline transition-colors">
                dsmuaythaiticket@gmail.com
              </a>
            </p>
            <p className="text-sm text-gray-300">
              🌐 Website: <a href={import.meta.env.VITE_FRONTEND_URL || 'https://dsmuaythaiticket.com'} className="text-yellow-500 hover:text-yellow-400 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
                {import.meta.env.VITE_FRONTEND_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'dsmuaythaiticket.com'}
              </a>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBackToHome}
            className="flex-1 flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-lg py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Home className="w-6 h-6" />
            <span>{t.backToHome}</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-300 border border-gray-600"
          >
            {t.printTicket}
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 animate-fade-in-delay">
          <p className="text-sm text-gray-500">
            {t.footer}
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes bounce-once {
          0%, 100% { 
            transform: translateY(0) scale(1); 
          }
          25% { 
            transform: translateY(-20px) scale(1.1); 
          }
          50% { 
            transform: translateY(0) scale(1); 
          }
          75% { 
            transform: translateY(-10px) scale(1.05); 
          }
        }
        
        @keyframes fade-in-delay {
          0% { opacity: 0; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-bounce-once {
          animation: bounce-once 1.2s ease-in-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 2s ease-out;
        }
        
        @media print {
          /* ตั้งค่าหน้ากระดาษ A4 */
          @page {
            size: A4;
            margin: 10mm;
          }
          
          /* ซ่อนปุ่มและ fixed elements */
          button {
            display: none !important;
          }
          .fixed {
            position: static !important;
          }
          
          /* ซ่อน sections ที่ไม่จำเป็น */
          .bg-blue-900\\/20,
          .bg-gray-800\\/50 {
            display: none !important;
          }
          
          /* ปรับขนาด container ให้พอดีกับ A4 */
          .max-w-3xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
          }
          
          /* ปรับขนาด header */
          .text-4xl,
          .text-5xl {
            font-size: 1.5rem !important;
          }
          
          .text-xl {
            font-size: 0.875rem !important;
          }
          
          .text-2xl {
            font-size: 1rem !important;
          }
          
          .text-3xl {
            font-size: 1.25rem !important;
          }
          
          /* ลด padding และ margin */
          .p-6 {
            padding: 0.75rem !important;
          }
          
          .py-12,
          .py-16 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          
          .mb-8 {
            margin-bottom: 1rem !important;
          }
          
          .mb-6 {
            margin-bottom: 0.5rem !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 0.5rem !important;
          }
          
          .space-y-4 > * + * {
            margin-top: 0.375rem !important;
          }
          
          /* ป้องกันการแบ่งหน้า */
          .bg-gray-800,
          .bg-gray-900,
          .rounded-xl {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* ลดขนาด icons */
          .w-24,
          .h-24 {
            width: 3rem !important;
            height: 3rem !important;
          }
          
          .w-16,
          .h-16 {
            width: 2rem !important;
            height: 2rem !important;
          }
          
          .w-6,
          .h-6 {
            width: 1rem !important;
            height: 1rem !important;
          }
          
          /* ลายน้ำ - Watermark */
          body::before {
            content: "DSMuayThaiTicket.com";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 4rem;
            font-weight: bold;
            color: rgba(234, 179, 8, 0.08);
            z-index: 9999;
            pointer-events: none;
            white-space: nowrap;
            letter-spacing: 0.05em;
          }
          
          /* เพิ่มลายน้ำซ้ำเพื่อความชัดเจน */
          .min-h-screen::after {
            content: "DSMuayThaiTicket.com";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 3.5rem;
            font-weight: 800;
            color: rgba(234, 179, 8, 0.06);
            z-index: 9998;
            pointer-events: none;
            white-space: nowrap;
            letter-spacing: 0.1em;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessPageStandalone;

