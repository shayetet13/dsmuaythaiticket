import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import EmailWarningModal from './EmailWarningModal';

const EmailVerificationHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingData, setBookingData] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage(
        language === 'th'
          ? 'ไม่พบลิงก์ยืนยัน กรุณาติดต่อเจ้าหน้าที่'
          : 'Verification link not found. Please contact support.'
      );
      return;
    }

    // Remove token from URL immediately for security
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url);

    // Verify email
    verifyEmail(token);
  }, []);

  const verifyEmail = async (token) => {
    try {
      setStatus('verifying');

      // Send POST request with token in body (not query parameter)
      const response = await axios.post(`${API_URL}/verify-email`, {
        token: token
      });

      if (response.data && response.data.success) {
        setStatus('success');
        setBookingData(response.data.bookingData);
        
        // Show warning modal before redirecting
        setShowWarningModal(true);
      } else {
        throw new Error(response.data?.message || 'Verification failed');
      }
    } catch (error) {
      console.error('[EmailVerificationHandler] Verification error:', error);
      setStatus('error');

      // Handle specific error messages
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.response?.data?.error === 'Token expired') {
        setErrorMessage(
          language === 'th'
            ? 'ลิงก์ยืนยันหมดอายุ กรุณากรอกข้อมูลใหม่'
            : 'Verification link expired. Please fill in the form again.'
        );
      } else if (error.response?.data?.error === 'Token already used') {
        setErrorMessage(
          language === 'th'
            ? 'ลิงก์นี้ถูกใช้แล้ว กรุณาติดต่อเจ้าหน้าที่'
            : 'This link has already been used. Please contact support.'
        );
      } else if (error.response?.data?.error === 'Invalid token') {
        setErrorMessage(
          language === 'th'
            ? 'ลิงก์ยืนยันไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่'
            : 'Invalid verification link. Please contact support.'
        );
      } else {
        setErrorMessage(
          language === 'th'
            ? 'เกิดข้อผิดพลาดในการยืนยันอีเมล กรุณาลองใหม่อีกครั้ง'
            : 'An error occurred while verifying email. Please try again.'
        );
      }
    }
  };

  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    
    // Store booking data for payment page
    if (bookingData) {
      sessionStorage.setItem('verifiedBookingData', JSON.stringify(bookingData));
      sessionStorage.setItem('emailVerified', 'true');
      
      console.log('[EmailVerificationHandler] Storing verified booking data and redirecting...');
      
      // Notify other tabs/windows to redirect to home page
      try {
        // Use BroadcastChannel for cross-tab communication
        const channel = new BroadcastChannel('email_verification');
        channel.postMessage({
          type: 'email_verified',
          action: 'redirect_to_home'
        });
        channel.close();
      } catch (e) {
        console.warn('[EmailVerificationHandler] BroadcastChannel not supported, using localStorage fallback');
        // Fallback: use localStorage event
        localStorage.setItem('email_verification_redirect', Date.now().toString());
        localStorage.removeItem('email_verification_redirect');
      }
      
      // Redirect to booking page with payment step
      // Use replace to prevent going back to verification page
      navigate('/booking?step=payment', { 
        replace: true
      });
    } else {
      console.error('[EmailVerificationHandler] No booking data to store');
      // Fallback if no booking data
      navigate('/booking?step=payment', { replace: true });
    }
  };

  const handleWarningCancel = () => {
    setShowWarningModal(false);
    navigate('/');
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {language === 'th' ? 'กำลังยืนยันอีเมล...' : 'Verifying Email...'}
          </h2>
          <p className="text-gray-400">
            {language === 'th' 
              ? 'กรุณารอสักครู่'
              : 'Please wait'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 border-2 border-red-500 rounded-xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {language === 'th' ? 'ยืนยันอีเมลไม่สำเร็จ' : 'Verification Failed'}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {errorMessage}
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {language === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 border-2 border-green-500 rounded-xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {language === 'th' ? 'ยืนยันอีเมลสำเร็จ!' : 'Email Verified!'}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {language === 'th' 
              ? 'อีเมลของคุณได้รับการยืนยันแล้ว กำลังนำคุณไปยังหน้าชำระเงิน...'
              : 'Your email has been verified. Redirecting to payment page...'}
          </p>
        </div>
      </div>

      {showWarningModal && (
        <EmailWarningModal
          onConfirm={handleWarningConfirm}
          onCancel={handleWarningCancel}
          language={language}
        />
      )}
    </>
  );
};

export default EmailVerificationHandler;
