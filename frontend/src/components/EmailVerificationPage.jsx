import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api.js';

const EmailVerificationPage = ({ email, verificationId, onResend, language, t }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);
  const pageRef = useRef(null);

  // Scroll to top when component mounts
  useEffect(() => {
    // Scroll to top of page immediately
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Also scroll the container to top if it exists
    if (pageRef.current) {
      pageRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    
    // Additional scroll after a short delay to ensure it works
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (pageRef.current) {
        pageRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }, 100);
  }, []);

  const handleResend = async () => {
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      if (onResend) {
        await onResend();
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (error) {
      console.error('[EmailVerificationPage] Error resending email:', error);
      setResendError(
        language === 'th'
          ? 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง'
          : 'Failed to resend email. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 shadow-2xl">
            <Mail className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-4 uppercase tracking-tight">
            {language === 'th' ? 'กรุณาตรวจสอบอีเมลของคุณ' : 'Please Check Your Email'}
          </h1>
          
          <p className="text-xl text-gray-300">
            {language === 'th' 
              ? 'เราได้ส่งลิงก์ยืนยันอีเมลไปที่'
              : 'We have sent a verification link to'}
          </p>
        </div>

        {/* Email Display Card */}
        <div className="bg-gray-800 border-2 border-blue-500 rounded-xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-2xl font-black text-white uppercase">
              {language === 'th' ? 'อีเมลของคุณ' : 'Your Email'}
            </h2>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-900 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">
                    {language === 'th' ? 'อีเมล' : 'Email Address'}
                  </p>
                  <p className="text-xl font-bold text-white break-all">
                    {email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 mb-4">
              {language === 'th' ? '📧 ขั้นตอนการยืนยัน' : '📧 Verification Steps'}
            </h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 font-bold">1.</span>
                <span>
                  {language === 'th' 
                    ? 'เปิดกล่องจดหมายของคุณ (รวมถึงโฟลเดอร์ Spam/Junk)'
                    : 'Open your email inbox (including Spam/Junk folder)'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 font-bold">2.</span>
                <span>
                  {language === 'th' 
                    ? 'ค้นหาอีเมลจาก DS Muay Thai Tickets'
                    : 'Look for an email from DS Muay Thai Tickets'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 font-bold">3.</span>
                <span>
                  {language === 'th' 
                    ? 'คลิกปุ่ม "ยืนยันอีเมล" ในอีเมล'
                    : 'Click the "Verify Email" button in the email'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 font-bold">4.</span>
                <span>
                  {language === 'th' 
                    ? 'คุณจะถูกนำไปยังหน้าชำระเงินอัตโนมัติ'
                    : 'You will be automatically redirected to the payment page'}
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">
                {language === 'th' ? '⚠️ ข้อความสำคัญ' : '⚠️ Important'}
              </h3>
              <p className="text-sm text-gray-300">
                {language === 'th' 
                  ? 'ลิงก์ยืนยันจะหมดอายุใน 30 นาที กรุณายืนยันอีเมลโดยเร็ว'
                  : 'The verification link will expire in 30 minutes. Please verify your email soon.'}
              </p>
            </div>
          </div>
        </div>

        {/* Resend Button */}
        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-lg py-4 px-8 rounded-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{language === 'th' ? 'กำลังส่ง...' : 'Sending...'}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>{language === 'th' ? 'ส่งอีเมลอีกครั้ง' : 'Resend Email'}</span>
              </>
            )}
          </button>

          {resendSuccess && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {language === 'th' ? 'ส่งอีเมลสำเร็จ!' : 'Email sent successfully!'}
              </span>
            </div>
          )}

          {resendError && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">{resendError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
