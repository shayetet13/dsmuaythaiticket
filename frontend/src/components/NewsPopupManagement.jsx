import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Plus, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  getNewsPopupImages,
  addNewsPopupImage,
  updateNewsPopupImage,
  deleteNewsPopupImage
} from '../db/imagesDb';
import ConfirmationDialog from './ConfirmationDialog';

const NewsPopupManagement = () => {
  const [images, setImages] = useState([]);
  const [editingImage, setEditingImage] = useState(null);
  const [editForm, setEditForm] = useState({ image: '', displayOrder: 0 });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getNewsPopupImages();
      setImages(data);
    } catch (error) {
      console.error('Error loading news popup images:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const compressImage = (file, maxWidth = 864, maxHeight = 1200, quality = 0.9) => {
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedImage = await compressImage(file);
      setEditForm({ ...editForm, image: compressedImage });
    } catch (error) {
      console.error('Error compressing image:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
    }
  };

  const handleAddImage = () => {
    if (images.length >= 5) {
      showMessage('error', 'สามารถเพิ่มได้สูงสุด 5 ภาพเท่านั้น');
      return;
    }
    setEditingImage('new');
    setEditForm({ image: '', displayOrder: images.length });
  };

  const handleEditImage = (image) => {
    setEditingImage(image.id);
    setEditForm({
      image: image.image,
      displayOrder: image.display_order || 0
    });
  };

  const handleSaveImage = async () => {
    try {
      if (!editForm.image) {
        showMessage('error', 'กรุณาเลือกรูปภาพ');
        return;
      }

      let result;
      if (editingImage === 'new') {
        result = await addNewsPopupImage(editForm.image, editForm.displayOrder);
      } else {
        result = await updateNewsPopupImage(editingImage, editForm.image, editForm.displayOrder);
      }

      if (result) {
        showMessage('success', 'บันทึกข้อมูลสำเร็จ');
        setEditingImage(null);
        setEditForm({ image: '', displayOrder: 0 });
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteImage = (id) => {
    setDeleteAction(() => async () => {
      try {
        const result = await deleteNewsPopupImage(id);
        if (result) {
          showMessage('success', 'ลบภาพสำเร็จ');
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
      }
    });
    setShowDeleteDialog(true);
  };

  const handleMoveOrder = async (id, direction) => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    const currentOrder = image.display_order || 0;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    // Find image at new position
    const swapImage = images.find(img => (img.display_order || 0) === newOrder);
    
    if (swapImage) {
      // Swap orders
      await updateNewsPopupImage(id, image.image, newOrder);
      await updateNewsPopupImage(swapImage.id, swapImage.image, currentOrder);
    } else {
      await updateNewsPopupImage(id, image.image, newOrder);
    }
    
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (deleteAction) {
      await deleteAction();
      setDeleteAction(null);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div>
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteAction(null);
        }}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบภาพนี้?"
        confirmText="ใช่"
        cancelText="ไม่ใช่"
        language="th"
      />

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-black text-white uppercase">News Pop up</h3>
          <button
            onClick={handleAddImage}
            disabled={images.length >= 5}
            className={`font-bold px-3 md:px-4 py-2 rounded flex items-center gap-2 text-sm md:text-base w-full sm:w-auto ${
              images.length >= 5
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            เพิ่มภาพ ({images.length}/5)
          </button>
        </div>

        {/* Editing Form */}
        {editingImage && (
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h4 className="text-base md:text-lg font-bold text-white">
                {editingImage === 'new' ? 'เพิ่มภาพใหม่' : 'แก้ไขภาพ'}
              </h4>
              <button
                onClick={() => {
                  setEditingImage(null);
                  setEditForm({ image: '', displayOrder: 0 });
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกรูปภาพ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
                />
                {editForm.image && (
                  <div className="mt-4">
                    <img
                      src={editForm.image}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded border border-gray-700"
                    />
                  </div>
                )}
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">ลำดับการแสดงผล</label>
                <input
                  type="number"
                  value={editForm.displayOrder}
                  onChange={(e) => setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  min="0"
                  max="4"
                />
                <p className="text-xs text-gray-400 mt-1">ลำดับที่ต่ำกว่าจะแสดงก่อน</p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveImage}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Images List */}
        <div className="space-y-3 md:space-y-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((image, index) => (
                <div
                  key={image.id}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                >
                  <div className="mb-3">
                    <img
                      src={image.image}
                      alt={`News popup ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">ลำดับการแสดงผล:</p>
                    <p className="text-white font-semibold">{image.display_order || 0}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveOrder(image.id, 'up')}
                        disabled={index === 0}
                        className={`flex-1 px-2 md:px-3 py-2 rounded text-xs md:text-sm font-semibold ${
                          index === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <ArrowUp className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        <span className="hidden sm:inline">ขึ้น</span>
                      </button>
                      <button
                        onClick={() => handleMoveOrder(image.id, 'down')}
                        disabled={index === images.length - 1}
                        className={`flex-1 px-2 md:px-3 py-2 rounded text-xs md:text-sm font-semibold ${
                          index === images.length - 1
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <ArrowDown className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        <span className="hidden sm:inline">ลง</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditImage(image)}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-2 md:px-3 py-2 rounded text-xs md:text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-2 md:px-3 py-2 rounded text-xs md:text-sm"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>ยังไม่มีภาพสำหรับ News Popup</p>
              <p className="text-sm mt-2">สามารถเพิ่มได้สูงสุด 5 ภาพ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsPopupManagement;
