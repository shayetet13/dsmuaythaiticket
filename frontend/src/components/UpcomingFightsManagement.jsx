import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Plus, Save, X, Calendar, Sun, Tag, Layers } from 'lucide-react';
import { 
  getStadiums,
  getStadiumImageSchedules, 
  updateStadiumImageSchedules,
  getSpecialMatches,
  addSpecialMatch,
  updateSpecialMatch,
  deleteSpecialMatch,
  getDailyImages,
  addDailyImage,
  updateDailyImage,
  deleteDailyImage,
  getMatchCards,
  createMatchCard,
  updateMatchCard,
  deleteMatchCard,
  createMatchCardTicket,
  updateMatchCardTicket,
  deleteMatchCardTicket
} from '../db/imagesDb';
import { getStadiumName } from '../utils/formatHelpers';
import ConfirmationDialog from './ConfirmationDialog';

const UpcomingFightsManagement = () => {
  const [activeTab, setActiveTab] = useState('images');
  const [stadiums, setStadiums] = useState([]);
  const [stadiumSchedules, setStadiumSchedules] = useState({});
  const [specialMatches, setSpecialMatches] = useState([]);
  const [dailyImages, setDailyImages] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingDailyImage, setEditingDailyImage] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAction, setDeleteAction] = useState(null);

  // Match Cards state
  const [matchCards, setMatchCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [editCardForm, setEditCardForm] = useState({});
  const [ticketPricingCard, setTicketPricingCard] = useState(null);
  const [newTicketForm, setNewTicketForm] = useState({ name: '', price: '', quantity: '' });
  const [editingTicket, setEditingTicket] = useState(null);
  const [editTicketForm, setEditTicketForm] = useState({});

  const dayNames = [
    { id: 0, label: 'อาทิตย์', labelEn: 'Sunday' },
    { id: 1, label: 'จันทร์', labelEn: 'Monday' },
    { id: 2, label: 'อังคาร', labelEn: 'Tuesday' },
    { id: 3, label: 'พุธ', labelEn: 'Wednesday' },
    { id: 4, label: 'พฤหัสบดี', labelEn: 'Thursday' },
    { id: 5, label: 'ศุกร์', labelEn: 'Friday' },
    { id: 6, label: 'เสาร์', labelEn: 'Saturday' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stadiums from API
      const stadiumsData = await getStadiums('th');
      setStadiums(stadiumsData);
      
      // Set default selected stadium to first stadium if available
      if (stadiumsData.length > 0 && !selectedStadium) {
        setSelectedStadium(stadiumsData[0].id);
      }
      
      // Load schedules
      const schedules = await getStadiumImageSchedules();
      // Initialize schedules for all stadiums
      const schedulesMap = {};
      stadiumsData.forEach(stadium => {
        schedulesMap[stadium.id] = schedules[stadium.id] || [];
      });
      setStadiumSchedules(schedulesMap);
      
      // Load special matches
      const matches = await getSpecialMatches();
      setSpecialMatches(matches);
      
      // Load daily images
      const images = await getDailyImages();
      setDailyImages(images);

      // Load match cards
      const cards = await getMatchCards();
      setMatchCards(cards);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // Use utility function for stadium name
  const getStadiumNameLocal = (stadiumId) => getStadiumName(stadiumId, stadiums);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) => {
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

  const handleImageUpload = async (e, isSpecialMatch = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedImage = await compressImage(file);
      if (isSpecialMatch) {
        setEditForm({ ...editForm, image: compressedImage });
      } else {
        setEditForm({ ...editForm, image: compressedImage });
      }
    } catch (error) {
      console.error('Error compressing image:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule('new');
    setEditForm({
      image: '',
      days: [],
      name: ''
    });
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule.id);
    setEditForm({
      image: schedule.image,
      days: [...schedule.days],
      name: schedule.name || ''
    });
  };

  const handleSaveSchedule = async () => {
    try {
      if (!editForm.image) {
        showMessage('error', 'กรุณาเลือกรูปภาพ');
        return;
      }

      if (!editForm.days || editForm.days.length === 0) {
        showMessage('error', 'กรุณาเลือกวันที่จะแสดงภาพ');
        return;
      }

      const currentSchedules = [...stadiumSchedules[selectedStadium]];
      let updatedSchedules;

      if (editingSchedule === 'new') {
        const newId = Math.max(...currentSchedules.map(s => s.id || 0), 0) + 1;
        updatedSchedules = [...currentSchedules, {
          id: newId,
          image: editForm.image,
          days: editForm.days,
          name: editForm.name || ''
        }];
      } else {
        updatedSchedules = currentSchedules.map(s =>
          s.id === editingSchedule
            ? { ...s, image: editForm.image, days: editForm.days, name: editForm.name || '' }
            : s
        );
      }

      const result = await updateStadiumImageSchedules(selectedStadium, updatedSchedules);
      if (result) {
        showMessage('success', 'บันทึกข้อมูลสำเร็จ');
        setEditingSchedule(null);
        setEditForm({});
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteSchedule = (id) => {
    setDeleteAction(() => async () => {
      try {
        const updatedSchedules = stadiumSchedules[selectedStadium].filter(s => s.id !== id);
        const result = await updateStadiumImageSchedules(selectedStadium, updatedSchedules);
        if (result) {
          showMessage('success', 'ลบภาพสำเร็จ');
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
      }
    });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteAction) {
      await deleteAction();
      setDeleteAction(null);
    }
    setShowDeleteDialog(false);
  };

  const handleAddSpecialMatch = () => {
    setEditingMatch('new');
    setEditForm({
      image: '',
      date: '',
      stadiumId: selectedStadium || (stadiums.length > 0 ? stadiums[0].id : ''),
      name: ''
    });
  };

  const handleEditSpecialMatch = (match) => {
    setEditingMatch(match.id);
    setEditForm({
      image: match.image,
      date: match.date,
      stadiumId: match.stadiumId || selectedStadium || (stadiums.length > 0 ? stadiums[0].id : ''),
      name: match.name || ''
    });
  };

  const handleSaveSpecialMatch = async () => {
    try {
      if (!editForm.image) {
        showMessage('error', 'กรุณาเลือกรูปภาพ');
        return;
      }

      if (!editForm.date) {
        showMessage('error', 'กรุณาเลือกวันที่');
        return;
      }

      let result;
      if (editingMatch === 'new') {
        result = await addSpecialMatch({
          image: editForm.image,
          date: editForm.date,
          stadiumId: editForm.stadiumId,
          name: editForm.name || ''
        });
      } else {
        result = await updateSpecialMatch(editingMatch, {
          image: editForm.image,
          date: editForm.date,
          stadiumId: editForm.stadiumId,
          name: editForm.name || ''
        });
      }

      if (result) {
        showMessage('success', 'บันทึกข้อมูลสำเร็จ');
        setEditingMatch(null);
        setEditForm({});
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving special match:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteSpecialMatch = (id) => {
    setDeleteAction(() => async () => {
      try {
        const result = await deleteSpecialMatch(id);
        if (result) {
          showMessage('success', 'ลบแมตช์พิเศษสำเร็จ');
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        console.error('Error deleting special match:', error);
        showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
      }
    });
    setShowDeleteDialog(true);
  };

  const handleAddDailyImage = () => {
    setEditingDailyImage('new');
    setEditForm({
      image: '',
      date: '',
      stadiumId: selectedStadium || (stadiums.length > 0 ? stadiums[0].id : ''),
      name: ''
    });
  };

  const handleEditDailyImage = (image) => {
    setEditingDailyImage(image.id);
    setEditForm({
      image: image.image,
      date: image.date,
      stadiumId: image.stadiumId || selectedStadium || (stadiums.length > 0 ? stadiums[0].id : ''),
      name: image.name || ''
    });
  };

  const handleSaveDailyImage = async () => {
    try {
      if (!editForm.image) {
        showMessage('error', 'กรุณาเลือกรูปภาพ');
        return;
      }

      if (!editForm.date) {
        showMessage('error', 'กรุณาเลือกวันที่');
        return;
      }

      let result;
      if (editingDailyImage === 'new') {
        result = await addDailyImage({
          image: editForm.image,
          date: editForm.date,
          stadiumId: editForm.stadiumId,
          name: editForm.name || ''
        });
      } else {
        result = await updateDailyImage(editingDailyImage, {
          image: editForm.image,
          date: editForm.date,
          stadiumId: editForm.stadiumId,
          name: editForm.name || ''
        });
      }

      if (result) {
        showMessage('success', 'บันทึกข้อมูลสำเร็จ');
        setEditingDailyImage(null);
        setEditForm({});
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving daily image:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteDailyImage = (id) => {
    setDeleteAction(() => async () => {
      try {
        const result = await deleteDailyImage(id);
        if (result) {
          showMessage('success', 'ลบภาพประจำวันสำเร็จ');
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        console.error('Error deleting daily image:', error);
        showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
      }
    });
    setShowDeleteDialog(true);
  };

  // ============================================================
  // Match Card Handlers
  // ============================================================

  const handleAddMatchCard = () => {
    setEditingCard('new');
    setEditCardForm({
      image: '',
      date: '',
      stadiumId: selectedStadium || (stadiums.length > 0 ? stadiums[0].id : ''),
      name: '',
      showBefore: false,
      isSpecial: false
    });
  };

  const handleEditMatchCard = (card) => {
    setEditingCard(card.id);
    setEditCardForm({
      image: card.image,
      date: card.date,
      stadiumId: card.stadiumId,
      name: card.name,
      showBefore: card.showBefore || false,
      isSpecial: card.isSpecial || false
    });
  };

  const handleMatchCardImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setEditCardForm(prev => ({ ...prev, image: compressed }));
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
    }
  };

  const handleSaveMatchCard = async () => {
    if (!editCardForm.name) { showMessage('error', 'กรุณาใส่ชื่อแมตช์'); return; }
    if (!editCardForm.date) { showMessage('error', 'กรุณาเลือกวันที่'); return; }
    if (!editCardForm.image) { showMessage('error', 'กรุณาเลือกรูปภาพ'); return; }
    try {
      let result;
      if (editingCard === 'new') {
        result = await createMatchCard(editCardForm);
      } else {
        result = await updateMatchCard(editingCard, editCardForm);
      }
      if (result) {
        showMessage('success', 'บันทึกข้อมูลสำเร็จ');
        setEditingCard(null);
        setEditCardForm({});
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteMatchCard = (id) => {
    setDeleteAction(() => async () => {
      try {
        const result = await deleteMatchCard(id);
        if (result) {
          showMessage('success', 'ลบการ์ดแมตช์สำเร็จ');
          if (ticketPricingCard?.id === id) setTicketPricingCard(null);
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
      }
    });
    setShowDeleteDialog(true);
  };

  const openTicketPricing = (card) => {
    setTicketPricingCard(card);
    setNewTicketForm({ name: '', price: '', quantity: '' });
    setEditingTicket(null);
    setEditTicketForm({});
  };

  const handleAddTicket = async () => {
    if (!newTicketForm.name) { showMessage('error', 'กรุณาใส่ชื่อตั๋ว'); return; }
    if (!newTicketForm.price && newTicketForm.price !== 0) { showMessage('error', 'กรุณาใส่ราคา'); return; }
    if (!newTicketForm.quantity && newTicketForm.quantity !== 0) { showMessage('error', 'กรุณาใส่จำนวน'); return; }
    try {
      const result = await createMatchCardTicket(ticketPricingCard.id, {
        name: newTicketForm.name,
        price: parseFloat(newTicketForm.price) || 0,
        quantity: parseInt(newTicketForm.quantity) || 0
      });
      if (result) {
        setNewTicketForm({ name: '', price: '', quantity: '' });
        await loadData();
        const updated = (await getMatchCards()).find(c => c.id === ticketPricingCard.id);
        if (updated) setTicketPricingCard(updated);
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการเพิ่มตั๋ว');
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาดในการเพิ่มตั๋ว');
    }
  };

  const handleSaveTicket = async (ticketId) => {
    if (!editTicketForm.name) { showMessage('error', 'กรุณาใส่ชื่อตั๋ว'); return; }
    try {
      const result = await updateMatchCardTicket(ticketId, {
        name: editTicketForm.name,
        price: parseFloat(editTicketForm.price) || 0,
        quantity: parseInt(editTicketForm.quantity) || 0
      });
      if (result) {
        setEditingTicket(null);
        setEditTicketForm({});
        await loadData();
        const updated = (await getMatchCards()).find(c => c.id === ticketPricingCard.id);
        if (updated) setTicketPricingCard(updated);
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    setDeleteAction(() => async () => {
      try {
        await deleteMatchCardTicket(ticketId);
        await loadData();
        const updated = (await getMatchCards()).find(c => c.id === ticketPricingCard.id);
        if (updated) setTicketPricingCard(updated);
        else setTicketPricingCard(null);
      } catch (error) {
        showMessage('error', 'เกิดข้อผิดพลาดในการลบตั๋ว');
      }
    });
    setShowDeleteDialog(true);
  };

  const toggleDay = (dayId) => {
    const days = editForm.days || [];
    if (days.includes(dayId)) {
      setEditForm({ ...editForm, days: days.filter(d => d !== dayId) });
    } else {
      setEditForm({ ...editForm, days: [...days, dayId] });
    }
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
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?"
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

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 mb-4 md:mb-6">
        <div className="flex space-x-1 p-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'images'
                ? 'bg-gray-900 text-yellow-500 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">แก้ไขภาพ</span>
            <span className="sm:hidden">ภาพ</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'daily'
                ? 'bg-gray-900 text-yellow-500 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Sun className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">แก้ไขภาพประจำวัน</span>
            <span className="sm:hidden">ประจำวัน</span>
          </button>
          <button
            onClick={() => setActiveTab('matchcard')}
            className={`flex-1 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'matchcard'
                ? 'bg-gray-900 text-yellow-500 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Layers className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">สร้างการ์ดแมตช์</span>
            <span className="sm:hidden">การ์ด</span>
          </button>
          <button
            onClick={() => setActiveTab('special')}
            className={`flex-1 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'special'
                ? 'bg-gray-900 text-yellow-500 border-b-2 border-yellow-500'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">แมตช์พิเศษ</span>
            <span className="sm:hidden">แมตช์</span>
          </button>
        </div>
      </div>

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-black text-white uppercase">แก้ไขภาพสนาม</h3>
            <button
              onClick={handleAddSchedule}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 md:px-4 py-2 rounded flex items-center gap-2 text-sm md:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              เพิ่มภาพ
            </button>
          </div>

          {/* Stadium Selector */}
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกสนาม</label>
            {stadiums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-x-auto scrollbar-hide">
                {stadiums.map((stadium) => (
                  <button
                    key={stadium.id}
                    onClick={() => setSelectedStadium(stadium.id)}
                    className={`px-4 py-2 rounded font-semibold transition-colors ${
                      selectedStadium === stadium.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {stadium.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">กำลังโหลดข้อมูลสนาม...</p>
            )}
          </div>

          {/* Editing Form */}
          {editingSchedule && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h4 className="text-base md:text-lg font-bold text-white">
                  {editingSchedule === 'new' ? 'เพิ่มภาพใหม่' : 'แก้ไขภาพ'}
                </h4>
                <button
                  onClick={() => {
                    setEditingSchedule(null);
                    setEditForm({});
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Match Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ชื่อแมตช์</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                    placeholder="เช่น xxxxxx ประจำวันจันทร์ อังคาร พุธ"
                  />
                </div>

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

                {/* Day Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    เลือกวันที่จะแสดงภาพ (สามารถเลือกหลายวันได้)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {dayNames.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`px-4 py-2 rounded font-semibold transition-colors ${
                          editForm.days?.includes(day.id)
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSchedule}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedules List */}
          {selectedStadium && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white mb-4">
                รายการภาพสำหรับสนาม{getStadiumNameLocal(selectedStadium)}
              </h4>
              {stadiumSchedules[selectedStadium]?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stadiumSchedules[selectedStadium].map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                  >
                    <div className="mb-3">
                      <img
                        src={schedule.image}
                        alt="Schedule"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                    {schedule.name && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-1">ชื่อแมตช์:</p>
                        <p className="text-white font-semibold">{schedule.name}</p>
                      </div>
                    )}
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">แสดงในวัน:</p>
                      <div className="flex flex-wrap gap-1">
                        {schedule.days?.map((dayId) => {
                          const day = dayNames.find(d => d.id === dayId);
                          return day ? (
                            <span
                              key={dayId}
                              className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded"
                            >
                              {day.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 rounded text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-2 rounded text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>ยังไม่มีภาพสำหรับสนามนี้</p>
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Daily Images Tab */}
      {activeTab === 'daily' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-black text-white uppercase">แก้ไขภาพประจำวัน</h3>
            <button
              onClick={handleAddDailyImage}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 md:px-4 py-2 rounded flex items-center gap-2 text-sm md:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              เพิ่มภาพประจำวัน
            </button>
          </div>

          {/* Editing Form */}
          {editingDailyImage && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h4 className="text-base md:text-lg font-bold text-white">
                  {editingDailyImage === 'new' ? 'เพิ่มภาพประจำวันใหม่' : 'แก้ไขภาพประจำวัน'}
                </h4>
                <button
                  onClick={() => {
                    setEditingDailyImage(null);
                    setEditForm({});
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Stadium Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกสนาม</label>
                  <select
                    value={editForm.stadiumId || (stadiums.length > 0 ? stadiums[0].id : '')}
                    onChange={(e) => setEditForm({ ...editForm, stadiumId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  >
                    {stadiums.map((stadium) => (
                      <option key={stadium.id} value={stadium.id}>
                        {stadium.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกวันที่ (จะเชื่อมโยงกับตั๋วประจำวันนั้น)</label>
                  <input
                    type="date"
                    value={editForm.date || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  />
                </div>

                {/* Match Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ชื่อแมตช์</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                    placeholder="เช่น ภาพประจำวัน..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกรูปภาพ</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
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

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveDailyImage}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Daily Images List */}
          <div className="space-y-4">
            {dailyImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {dailyImages.map((image) => (
                  <div
                    key={image.id}
                    className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                  >
                    <div className="mb-3">
                      <img
                        src={image.image}
                        alt="Daily Image"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">สนาม:</p>
                      <p className="text-white font-semibold">{getStadiumName(image.stadiumId)}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">วันที่:</p>
                      <p className="text-white font-semibold">{image.date}</p>
                    </div>
                    {image.name && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-1">ชื่อแมตช์:</p>
                        <p className="text-white font-semibold">{image.name}</p>
                      </div>
                    )}
                    {image.hasLinkedTickets !== undefined && (
                      <div className="mb-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          image.hasLinkedTickets
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {image.hasLinkedTickets ? '✓ เชื่อมโยงกับตั๋วประจำวันแล้ว' : '⚠ ยังไม่มีตั๋วประจำวัน'}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDailyImage(image)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 rounded text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteDailyImage(image.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-2 rounded text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>ยังไม่มีภาพประจำวัน</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Cards Tab */}
      {activeTab === 'matchcard' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-black text-white uppercase">สร้างการ์ดแมตช์</h3>
            <button
              onClick={handleAddMatchCard}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 md:px-4 py-2 rounded flex items-center gap-2 text-sm md:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              สร้างการ์ดใหม่
            </button>
          </div>

          {/* Create / Edit Form */}
          {editingCard && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h4 className="text-base md:text-lg font-bold text-white">
                  {editingCard === 'new' ? 'สร้างการ์ดแมตช์ใหม่' : 'แก้ไขการ์ดแมตช์'}
                </h4>
                <button
                  onClick={() => { setEditingCard(null); setEditCardForm({}); }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Stadium Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกสนาม</label>
                  <select
                    value={editCardForm.stadiumId || (stadiums.length > 0 ? stadiums[0].id : '')}
                    onChange={(e) => setEditCardForm({ ...editCardForm, stadiumId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  >
                    {stadiums.map((stadium) => (
                      <option key={stadium.id} value={stadium.id}>{stadium.name}</option>
                    ))}
                  </select>
                </div>

                {/* Match Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ชื่อแมตช์</label>
                  <input
                    type="text"
                    value={editCardForm.name || ''}
                    onChange={(e) => setEditCardForm({ ...editCardForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                    placeholder="เช่น Muay Thai Championship Night"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">วันที่จัดงาน</label>
                  <input
                    type="date"
                    value={editCardForm.date || ''}
                    onChange={(e) => setEditCardForm({ ...editCardForm, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">การ์ดนี้จะถูกลบออกอัตโนมัติเมื่อวันที่ดังกล่าวสิ้นสุดลง</p>
                </div>

                {/* Display Position Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ตำแหน่งการแสดง (กรณีมีการ์ดวันเดียวกัน)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCardForm({ ...editCardForm, showBefore: false })}
                      className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                        !editCardForm.showBefore
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      โชว์หลัง การ์ดวันปกติ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditCardForm({ ...editCardForm, showBefore: true })}
                      className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                        editCardForm.showBefore
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      โชว์ก่อน การ์ดวันปกติ
                    </button>
                  </div>
                </div>

                {/* Special Match Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ประเภทการ์ด</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCardForm({ ...editCardForm, isSpecial: false })}
                      className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                        !editCardForm.isSpecial
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      การ์ดธรรมดา
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditCardForm({ ...editCardForm, isSpecial: true })}
                      className={`flex-1 py-2 px-3 rounded font-semibold text-sm transition-colors ${
                        editCardForm.isSpecial
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      ✨ แมตช์พิเศษ (เรืองแสง)
                    </button>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">รูปภาพการ์ด</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMatchCardImageUpload}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
                  />
                  {editCardForm.image && (
                    <div className="mt-4">
                      <img
                        src={editCardForm.image}
                        alt="Preview"
                        className="max-w-full h-48 object-cover rounded border border-gray-700"
                      />
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveMatchCard}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Match Cards List */}
          <div className="space-y-3">
            {matchCards.length > 0 ? (
              matchCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  {/* Thumbnail */}
                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full sm:w-20 h-14 object-cover rounded flex-shrink-0"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{card.name}</p>
                    <p className="text-sm text-gray-400">{getStadiumNameLocal(card.stadiumId)}</p>
                    <p className="text-sm text-yellow-400">{card.date}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${card.showBefore ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                        {card.showBefore ? 'โชว์ก่อน' : 'โชว์หลัง'}
                      </span>
                      {card.isSpecial && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">✨ พิเศษ</span>
                      )}
                      {card.tickets && card.tickets.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          ตั๋ว {card.tickets.length} ประเภท
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row sm:flex-col md:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                    <button
                      onClick={() => openTicketPricing(card)}
                      className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-2 rounded text-xs md:text-sm whitespace-nowrap"
                    >
                      <Tag className="w-3 h-3 md:w-4 md:h-4" />
                      ตั้งราคาตั๋ว
                    </button>
                    <button
                      onClick={() => handleEditMatchCard(card)}
                      className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 rounded text-xs md:text-sm"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteMatchCard(card.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-2 rounded text-xs md:text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>ยังไม่มีการ์ดแมตช์</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Pricing Modal */}
      {ticketPricingCard && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-white">ตั้งราคาตั๋ว</h3>
                <p className="text-sm text-gray-400">{ticketPricingCard.name} · {ticketPricingCard.date}</p>
              </div>
              <button
                onClick={() => { setTicketPricingCard(null); setEditingTicket(null); }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Seating Layout Image Upload */}
              <div className="border border-gray-700 rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  ภาพแผนผังที่นั่ง
                  <span className="text-gray-500 font-normal normal-case text-xs">(จะโชว์แทนภาพปกติบนหน้าเลือกตั๋ว)</span>
                </h4>
                {ticketPricingCard.seatingImage ? (
                  <div className="relative">
                    <img
                      src={ticketPricingCard.seatingImage}
                      alt="seating layout"
                      className="w-full rounded-lg object-cover max-h-48"
                    />
                    <button
                      onClick={async () => {
                        const updated = await updateMatchCard(ticketPricingCard.id, {
                          ...ticketPricingCard,
                          seatingImage: null
                        });
                        if (updated) {
                          setTicketPricingCard({ ...ticketPricingCard, seatingImage: null });
                          await loadData();
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                      title="ลบภาพ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg cursor-pointer transition-colors bg-gray-800/50">
                    <ImageIcon className="w-6 h-6 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">คลิกเพื่ออัพโหลดภาพแผนผัง</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const base64 = ev.target.result;
                          const updated = await updateMatchCard(ticketPricingCard.id, {
                            ...ticketPricingCard,
                            seatingImage: base64
                          });
                          if (updated) {
                            setTicketPricingCard({ ...ticketPricingCard, seatingImage: updated.seatingImage });
                            await loadData();
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Existing Tickets */}
              {ticketPricingCard.tickets && ticketPricingCard.tickets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">รายการตั๋ว</h4>
                  {ticketPricingCard.tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-gray-800 rounded-lg p-3">
                      {editingTicket === ticket.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTicketForm.name || ''}
                            onChange={(e) => setEditTicketForm({ ...editTicketForm, name: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm"
                            placeholder="ชื่อตั๋ว"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={editTicketForm.price || ''}
                              onChange={(e) => setEditTicketForm({ ...editTicketForm, price: e.target.value })}
                              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm"
                              placeholder="ราคา (บาท)"
                              min="0"
                            />
                            <input
                              type="number"
                              value={editTicketForm.quantity || ''}
                              onChange={(e) => setEditTicketForm({ ...editTicketForm, quantity: e.target.value })}
                              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm"
                              placeholder="จำนวน"
                              min="0"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setEditingTicket(null); setEditTicketForm({}); }}
                              className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded border border-gray-600"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => handleSaveTicket(ticket.id)}
                              className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold text-sm">{ticket.name}</p>
                            <p className="text-yellow-400 text-sm">฿{ticket.price.toLocaleString()}</p>
                            <p className="text-gray-400 text-xs">จำนวน: {ticket.quantity} ที่นั่ง</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingTicket(ticket.id);
                                setEditTicketForm({ name: ticket.name, price: ticket.price, quantity: ticket.quantity });
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1.5 rounded"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1.5 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Ticket Form */}
              <div className="border border-dashed border-gray-600 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  เพิ่มประเภทตั๋วใหม่
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTicketForm.name}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm"
                    placeholder="ชื่อประเภทตั๋ว เช่น Ringside, VIP, General"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={newTicketForm.price}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, price: e.target.value })}
                      className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm"
                      placeholder="ราคา (บาท)"
                      min="0"
                    />
                    <input
                      type="number"
                      value={newTicketForm.quantity}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, quantity: e.target.value })}
                      className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm"
                      placeholder="จำนวนที่นั่ง"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddTicket}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่มตั๋ว
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Matches Tab */}
      {activeTab === 'special' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-black text-white uppercase">แมตช์พิเศษ</h3>
            <button
              onClick={handleAddSpecialMatch}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 md:px-4 py-2 rounded flex items-center gap-2 text-sm md:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              เพิ่มแมตช์พิเศษ
            </button>
          </div>

          {/* Editing Form */}
          {editingMatch && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h4 className="text-base md:text-lg font-bold text-white">
                  {editingMatch === 'new' ? 'เพิ่มแมตช์พิเศษใหม่' : 'แก้ไขแมตช์พิเศษ'}
                </h4>
                <button
                  onClick={() => {
                    setEditingMatch(null);
                    setEditForm({});
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Stadium Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกสนาม</label>
                  <select
                    value={editForm.stadiumId || (stadiums.length > 0 ? stadiums[0].id : '')}
                    onChange={(e) => setEditForm({ ...editForm, stadiumId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  >
                    {stadiums.map((stadium) => (
                      <option key={stadium.id} value={stadium.id}>
                        {stadium.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกวันที่ (แสดงเฉพาะวันนี้)</label>
                  <input
                    type="date"
                    value={editForm.date || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                  />
                </div>

                {/* Match Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ชื่อแมตช์</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2"
                    placeholder="เช่น แมตช์พิเศษ..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">เลือกรูปภาพ</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
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

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSpecialMatch}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Special Matches List */}
          <div className="space-y-4">
            {specialMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {specialMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                  >
                    <div className="mb-3">
                      <img
                        src={match.image}
                        alt="Special Match"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">สนาม:</p>
                      <p className="text-white font-semibold">{getStadiumNameLocal(match.stadiumId)}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">วันที่:</p>
                      <p className="text-white font-semibold">{match.date}</p>
                    </div>
                    {match.name && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-1">ชื่อแมตช์:</p>
                        <p className="text-white font-semibold">{match.name}</p>
                      </div>
                    )}
                    {match.hasLinkedTickets !== undefined && (
                      <div className="mb-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          match.hasLinkedTickets
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {match.hasLinkedTickets ? '✓ เชื่อมโยงกับตั๋วพิเศษแล้ว' : '⚠ ยังไม่มีตั๋วพิเศษ'}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSpecialMatch(match)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 rounded text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteSpecialMatch(match.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-2 rounded text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>ยังไม่มีแมตช์พิเศษ</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingFightsManagement;

