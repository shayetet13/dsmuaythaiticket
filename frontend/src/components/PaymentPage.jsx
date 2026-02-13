import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock, QrCode, Upload, CheckCircle, XCircle, X } from 'lucide-react';
import axios from 'axios';
import { getAllData } from '../db/imagesDb';
import ConfirmationDialog from './ConfirmationDialog';
import { API_URL } from '../config/api.js';

const PaymentPage = ({
  bookingData,
  onBack,
  onPaymentSuccess,
  language,
  t
}) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [promptPayQr, setPromptPayQr] = useState(null);
  const [paymentTime, setPaymentTime] = useState('');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const paymentStartTime = useRef(new Date());

  useEffect(() => {
    // Load PromptPay QR code from database
    const loadPromptPayQr = async () => {
      try {
        const data = await getAllData();
        if (data && data.promptPayQr) {
          setPromptPayQr(data.promptPayQr);
        }
      } catch (error) {
        console.error('Error loading PromptPay QR:', error);
      }
    };
    loadPromptPayQr();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(language === 'th' ? 'ไฟล์ภาพใหญ่เกินไป (สูงสุด 10MB)' : 'File too large (max 10MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentSlip(reader.result);
        setPaymentSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyPayment = () => {
    if (!paymentTime || !paymentSlip) {
      alert(language === 'th' ? 'กรุณากรอกเวลาจ่ายและอัพโหลดสลิป' : 'Please enter payment time and upload slip');
      return;
    }

    // Parse payment time
    const [hours, minutes] = paymentTime.split(':').map(Number);
    
    // Use the date when confirm & pay was clicked (paymentStartTime)
    const paymentStartDate = new Date(paymentStartTime.current);
    const paymentDateTime = new Date(paymentStartDate);
    paymentDateTime.setHours(hours, minutes, 0, 0);

    // Get the date when confirm & pay was clicked (for comparison)
    const confirmPayDate = new Date(paymentStartTime.current);
    confirmPayDate.setHours(0, 0, 0, 0);
    const paymentDate = new Date(paymentDateTime);
    paymentDate.setHours(0, 0, 0, 0);

    // Calculate time difference in minutes from payment start time
    const timeDiff = (paymentDateTime - paymentStartTime.current) / (1000 * 60);

    // Verification checks
    const checks = {
      withinTimeLimit: timeDiff >= 0 && timeDiff <= 10,
      correctDate: paymentDate.getTime() === confirmPayDate.getTime(), // Payment date should match the date when confirm & pay was clicked
      hasSlip: !!paymentSlip
    };

    const allValid = Object.values(checks).every(v => v === true);

    setVerificationResult({
      valid: allValid,
      checks,
      timeDiff: timeDiff.toFixed(2),
      paymentDateTime: paymentDateTime.toISOString()
    });

    return allValid;
  };

  const handleConfirmPayment = async () => {
    if (!verifyPayment()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData = {
        ...bookingData,
        paymentStartTime: paymentStartTime.current.toISOString(),
        paymentTime: paymentTime,
        paymentSlip: paymentSlip,
        paymentDateTime: verificationResult.paymentDateTime,
        timeDiff: verificationResult.timeDiff
      };

      const response = await axios.post(`${API_URL}/bookings`, paymentData);
      
      if (response.data) {
        onPaymentSuccess(response.data);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(language === 'th' ? 'เกิดข้อผิดพลาดในการชำระเงิน' : 'Payment processing error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    onBack();
  };

  const selectedStadiumData = bookingData.stadiumData;
  const selectedZoneData = bookingData.zoneData;

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-800 min-h-screen" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
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

        {/* Booking Summary */}
        <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
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
              <p className="text-gray-400">{bookingData.ticketData ? (language === 'th' ? 'ตั๋ว' : 'Ticket') : (language === 'th' ? 'โซน' : 'Zone')}</p>
              <p className="text-white font-bold">{bookingData.ticketData?.name || selectedZoneData?.name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400">{language === 'th' ? 'จำนวน' : 'Quantity'}</p>
              <p className="text-white font-bold">{bookingData.quantity}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-400">{language === 'th' ? 'ราคารวม' : 'Total Price'}</p>
              <p className="text-2xl font-black text-yellow-500">฿{bookingData.totalPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="text-gray-400 text-sm mb-1">
                {language === 'th' ? 'เวลาที่เหลือ' : 'Time Remaining'}
              </p>
              <p className={`text-3xl font-black ${timeLeft <= 60 ? 'text-red-500' : 'text-yellow-500'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
          {timeLeft === 0 && (
            <p className="text-red-500 text-center mt-4 font-semibold">
              {language === 'th' ? 'หมดเวลาแล้ว กรุณาทำรายการใหม่' : 'Time expired. Please start a new booking.'}
            </p>
          )}
        </div>

        {/* PromptPay QR Code */}
        <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-yellow-500" />
            {language === 'th' ? 'QR Code PromptPay' : 'PromptPay QR Code'}
          </h3>
          {promptPayQr ? (
            <div className="flex justify-center">
              <img
                src={promptPayQr}
                alt="PromptPay QR Code"
                className="max-w-xs w-full h-auto border-2 border-yellow-500 rounded-lg p-4 bg-white"
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {language === 'th' ? 'ยังไม่มี QR Code PromptPay กรุณาติดต่อผู้ดูแลระบบ' : 'No PromptPay QR Code available. Please contact administrator.'}
            </div>
          )}
        </div>

        {/* Payment Time Input */}
        <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
          <label className="block text-lg font-bold text-white mb-3">
            {language === 'th' ? 'เวลาที่จ่ายเงิน' : 'Payment Time'}
          </label>
          <input
            type="time"
            value={paymentTime}
            onChange={(e) => setPaymentTime(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
            required
          />
          <p className="text-gray-400 text-sm mt-2">
            {language === 'th' ? 'กรุณากรอกเวลาที่ทำการจ่ายเงิน' : 'Please enter the time you made the payment'}
          </p>
        </div>

        {/* Payment Slip Upload */}
        <div className="mb-6 bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
          <label className="block text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {language === 'th' ? 'สลิปการจ่ายเงิน' : 'Payment Slip'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSlipUpload}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
          />
          {paymentSlipPreview && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">{language === 'th' ? 'ภาพสลิป' : 'Slip Preview'}</p>
              <img
                src={paymentSlipPreview}
                alt="Payment Slip"
                className="max-w-md w-full h-auto border border-gray-700 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mb-6 rounded-lg p-4 border-2 ${
            verificationResult.valid
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-red-500/20 border-red-500 text-red-400'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {verificationResult.valid ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-bold">
                {verificationResult.valid
                  ? (language === 'th' ? 'การตรวจสอบผ่าน' : 'Verification Passed')
                  : (language === 'th' ? 'การตรวจสอบไม่ผ่าน' : 'Verification Failed')}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                {language === 'th' ? 'ระยะเวลาจ่าย: ' : 'Payment Duration: '}
                {verificationResult.timeDiff} {language === 'th' ? 'นาที' : 'minutes'}
                {verificationResult.checks.withinTimeLimit ? ' ✓' : ' ✗'}
              </p>
              <p>
                {language === 'th' ? 'วันที่จ่ายถูกต้อง: ' : 'Correct Payment Date: '}
                {verificationResult.checks.correctDate ? '✓' : '✗'}
              </p>
              <p>
                {language === 'th' ? 'มีสลิปการจ่าย: ' : 'Has Payment Slip: '}
                {verificationResult.checks.hasSlip ? '✓' : '✗'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-700 text-white font-black text-lg sm:text-xl px-8 py-4 rounded-lg uppercase tracking-wider hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            {language === 'th' ? 'ยกเลิก' : 'CANCEL'}
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={!paymentTime || !paymentSlip || isSubmitting || timeLeft === 0}
            className="flex-1 bg-yellow-500 text-black font-black text-lg sm:text-xl px-8 py-4 rounded-lg uppercase tracking-wider hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? (language === 'th' ? 'กำลังยืนยัน...' : 'Confirming...')
              : (language === 'th' ? 'ยืนยันการชำระเงิน' : 'CONFIRM PAYMENT')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PaymentPage;

