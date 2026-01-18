import React, { useState, useEffect } from 'react';
import { Lock, Save, Eye, EyeOff, QrCode, Upload, X } from 'lucide-react';
import { getAdminPassword, setAdminPassword } from './AdminLogin';
import { getPromptPayQr, updatePromptPayQr, getAllData } from '../db/imagesDb';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // PromptPay QR states
  const [promptPayQr, setPromptPayQr] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrMessage, setQrMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPromptPayQr();
  }, []);

  const loadPromptPayQr = async () => {
    try {
      const qr = await getPromptPayQr();
      if (qr) {
        setPromptPayQr(qr);
        setQrPreview(qr);
      }
    } catch (error) {
      console.error('Error loading PromptPay QR:', error);
    }
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.9) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setQrMessage({ type: 'error', text: 'ไฟล์ภาพใหญ่เกินไป (สูงสุด 10MB)' });
        setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
        return;
      }

      try {
        const compressedBase64 = await compressImage(file, 800, 800, 0.9);
        setQrPreview(compressedBase64);
        setQrMessage({ type: 'info', text: 'อัพโหลดภาพสำเร็จ (บีบอัดแล้ว) - กดบันทึกเพื่อยืนยัน' });
        setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error compressing QR image:', error);
        setQrMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอัพโหลดภาพ' });
        setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleQrSave = async () => {
    try {
      if (!qrPreview) {
        setQrMessage({ type: 'error', text: 'กรุณาอัพโหลดภาพ QR Code' });
        setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
        return;
      }

      const result = await updatePromptPayQr(qrPreview);
      if (result) {
        setPromptPayQr(qrPreview);
        setQrMessage({ type: 'success', text: 'บันทึก QR Code PromptPay สำเร็จ' });
        setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
      } else {
        setQrMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
        setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error saving QR:', error);
      setQrMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
      setTimeout(() => setQrMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleQrRemove = () => {
    setQrPreview(null);
    setPromptPayQr(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const correctPassword = getAdminPassword();

    // Validate current password
    if (currentPassword !== correctPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      return;
    }

    // Validate new password
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
      return;
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
      return;
    }

    // Update password
    setAdminPassword(newPassword);
    setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'password'
              ? 'text-yellow-500 border-b-2 border-yellow-500'
              : 'text-gray-400 hover:text-yellow-400'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          <span className="hidden sm:inline">เปลี่ยนรหัสผ่าน</span>
          <span className="sm:hidden">รหัสผ่าน</span>
        </button>
        <button
          onClick={() => setActiveTab('promptpay')}
          className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'promptpay'
              ? 'text-yellow-500 border-b-2 border-yellow-500'
              : 'text-gray-400 hover:text-yellow-400'
          }`}
        >
          <QrCode className="w-4 h-4 inline mr-2" />
          <span className="hidden sm:inline">QR Code PromptPay</span>
          <span className="sm:hidden">PromptPay</span>
        </button>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-8">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
            <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg flex-shrink-0">
              <Lock className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wider">
                เปลี่ยนรหัสผ่าน
              </h2>
              <p className="text-gray-400 text-xs md:text-sm mt-1">เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ Admin</p>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
              รหัสผ่านปัจจุบัน
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="กรอกรหัสผ่านใหม่"
                required
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                required
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-500 text-black font-black py-3 px-6 rounded-lg uppercase tracking-wider hover:bg-yellow-400 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
      )}

      {/* PromptPay QR Tab */}
      {activeTab === 'promptpay' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-8">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
            <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg flex-shrink-0">
              <QrCode className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wider">
                จัดการ QR Code PromptPay
              </h2>
              <p className="text-gray-400 text-xs md:text-sm mt-1">อัพโหลดและแก้ไข QR Code สำหรับการชำระเงินผ่าน PromptPay</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Current QR Code Display */}
            {qrPreview && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  QR Code PromptPay ปัจจุบัน
                </label>
                <div className="relative inline-block max-w-full">
                  <img
                    src={qrPreview}
                    alt="PromptPay QR Code"
                    className="max-w-xs w-full h-auto border-2 border-yellow-500 rounded-lg p-2 md:p-4 bg-white"
                  />
                  <button
                    onClick={handleQrRemove}
                    className="absolute top-1 right-1 md:top-2 md:right-2 p-1.5 md:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="ลบ QR Code"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload QR Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {qrPreview ? 'เปลี่ยน QR Code PromptPay' : 'อัพโหลด QR Code PromptPay'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
              />
              <p className="text-gray-500 text-xs mt-2">
                รองรับไฟล์ภาพ (JPG, PNG) ขนาดสูงสุด 10MB
              </p>
            </div>

            {/* Message */}
            {qrMessage.text && (
              <div
                className={`p-4 rounded-lg ${
                  qrMessage.type === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : qrMessage.type === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {qrMessage.text}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleQrSave}
              className="w-full bg-yellow-500 text-black font-black py-3 px-6 rounded-lg uppercase tracking-wider hover:bg-yellow-400 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              บันทึก QR Code PromptPay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

