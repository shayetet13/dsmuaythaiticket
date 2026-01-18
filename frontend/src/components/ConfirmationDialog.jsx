import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  language = 'en'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-yellow-500/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-white uppercase mb-2">
              {title || (language === 'th' ? 'ยืนยันการยกเลิก' : 'Confirm Cancellation')}
            </h3>
            <p className="text-gray-300">
              {message || (language === 'th' ? 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิก?' : 'Are you sure you want to cancel?')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors uppercase tracking-wider"
          >
            {cancelText || (language === 'th' ? 'ไม่ใช่' : 'NO')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 bg-yellow-500 text-black font-black py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider"
          >
            {confirmText || (language === 'th' ? 'ใช่' : 'YES')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

