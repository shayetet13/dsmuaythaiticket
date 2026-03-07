import React from 'react';
import { CheckCircle, Calendar, MapPin, Ticket, Mail, Phone, User, CreditCard, Hash, Home } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatHelpers';

const SuccessPage = ({ bookingData, onBackToHome, language, t }) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce-once shadow-2xl">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 uppercase tracking-tight">
            {language === 'th' ? 'ชำระเงินสำเร็จ!' : 'Payment Successful!'}
          </h1>
          
          <p className="text-xl text-gray-300">
            {language === 'th' 
              ? 'ขอบคุณที่เลือกใช้บริการ ตั๋วของคุณถูกจองเรียบร้อยแล้ว'
              : 'Thank you for your booking. Your tickets have been confirmed.'}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl shadow-2xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <h2 className="text-2xl font-black text-black uppercase">
              {language === 'th' ? 'รายละเอียดการจอง' : 'Booking Details'}
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
                    {language === 'th' ? 'หมายเลขการจอง' : 'Reference Number'}
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
                  {language === 'th' ? 'สนามมวย' : 'Stadium'}
                </p>
                <p className="text-xl font-bold text-white">
                  {bookingData?.stadiumData?.name || bookingData?.stadium || 'N/A'}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start space-x-4">
              <Calendar className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {language === 'th' ? 'วันที่' : 'Date'}
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
                    {language === 'th' ? 'การแข่งขัน' : 'Event'}
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
                  {language === 'th' ? 'ประเภทตั๋ว' : 'Ticket Type'}
                </p>
                <p className="text-xl font-bold text-white">
                  {bookingData?.ticketData?.name || bookingData?.zoneData?.name || bookingData?.zone || 'Standard'}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-start space-x-4">
              <Hash className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">
                  {language === 'th' ? 'จำนวน' : 'Quantity'}
                </p>
                <p className="text-xl font-bold text-white">
                  {bookingData?.quantity || 1} {language === 'th' ? 'ที่นั่ง' : 'Ticket(s)'}
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
                    {language === 'th' ? 'ยอดชำระทั้งหมด' : 'Total Paid'}
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
              {language === 'th' ? 'ข้อมูลผู้จอง' : 'Customer Information'}
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Name */}
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{language === 'th' ? 'ชื่อ' : 'Name'}</p>
                <p className="text-base font-semibold text-white">{bookingData?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{language === 'th' ? 'อีเมล' : 'Email'}</p>
                <p className="text-base font-semibold text-white break-all">{bookingData?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Phone */}
            {bookingData?.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{language === 'th' ? 'เบอร์โทร' : 'Phone'}</p>
                  <p className="text-base font-semibold text-white">{bookingData.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3">
            📧 {language === 'th' ? 'ข้อมูลสำคัญ' : 'Important Information'}
          </h3>
          <ul className="space-y-2 text-sm sm:text-base text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>
                {language === 'th' 
                  ? 'ตั๋วอิเล็กทรอนิกส์ได้ถูกส่งไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam/Junk folder)'
                  : 'Your e-ticket has been sent to your email address. Please check your inbox (including Spam/Junk folder)'}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>
                {language === 'th' 
                  ? 'กรุณานำตั๋วอิเล็กทรอนิกส์หรือหมายเลขการจองมาแสดงที่ประตูทางเข้าสนามมวย'
                  : 'Please present your e-ticket or booking reference number at the stadium entrance'}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>
                {language === 'th' 
                  ? 'ควรมาถึงสนามก่อนเวลาเริ่มการแข่งขันอย่างน้อย 30 นาที เพื่อเข้าชมได้อย่างสะดวก'
                  : 'Please arrive at least 30 minutes before the event starts for smooth entry'}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
              <span>
                {language === 'th' 
                  ? 'กรุณาเก็บหมายเลขการจองนี้ไว้เพื่อใช้อ้างอิงในกรณีมีปัญหา'
                  : 'Please keep this reference number for any inquiries'}
              </span>
            </li>
          </ul>
        </div>

        {/* Support Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-base font-bold text-gray-300 mb-3">
            {language === 'th' ? '💬 ต้องการความช่วยเหลือ?' : '💬 Need Help?'}
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            {language === 'th' 
              ? 'หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราได้ที่:'
              : 'If you have any questions or need assistance, please contact us at:'}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              📧 Email: <a href="mailto:dsmuaythaiticket@gmail.com" className="text-yellow-500 hover:text-yellow-400 hover:underline transition-colors">
                dsmuaythaiticket@gmail.com
              </a>
            </p>
            <p className="text-sm text-gray-300">
              🌐 Website: <a href={import.meta.env.VITE_FRONTEND_URL || 'https://dsmuaythaiticket.com'} className="text-yellow-500 hover:text-yellow-400 hover:underline transition-colors">
                {import.meta.env.VITE_FRONTEND_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'dsmuaythaiticket.com'}
              </a>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onBackToHome}
            className="flex-1 flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-lg py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Home className="w-6 h-6" />
            <span>{language === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-300 border border-gray-600"
          >
            {language === 'th' ? '🖨️ พิมพ์ตั๋ว' : '🖨️ Print Ticket'}
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 animate-fade-in-delay">
          <p className="text-sm text-gray-500">
            {language === 'th' 
              ? 'ขอบคุณที่ใช้บริการ เจอกันที่สนามมวย! 🥊'
              : 'Thank you for your booking. See you at the stadium! 🥊'}
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default SuccessPage;

