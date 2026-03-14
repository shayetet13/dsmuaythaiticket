import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const EmailWarningModal = ({ onConfirm, onCancel, language }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl shadow-2xl max-w-lg w-full relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-black" />
            <h2 className="text-2xl font-black text-black uppercase">
              {language === 'th' ? 'ข้อความสำคัญ' : 'Important Notice'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-white font-semibold mb-3">
              {language === 'th' 
                ? '⚠️ ข้อความสำคัญ: กรุณาใช้ email จริงเพื่อทำการส่ง ticket'
                : '⚠️ Important: Please use a real email address to receive your ticket'}
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              {language === 'th' 
                ? 'หากใช้ email ที่ท่านไม่ได้ใช้ ทาง dsmuaythaiticket จะไม่รับผิดชอบใดๆทั้งสิ้น ไม่ว่าด้วยเหตุผลใดก็ตาม'
                : 'If you use an email address that you do not have access to, dsmuaythaiticket will not be responsible for any issues, for any reason whatsoever.'}
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300 text-sm">
              {language === 'th' 
                ? '• ตั๋วอิเล็กทรอนิกส์จะถูกส่งไปที่อีเมลที่คุณระบุ'
                : '• Your e-ticket will be sent to the email address you provided'}
            </p>
            <p className="text-gray-300 text-sm mt-2">
              {language === 'th' 
                ? '• กรุณาตรวจสอบให้แน่ใจว่าคุณสามารถเข้าถึงอีเมลนี้ได้'
                : '• Please make sure you can access this email address'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 rounded-b-xl flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black py-3 px-6 rounded-lg transition-colors uppercase tracking-wider"
          >
            {language === 'th' ? 'ยืนยัน' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailWarningModal;
