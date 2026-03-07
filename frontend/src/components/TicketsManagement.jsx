import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Plus, X, Save, Trash2, Edit2, ArrowLeft, ChevronLeft, Upload, Image as ImageIcon, Settings, FileText, GripVertical } from 'lucide-react';
import axios from 'axios';
import { getStadiums, getStadiumImageSchedules, updateStadium } from '../db/imagesDb';
import { API_URL, getAdminAxiosConfig } from '../config/api.js';
import { compressImage, validateImage } from '../utils/imageHelpers';
import { getMatchName, getDayName } from '../utils/formatHelpers';
import DailyTicketAdjustment from './DailyTicketAdjustment';
import DiscountTicketsManagement from './DiscountTicketsManagement';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TicketsManagement = () => {
  const [stadiums, setStadiums] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [ticketConfig, setTicketConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRegular, setEditingRegular] = useState(null);
  const [editingSpecial, setEditingSpecial] = useState(null);
  const [editRegularForm, setEditRegularForm] = useState({ name: '', price: '', quantity: '', match_id: '', match_name: '', days: [] });
  const [editSpecialForm, setEditSpecialForm] = useState({ name: '', price: '', date: '', quantity: '', image: null });
  const [stadiumTicketTypeDetail, setStadiumTicketTypeDetail] = useState('');
  const [loadingTicketTypeDetail, setLoadingTicketTypeDetail] = useState(false);
  const [ticketTypeDetailError, setTicketTypeDetailError] = useState('');
  const [ticketTypeDetailSuccess, setTicketTypeDetailSuccess] = useState('');
  const [draggedTicket, setDraggedTicket] = useState(null); // { type: 'regular' | 'special', ticketId: string }
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [newRegularTicket, setNewRegularTicket] = useState({ name: '', price: '', quantity: '' });
  const [newSpecialTicket, setNewSpecialTicket] = useState({ name: '', price: '', date: '', quantity: '', image: null });
  const [specialTicketImagePreview, setSpecialTicketImagePreview] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [paymentImages, setPaymentImages] = useState([]);
  const [newPaymentImage, setNewPaymentImage] = useState({ image: null, days: [] });
  const [editingPaymentImage, setEditingPaymentImage] = useState(null);
  const [showDailyAdjustment, setShowDailyAdjustment] = useState(false);
  const [showDiscountTickets, setShowDiscountTickets] = useState(false);
  const [discountTickets, setDiscountTickets] = useState([]);
  const [selectedDiscountStadium, setSelectedDiscountStadium] = useState(null);

  useEffect(() => {
    loadStadiums();
  }, []);

  useEffect(() => {
    if (selectedStadium) {
      loadTicketConfig(selectedStadium);
      loadMatches(selectedStadium);
      loadPaymentImages(selectedStadium);
      loadStadiumTicketTypeDetail(selectedStadium);
    }
  }, [selectedStadium]);

  const loadPaymentImages = async () => {
    if (!selectedStadium) return;
    try {
      const response = await axios.get(`${API_URL}/stadiums/${selectedStadium}/payment-images`);
      setPaymentImages(response.data || []);
    } catch (err) {
      console.error('Error loading payment images:', err);
      setPaymentImages([]);
    }
  };

  const loadStadiumTicketTypeDetail = async () => {
    if (!selectedStadium) return;
    try {
      setLoadingTicketTypeDetail(true);
      const response = await axios.get(`${API_URL}/stadiums/${selectedStadium}/ticket-type-detail`);
      setStadiumTicketTypeDetail(response.data.detail || '');
    } catch (err) {
      console.error('Error loading ticket type detail:', err);
      setStadiumTicketTypeDetail('');
    } finally {
      setLoadingTicketTypeDetail(false);
    }
  };

  const handleSaveStadiumTicketTypeDetail = async () => {
    if (!selectedStadium) return;
    
    try {
      setLoadingTicketTypeDetail(true);
      setTicketTypeDetailError('');
      setTicketTypeDetailSuccess('');
      
      await axios.put(
        `${API_URL}/stadiums/${selectedStadium}/ticket-type-detail`,
        { detail: stadiumTicketTypeDetail },
        getAdminAxiosConfig()
      );
      
      setTicketTypeDetailSuccess('บันทึก Ticket Type Detail สำเร็จ!');
      setTimeout(() => setTicketTypeDetailSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving ticket type detail:', err);
      const errorMessage = err.response?.data?.error || 'ไม่สามารถบันทึก Ticket Type Detail ได้';
      setTicketTypeDetailError(errorMessage);
      setTimeout(() => setTicketTypeDetailError(''), 5000);
    } finally {
      setLoadingTicketTypeDetail(false);
    }
  };

  const loadMatches = async (stadiumId) => {
    try {
      const schedules = await getStadiumImageSchedules();
      const stadiumMatches = schedules[stadiumId] || [];
      setMatches(stadiumMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setMatches([]);
    }
  };

  const loadStadiums = async () => {
    try {
      const stadiumsData = await getStadiums('th');
      setStadiums(stadiumsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading stadiums:', err);
      setError('ไม่สามารถโหลดข้อมูลสนามได้');
      setLoading(false);
    }
  };

  const loadTicketConfig = async (stadiumId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/stadiums/${stadiumId}/tickets`);
      setTicketConfig(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading ticket config:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถโหลดข้อมูลตั๋วได้';
      setError(`ไม่สามารถโหลดข้อมูลตั๋วได้: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate available dates based on scheduleDays
  const getAvailableDates = (scheduleDays) => {
    if (!scheduleDays || scheduleDays.length === 0) return [];
    
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid timezone issues
      const dayOfWeek = date.getDay();
      
      if (date >= today && scheduleDays.includes(dayOfWeek)) {
        // Use local date format instead of ISO to avoid timezone issues
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${yearStr}-${monthStr}-${dayStr}`;
        dates.push(dateString);
      }
    }
    
    return dates;
  };

  // Check if a date is valid for the stadium
  const isValidDateForStadium = (dateString, scheduleDays) => {
    if (!scheduleDays || scheduleDays.length === 0) return false;
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid timezone issues
    const dayOfWeek = date.getDay();
    return scheduleDays.includes(dayOfWeek);
  };


  const handleAddToPending = () => {
    if (!newRegularTicket.name || !newRegularTicket.price) {
      setError('กรุณากรอกชื่อและราคาตั๋ว');
      return;
    }

    const ticket = {
      id: `pending-${Date.now()}-${Math.random()}`,
      name: newRegularTicket.name,
      price: parseFloat(newRegularTicket.price),
      quantity: parseInt(newRegularTicket.quantity) || 0
    };

    setPendingTickets([...pendingTickets, ticket]);
    setNewRegularTicket({ name: '', price: '', quantity: '' });
    setError('');
  };

  const handleRemovePendingTicket = (ticketId) => {
    setPendingTickets(pendingTickets.filter(t => t.id !== ticketId));
  };

  const handleSavePendingTickets = async () => {
    if (pendingTickets.length === 0) {
      setError('กรุณาเพิ่มตั๋วก่อน');
      return;
    }

    if (selectedDays.length === 0) {
      setError('กรุณาเลือกวันที่จะแสดงราคาตั๋ว');
      return;
    }

    if (!selectedStadium) {
      setError('กรุณาเลือกสนาม');
      return;
    }

    try {
      // Save all pending tickets with selected days
      const promises = pendingTickets.map(ticket =>
        axios.post(`${API_URL}/stadiums/${selectedStadium}/tickets/regular`, {
          name: ticket.name,
          price: ticket.price,
          quantity: ticket.quantity,
          match_id: null,
          match_name: null,
          days: selectedDays
        })
      );

      await Promise.all(promises);
      
      setError('');
      setSuccess(`เพิ่มตั๋ว ${pendingTickets.length} แบบสำเร็จ!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Clear pending tickets and selected days
      setPendingTickets([]);
      setSelectedDays([]);
      
      // Reload ticket config
      await loadTicketConfig(selectedStadium);
    } catch (err) {
      console.error('Error saving pending tickets:', err);
      const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถเพิ่มตั๋วได้';
      setError(`ไม่สามารถเพิ่มตั๋วได้: ${errorMessage}`);
      setSuccess('');
    }
  };

  const handleUpdateRegularTicket = async (ticketId, name, price, quantity, match_id, match_name, days) => {
    if (!selectedStadium || !name || !price) return;

    try {
      await axios.put(`${API_URL}/stadiums/${selectedStadium}/tickets/regular/${ticketId}`, {
        name,
        price,
        quantity: quantity || 0,
        match_id: match_id !== '' ? parseInt(match_id) : null,
        match_name: match_name || '',
        days: days || []
      });
      setEditingRegular(null);
      setError('');
      await loadTicketConfig(selectedStadium);
    } catch (err) {
      console.error('Error updating regular ticket:', err);
      setError('ไม่สามารถอัปเดตตั๋วได้');
    }
  };

  const handleDeleteRegularTicket = async (ticketId) => {
    if (!selectedStadium) return;

    try {
      await axios.delete(`${API_URL}/stadiums/${selectedStadium}/tickets/regular/${ticketId}`);
      setError('');
      await loadTicketConfig(selectedStadium);
    } catch (err) {
      console.error('Error deleting regular ticket:', err);
      setError('ไม่สามารถลบตั๋วได้');
    }
  };

  const handleAddSpecialTicket = async (clearForm = false) => {
    if (!selectedStadium || !newSpecialTicket.name || !newSpecialTicket.price || !newSpecialTicket.date) {
      setError('กรุณากรอกข้อมูลตั๋วราคาพิเศษให้ครบถ้วน');
      return;
    }

    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
    if (!selectedStadiumData?.scheduleDays) {
      setError('ไม่พบข้อมูลวันชกของสนาม');
      return;
    }

    if (!isValidDateForStadium(newSpecialTicket.date, selectedStadiumData.scheduleDays)) {
      setError('วันที่ต้องตรงกับวันชกของสนามตามตารางเวลา');
      return;
    }

    try {
      // Process image if provided
      let processedImage = null;
      if (newSpecialTicket.image) {
        // Only compress if image is a File object (new upload)
        // If it's already a base64 string (from handleSpecialTicketImageUpload), use it as-is
        if (newSpecialTicket.image instanceof File) {
          processedImage = await compressImage(newSpecialTicket.image, 1920, 1080, 0.85);
        } else if (typeof newSpecialTicket.image === 'string' && newSpecialTicket.image.startsWith('data:image')) {
          // Already compressed base64 string from handleSpecialTicketImageUpload
          processedImage = newSpecialTicket.image;
        } else {
          // Invalid image type, skip it
          console.warn('Invalid image type, skipping image:', typeof newSpecialTicket.image);
          processedImage = null;
        }
      }

      const response = await axios.post(`${API_URL}/stadiums/${selectedStadium}/tickets/special`, {
        name: newSpecialTicket.name,
        price: newSpecialTicket.price,
        date: newSpecialTicket.date,
        quantity: newSpecialTicket.quantity || 0,
        image: processedImage,
        scheduleDays: selectedStadiumData.scheduleDays
      });
      
      setError('');
      setSuccess('เพิ่มตั๋วราคาพิเศษสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload ticket config to show new ticket
      await loadTicketConfig(selectedStadium);
      
      // Only clear form if explicitly requested
      if (clearForm) {
        setNewSpecialTicket({ name: '', price: '', date: '', quantity: '', image: null });
      }
    } catch (err) {
      console.error('Error adding special ticket:', err);
      const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถเพิ่มตั๋วราคาพิเศษได้';
      setError(`ไม่สามารถเพิ่มตั๋วราคาพิเศษได้: ${errorMessage}`);
      setSuccess('');
    }
  };

  const handleUpdateSpecialTicket = async (ticketId, name, price, date, quantity, image) => {
    if (!selectedStadium || !name || !price || !date) return;

    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
    if (!selectedStadiumData?.scheduleDays) {
      setError('ไม่พบข้อมูลวันชกของสนาม');
      return;
    }

    if (!isValidDateForStadium(date, selectedStadiumData.scheduleDays)) {
      setError('วันที่ต้องตรงกับวันชกของสนามตามตารางเวลา');
      return;
    }

    try {
      // Process image if provided
      let processedImage = image;
      // Only compress if image is a File object (new upload), not if it's already a base64 string
      if (image && image instanceof File) {
        processedImage = await compressImage(image, 1920, 1080, 0.85);
      }
      // If image is already a base64 string, use it as-is

      await axios.put(`${API_URL}/stadiums/${selectedStadium}/tickets/special/${ticketId}`, {
        name,
        price,
        date,
        quantity: quantity || 0,
        image: processedImage,
        scheduleDays: selectedStadiumData.scheduleDays
      });
      setEditingSpecial(null);
      setError('');
      await loadTicketConfig(selectedStadium);
    } catch (err) {
      console.error('Error updating special ticket:', err);
      setError(err.response?.data?.error || 'ไม่สามารถอัปเดตตั๋วราคาพิเศษได้');
    }
  };


  const handleDragStart = (e, ticketType, ticketId) => {
    setDraggedTicket({ type: ticketType, ticketId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedTicket(null);
    setDraggedOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = async (e, ticketType, dropIndex) => {
    e.preventDefault();
    setDraggedOverIndex(null);
    
    if (!draggedTicket || !selectedStadium) return;
    
    if (draggedTicket.type !== ticketType) {
      setDraggedTicket(null);
      return;
    }

    try {
      const tickets = ticketType === 'regular' 
        ? ticketConfig?.regularTickets || []
        : ticketConfig?.specialTickets || [];
      
      const draggedIndex = tickets.findIndex(t => t.id === draggedTicket.ticketId);
      
      if (draggedIndex === -1 || draggedIndex === dropIndex) {
        setDraggedTicket(null);
        return;
      }

      // Create new array with reordered tickets
      const newTickets = [...tickets];
      const [removed] = newTickets.splice(draggedIndex, 1);
      newTickets.splice(dropIndex, 0, removed);

      // Extract ticket IDs in new order
      const ticketIds = newTickets.map(t => t.id);

      // Call API to update order
      const endpoint = ticketType === 'regular'
        ? `${API_URL}/stadiums/${selectedStadium}/tickets/regular/reorder`
        : `${API_URL}/stadiums/${selectedStadium}/tickets/special/reorder`;
      
      await axios.post(endpoint, { ticketIds });
      
      setSuccess('เรียงลำดับตั๋วสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload ticket config
      await loadTicketConfig(selectedStadium);
    } catch (err) {
      console.error('Error reordering tickets:', err);
      setError('ไม่สามารถเรียงลำดับตั๋วได้');
    } finally {
      setDraggedTicket(null);
    }
  };

  const handleSpecialTicketImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      e.target.value = '';
      return;
    }

    // Validate that it's actually a File/Blob object
    if (!(file instanceof File) && !(file instanceof Blob)) {
      setError('ไฟล์ที่เลือกไม่ถูกต้อง กรุณาเลือกไฟล์ภาพใหม่');
      setTimeout(() => setError(''), 3000);
      e.target.value = '';
      return;
    }

    const validation = validateImage(file, 10);
    if (!validation.valid) {
      setError(validation.error);
      setTimeout(() => setError(''), 3000);
      e.target.value = '';
      return;
    }

    try {
      const compressedImage = await compressImage(file, 1920, 1080, 0.85);
      setNewSpecialTicket({ ...newSpecialTicket, image: compressedImage });
      setSpecialTicketImagePreview(compressedImage);
      setError('');
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('เกิดข้อผิดพลาดในการประมวลผลภาพ: ' + (err.message || 'Unknown error'));
      setTimeout(() => setError(''), 5000);
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteSpecialTicket = async (ticketId) => {
    if (!selectedStadium) return;

    try {
      await axios.delete(`${API_URL}/stadiums/${selectedStadium}/tickets/special/${ticketId}`);
      setError('');
      await loadTicketConfig(selectedStadium);
    } catch (err) {
      console.error('Error deleting special ticket:', err);
      setError('ไม่สามารถลบตั๋วได้');
    }
  };

  const handleDateClick = (dateString) => {
    setNewSpecialTicket({ ...newSpecialTicket, date: dateString });
  };

  const handlePaymentImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image
    const validation = validateImage(file, 10);
    if (!validation.valid) {
      setError(validation.error);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      // Compress image
      const compressedImage = await compressImage(file, 1920, 1080, 0.85);
      setNewPaymentImage({ ...newPaymentImage, image: compressedImage });
      setSuccess('ภาพพร้อมอัพโหลด กรุณาเลือกวันที่จะแสดง');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('เกิดข้อผิดพลาดในการประมวลผลภาพ');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSavePaymentImage = async () => {
    if (!newPaymentImage.image || newPaymentImage.days.length === 0) {
      setError('กรุณาอัพโหลดภาพและเลือกวันที่จะแสดง');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setUploadingImage(true);
      await axios.post(`${API_URL}/stadiums/${selectedStadium}/payment-images`, {
        image: newPaymentImage.image,
        days: newPaymentImage.days
      });

      setNewPaymentImage({ image: null, days: [] });
      await loadPaymentImages();
      setSuccess('เพิ่มภาพสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving payment image:', err);
      setError('เกิดข้อผิดพลาดในการบันทึกภาพ');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeletePaymentImage = async (imageId) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบภาพนี้?')) return;

    try {
      setUploadingImage(true);
      await axios.delete(`${API_URL}/stadiums/${selectedStadium}/payment-images/${imageId}`);
      await loadPaymentImages();
      setSuccess('ลบภาพสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting payment image:', err);
      setError('เกิดข้อผิดพลาดในการลบภาพ');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading && !selectedStadium) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <div className="text-white">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  // Show daily adjustment if enabled
  if (showDailyAdjustment) {
    return <DailyTicketAdjustment onClose={() => setShowDailyAdjustment(false)} />;
  }

  // Show discount tickets management if enabled
  if (showDiscountTickets) {
    return (
      <DiscountTicketsManagement 
        stadiums={stadiums}
        selectedStadium={selectedDiscountStadium}
        onSelectStadium={setSelectedDiscountStadium}
        onClose={() => {
          setShowDiscountTickets(false);
          setSelectedDiscountStadium(null);
        }}
      />
    );
  }

  // Stadium Selection View
  if (!selectedStadium) {
    return (
      <div>
        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                จัดการตั๋ว
              </h2>
              <p className="text-gray-400">เลือกสนามเพื่อจัดการตั๋ว</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedDiscountStadium(null);
                  setShowDiscountTickets(true);
                }}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Ticket className="w-5 h-5" />
                ตั๋วลดราคา
              </button>
              <button
                onClick={() => setShowDailyAdjustment(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Settings className="w-5 h-5" />
                ปรับตั๋วรายวัน
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Stadiums Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {stadiums.map((stadium) => (
            <div
              key={stadium.id}
              onClick={() => setSelectedStadium(stadium.id)}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 cursor-pointer hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <MapPin className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                    {stadium.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{stadium.location}</p>
                  <p className="text-gray-500 text-xs mt-1">{stadium.schedule}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Stadium Ticket Management View
  const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
  const availableDates = selectedStadiumData?.scheduleDays 
    ? getAvailableDates(selectedStadiumData.scheduleDays)
    : [];

  return (
    <div>
      {/* Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              setSelectedStadium(null);
              setTicketConfig(null);
            }}
            className="text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              จัดการตั๋ว - {selectedStadiumData?.name}
            </h2>
            <p className="text-gray-400">{selectedStadiumData?.location}</p>
            <p className="text-gray-500 text-sm mt-1">{selectedStadiumData?.schedule}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedDiscountStadium(null);
                setShowDiscountTickets(true);
              }}
              className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Ticket className="w-5 h-5" />
              ตั๋วลดราคา
            </button>
            <button
              onClick={() => setShowDailyAdjustment(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Settings className="w-5 h-5" />
              ปรับตั๋วรายวัน
            </button>
          </div>
        </div>

        {/* Payment Images Management Section */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              ภาพหน้าเลือกตั๋วและชำระเงิน
            </h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            จัดการภาพที่จะแสดงในหน้าเลือกตั๋วและชำระเงิน โดยสามารถกำหนดได้ว่าภาพแต่ละภาพจะแสดงวันไหนบ้าง
          </p>
          
          {/* Add New Payment Image */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
            <h4 className="text-md font-black text-white uppercase tracking-wider mb-3">เพิ่มภาพใหม่</h4>
            
            {/* Image Upload */}
            <div className="mb-4">
              <label className="block">
                <span className="text-sm text-gray-400 mb-2 block">อัพโหลดภาพ</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentImageUpload}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              {newPaymentImage.image && (
                <div className="mt-3 relative">
                  <img
                    src={newPaymentImage.image}
                    alt="Preview"
                    className="w-full max-w-md h-auto rounded-lg border border-gray-600"
                  />
                  <button
                    onClick={() => setNewPaymentImage({ image: null, days: [] })}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="ลบภาพ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-gray-500 text-xs mt-2">
                รองรับไฟล์: JPG, PNG, WebP (ขนาดแนะนำ: 1920x1080px, สูงสุด 10MB)
              </p>
            </div>

            {/* Day Selection */}
            {newPaymentImage.image && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">เลือกวันที่จะแสดงภาพนี้</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedStadiumData?.scheduleDays?.map((day) => {
                    const dayName = getDayName(day);
                    const isChecked = newPaymentImage.days.includes(day);
                    return (
                      <label
                        key={day}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-yellow-500 text-black font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPaymentImage({ ...newPaymentImage, days: [...newPaymentImage.days, day] });
                            } else {
                              setNewPaymentImage({ ...newPaymentImage, days: newPaymentImage.days.filter(d => d !== day) });
                            }
                          }}
                          className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                        />
                        <span>วัน{dayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            {newPaymentImage.image && newPaymentImage.days.length > 0 && (
              <button
                onClick={handleSavePaymentImage}
                disabled={uploadingImage}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                บันทึกภาพ
              </button>
            )}
          </div>

          {/* Existing Payment Images List */}
          <div className="space-y-3">
            {paymentImages.length === 0 ? (
              <p className="text-gray-400 text-center py-4">ยังไม่มีภาพ</p>
            ) : (
              paymentImages.map((img) => (
                <div key={img.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={img.image}
                        alt="Payment image"
                        className="w-32 h-auto rounded-lg border border-gray-600"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">แสดงวัน: </span>
                        <span className="text-white text-sm font-semibold">
                          {img.days.map(d => getDayName(d)).join(', ')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeletePaymentImage(img.id)}
                        disabled={uploadingImage}
                        className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบภาพ
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg p-4 mb-6">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <div className="text-white">กำลังโหลดข้อมูล...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Regular Tickets Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Ticket className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                จัดการตั๋วปกติ
              </h3>
            </div>

            {/* Add Ticket Form */}
            <div className="bg-gray-900 rounded-lg p-3 md:p-4 mb-4 md:mb-6 border border-gray-700">
              <div className="bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-700">
                <h4 className="text-base md:text-lg font-black text-white uppercase tracking-wider mb-3 md:mb-4">สร้างตั๋ว</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-end mb-3 md:mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ชื่อตั๋ว</label>
                    <input
                      type="text"
                      value={newRegularTicket.name}
                      onChange={(e) => setNewRegularTicket({ ...newRegularTicket, name: e.target.value })}
                      placeholder="เช่น VIP Ringside"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ราคา (บาท)</label>
                    <input
                      type="number"
                      value={newRegularTicket.price}
                      onChange={(e) => setNewRegularTicket({ ...newRegularTicket, price: e.target.value })}
                      placeholder="2500"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">จำนวนตั๋ว</label>
                    <input
                      type="number"
                      value={newRegularTicket.quantity}
                      onChange={(e) => setNewRegularTicket({ ...newRegularTicket, quantity: e.target.value })}
                      placeholder="100"
                      min="0"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2 md:col-span-1">
                    <button
                      onClick={handleAddToPending}
                      className="flex-1 bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-semibold flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">เพิ่มในรายการ</span>
                      <span className="sm:hidden">เพิ่ม</span>
                    </button>
                    <button
                      onClick={() => {
                        setNewRegularTicket({ name: '', price: '', quantity: '' });
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-semibold"
                      title="เคลียร์ฟอร์ม"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending Tickets List */}
              {pendingTickets.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-black text-white uppercase tracking-wider">
                      ตั๋วที่รอกำหนดวัน ({pendingTickets.length} แบบ)
                    </h5>
                    <button
                      onClick={() => {
                        setPendingTickets([]);
                        setSelectedDays([]);
                      }}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      <X className="w-4 h-4" /> ล้างทั้งหมด
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {pendingTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-gray-900 rounded-lg p-3 border border-gray-600 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-white font-semibold">{ticket.name}</div>
                          <div className="text-yellow-500 text-sm font-black">฿{ticket.price.toLocaleString()}</div>
                          <div className="text-gray-400 text-xs mt-1">
                            จำนวน: {ticket.quantity} ใบ
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePendingTicket(ticket.id)}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Day Selection for all pending tickets */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">เลือกวันที่จะแสดงราคาตั๋วทั้งหมดนี้</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {selectedStadiumData?.scheduleDays?.map((day) => {
                        const dayName = getDayName(day);
                        const isChecked = selectedDays.includes(day);
                        return (
                          <label
                            key={day}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-yellow-500 text-black font-semibold'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDays([...selectedDays, day]);
                                } else {
                                  setSelectedDays(selectedDays.filter(d => d !== day));
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                            />
                            <span>วัน{dayName}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedDays.length > 0 && (
                      <p className="text-gray-400 text-xs mt-2">
                        เลือกแล้ว: {selectedDays.map(d => getDayName(d)).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePendingTickets}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      บันทึกตั๋วทั้งหมด ({pendingTickets.length} แบบ)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* All Tickets List */}
            {(() => {
              const allTickets = ticketConfig?.regularTickets || [];
              
              if (allTickets.length === 0) {
                return (
                  <p className="text-gray-400 text-center py-4">ยังไม่มีตั๋วปกติ</p>
                );
              }

              return (
                <div className="space-y-3">
                  {allTickets.map((ticket, index) => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'regular', ticket.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'regular', index)}
                      onDragEnd={handleDragEnd}
                      className={`bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between transition-all ${
                        draggedTicket?.ticketId === ticket.id ? 'opacity-50' : ''
                      } ${
                        draggedOverIndex === index && draggedTicket?.ticketId !== ticket.id
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : ''
                      }`}
                    >
                      {editingRegular === ticket.id ? (
                        <div className="w-full space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <input
                              type="text"
                              value={editRegularForm.name}
                              onChange={(e) => setEditRegularForm({ ...editRegularForm, name: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                              placeholder="ชื่อตั๋ว"
                            />
                            <input
                              type="number"
                              value={editRegularForm.price}
                              onChange={(e) => setEditRegularForm({ ...editRegularForm, price: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                              placeholder="ราคา"
                            />
                            <input
                              type="number"
                              value={editRegularForm.quantity}
                              onChange={(e) => setEditRegularForm({ ...editRegularForm, quantity: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                              placeholder="จำนวน"
                              min="0"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleUpdateRegularTicket(ticket.id, editRegularForm.name, editRegularForm.price, editRegularForm.quantity, editRegularForm.match_id, editRegularForm.match_name, editRegularForm.days);
                                }}
                                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition-colors flex items-center justify-center"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRegular(null);
                                  setEditRegularForm({ name: '', price: '', quantity: '', match_id: '', match_name: '', days: [] });
                                }}
                                className="text-gray-400 hover:text-white p-2 flex items-center justify-center"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">เลือกวันที่จะแสดงราคาตั๋วนี้</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {selectedStadiumData?.scheduleDays?.map((day) => {
                                const dayName = getDayName(day);
                                const isChecked = editRegularForm.days?.includes(day) || false;
                                return (
                                  <label
                                    key={day}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'bg-yellow-500 text-black font-semibold'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentDays = editRegularForm.days || [];
                                        if (e.target.checked) {
                                          setEditRegularForm({ ...editRegularForm, days: [...currentDays, day] });
                                        } else {
                                          setEditRegularForm({ ...editRegularForm, days: currentDays.filter(d => d !== day) });
                                        }
                                      }}
                                      className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                                    />
                                    <span>วัน{dayName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Drag Handle */}
                          <div
                            className="cursor-move text-gray-500 hover:text-yellow-500 mr-3 flex-shrink-0"
                            title="ลากเพื่อเรียงลำดับ"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{ticket.name}</div>
                            <div className="text-yellow-500 text-lg font-black">฿{parseFloat(ticket.price).toLocaleString()}</div>
                            <div className="text-gray-400 text-sm mt-1">
                              จำนวนคงเหลือ: <span className={`font-semibold ${(ticket.quantity || 0) <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                                {ticket.quantity !== undefined && ticket.quantity !== null ? ticket.quantity : 0} ใบ
                              </span>
                            </div>
                            {ticket.days && ticket.days.length > 0 && (
                              <div className="text-gray-400 text-xs mt-1">
                                วัน: {ticket.days.map(d => getDayName(d)).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                              <button
                              onClick={() => {
                                setEditingRegular(ticket.id);
                                setEditRegularForm({ 
                                  name: ticket.name, 
                                  price: ticket.price, 
                                  quantity: ticket.quantity || '',
                                  match_id: ticket.match_id !== null && ticket.match_id !== undefined ? ticket.match_id.toString() : '',
                                  match_name: ticket.match_name || '',
                                  days: ticket.days || []
                                });
                              }}
                              className="text-yellow-500 hover:text-yellow-400 p-2"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRegularTicket(ticket.id)}
                              className="text-red-500 hover:text-red-400 p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Stadium Ticket Type Detail Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6 mt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <FileText className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                Ticket Type Detail
              </h3>
            </div>
            
            {/* Error Message */}
            {ticketTypeDetailError && (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-4">
                {ticketTypeDetailError}
              </div>
            )}
            
            {/* Success Message */}
            {ticketTypeDetailSuccess && (
              <div className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg p-4 mb-4">
                {ticketTypeDetailSuccess}
              </div>
            )}
            
            <p className="text-gray-400 text-sm mb-4">
              รายละเอียดนี้จะแสดงในหน้าเลือกตั๋วและชำระเงินสำหรับสนามนี้
            </p>
            
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm text-gray-400 mb-2">
                รายละเอียดตั๋ว (Ticket Detail)
              </label>
              
              {/* Rich Text Editor */}
              <div className="mb-4">
                <style>{`
                  .quill-editor .ql-container {
                    background-color: #374151;
                    color: white;
                    min-height: 200px;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                  }
                  .quill-editor .ql-container .ql-editor {
                    color: white;
                    min-height: 200px;
                  }
                  .quill-editor .ql-container .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                  }
                  .quill-editor .ql-toolbar {
                    background-color: #1f2937;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-bottom: 1px solid #4b5563;
                  }
                  .quill-editor .ql-toolbar .ql-stroke {
                    stroke: #d1d5db;
                  }
                  .quill-editor .ql-toolbar .ql-fill {
                    fill: #d1d5db;
                  }
                  .quill-editor .ql-toolbar .ql-picker-label {
                    color: #d1d5db;
                  }
                  .quill-editor .ql-toolbar button:hover,
                  .quill-editor .ql-toolbar button.ql-active {
                    background-color: #374151;
                  }
                  .quill-editor .ql-toolbar .ql-picker-options {
                    background-color: #1f2937;
                    border: 1px solid #4b5563;
                  }
                  .quill-editor .ql-toolbar .ql-picker-item {
                    color: #d1d5db;
                  }
                  .quill-editor .ql-toolbar .ql-picker-item:hover {
                    background-color: #374151;
                  }
                `}</style>
                <ReactQuill
                  theme="snow"
                  value={stadiumTicketTypeDetail}
                  onChange={setStadiumTicketTypeDetail}
                  placeholder="เช่น PRESIDENTIAL BOX (RAJADAMNERN STADIUM) – Seats on both the left and right wings, offering a full view of the ring..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  className="quill-editor"
                  readOnly={loadingTicketTypeDetail}
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveStadiumTicketTypeDetail}
                  disabled={loadingTicketTypeDetail}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loadingTicketTypeDetail ? 'กำลังบันทึก...' : 'บันทึก Ticket Type Detail'}
                </button>
              </div>
            </div>
          </div>

          {/* Special Tickets Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                จัดการตั๋วราคาพิเศษ
              </h3>
            </div>

            {/* Add New Special Ticket */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ชื่อตั๋ว</label>
                  <input
                    type="text"
                    value={newSpecialTicket.name}
                    onChange={(e) => setNewSpecialTicket({ ...newSpecialTicket, name: e.target.value })}
                    placeholder="เช่น Early Bird"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={newSpecialTicket.price}
                    onChange={(e) => setNewSpecialTicket({ ...newSpecialTicket, price: e.target.value })}
                    placeholder="2000"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">จำนวนตั๋ว</label>
                  <input
                    type="number"
                    value={newSpecialTicket.quantity}
                    onChange={(e) => setNewSpecialTicket({ ...newSpecialTicket, quantity: e.target.value })}
                    placeholder="50"
                    min="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddSpecialTicket(false)}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                  <button
                    onClick={() => {
                      handleAddSpecialTicket(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"
                    title="เพิ่มและเคลียร์ฟอร์ม"
                  >
                    <Plus className="w-4 h-4" />
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Image Upload for Special Ticket */}
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">ภาพตั๋ว (ถ้ามี)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSpecialTicketImageUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
                />
                {specialTicketImagePreview && (
                  <div className="mt-3 relative">
                    <img
                      src={specialTicketImagePreview}
                      alt="Ticket preview"
                      className="w-full max-w-md h-auto rounded-lg border border-gray-600"
                    />
                    <button
                      onClick={() => {
                        setNewSpecialTicket({ ...newSpecialTicket, image: null });
                        setSpecialTicketImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                      title="ลบภาพ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  รองรับไฟล์: JPG, PNG, WebP (ขนาดแนะนำ: 1920x1080px, สูงสุด 10MB)
                </p>
              </div>

              {/* Calendar for Date Selection */}
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">เลือกวันที่</label>
                
                {/* Month Navigation */}
                <div className="bg-gray-800 rounded-lg p-3 md:p-4 flex items-center justify-between mb-3 md:mb-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(calendarMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCalendarMonth(newDate);
                    }}
                    className="p-1.5 md:p-2 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </button>
                  <div className="text-white text-center font-semibold text-sm md:text-base px-2">
                    {calendarMonth.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
                  </div>
                  <button
                    onClick={() => {
                      const newDate = new Date(calendarMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCalendarMonth(newDate);
                    }}
                    className="p-1.5 md:p-2 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white rotate-180" />
                  </button>
                </div>

                {/* Available Dates Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                    <div key={index} className="text-center text-gray-400 text-[10px] md:text-xs font-semibold py-1 md:py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Generate calendar days */}
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const days = [];
                    // Empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} className="p-1 md:p-2"></div>);
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      // Use local date format instead of ISO to avoid timezone issues
                      const yearStr = date.getFullYear();
                      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                      const dayStr = String(date.getDate()).padStart(2, '0');
                      const dateString = `${yearStr}-${monthStr}-${dayStr}`;
                      const isAvailable = availableDates.includes(dateString);
                      const isSelected = newSpecialTicket.date === dateString;
                      const isPast = date < today;
                      const dayOfWeek = date.getDay();
                      const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
                      const dayName = dayNames[dayOfWeek];
                      const matchName = selectedStadium ? getMatchName(selectedStadium, dayOfWeek) : '';
                      
                      // Shorten match name for mobile
                      const getShortMatchName = (name) => {
                        if (!name) return '';
                        // Extract key words or use first few characters
                        if (name.includes('RAJADAMNERN') || name.includes('RAJAD')) return 'RAJAD';
                        if (name.includes('LUMPINEE')) return 'LUMP';
                        if (name.includes('BANGLA')) return 'BANGLA';
                        if (name.includes('PATONG')) return 'PATONG';
                        if (name.includes('KIATPETCH')) return 'KIAT';
                        if (name.includes('NEW POWER')) return 'NEW';
                        if (name.includes('PETHYINDEE')) return 'PETHY';
                        if (name.includes('RWS')) return 'RWS';
                        if (name.includes('ONE')) return 'ONE';
                        return name.substring(0, 6);
                      };
                      
                      days.push(
                        <div
                          key={day}
                          onClick={() => {
                            if (isAvailable && !isPast) {
                              handleDateClick(dateString);
                            }
                          }}
                          className={`
                            p-1.5 md:p-2 text-center rounded-lg cursor-pointer transition-all min-h-[60px] md:min-h-[80px] flex flex-col justify-center items-center
                            ${isSelected 
                              ? 'bg-yellow-500 text-black font-black' 
                              : isAvailable && !isPast
                              ? 'bg-gray-700 text-white hover:bg-yellow-500/30 hover:text-yellow-500'
                              : 'text-gray-600 cursor-not-allowed'
                            }
                          `}
                          title={isAvailable && !isPast && matchName ? matchName : ''}
                        >
                          <div className="text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1 opacity-70">
                            {dayName}
                          </div>
                          <div className="text-sm md:text-lg font-bold mb-0.5 md:mb-1">
                            {day}
                          </div>
                          {isAvailable && !isPast && matchName && (
                            <>
                              {/* Mobile: Show shortened version */}
                              <div className="md:hidden text-[8px] mt-0.5 opacity-80 leading-tight px-0.5">
                                {getShortMatchName(matchName)}
                              </div>
                              {/* Desktop: Show full name */}
                              <div className="hidden md:block text-[10px] mt-1 opacity-80 leading-tight">
                                {matchName}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
                
                {newSpecialTicket.date && (
                  <p className="text-gray-400 text-sm mt-4">
                    วันที่เลือก: {new Date(newSpecialTicket.date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
              
              {(newSpecialTicket.name || newSpecialTicket.price || newSpecialTicket.date || newSpecialTicket.image) && (
                <button
                  onClick={() => {
                    setNewSpecialTicket({ name: '', price: '', date: '', quantity: '', image: null });
                    setSpecialTicketImagePreview(null);
                  }}
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mt-2"
                >
                  <X className="w-3 h-3" />
                  เคลียร์ฟอร์ม
                </button>
              )}
            </div>

            {/* Special Tickets List */}
            <div className="space-y-3">
              {(() => {
                // แสดงเฉพาะตั๋วพิเศษที่มีแมตช์พิเศษ (hasLinkedMatch === true)
                const allSpecialTickets = ticketConfig?.specialTickets || [];
                const specialTicketsWithMatches = allSpecialTickets.filter(ticket => ticket.hasLinkedMatch === true);
                return specialTicketsWithMatches.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">ยังไม่มีตั๋วราคาพิเศษที่มีแมตช์พิเศษ</p>
                ) : (
                  specialTicketsWithMatches.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    draggable={editingSpecial !== ticket.id}
                    onDragStart={(e) => editingSpecial !== ticket.id && handleDragStart(e, 'special', ticket.id)}
                    onDragOver={(e) => editingSpecial !== ticket.id && handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => editingSpecial !== ticket.id && handleDrop(e, 'special', index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-gray-900 rounded-lg p-4 border border-gray-700 transition-all ${
                      draggedTicket?.ticketId === ticket.id ? 'opacity-50' : ''
                    } ${
                      draggedOverIndex === index && draggedTicket?.ticketId !== ticket.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : ''
                    }`}
                  >
                    {editingSpecial === ticket.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          <input
                            type="text"
                            value={editSpecialForm.name}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, name: e.target.value })}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            placeholder="ชื่อตั๋ว"
                          />
                          <input
                            type="number"
                            value={editSpecialForm.price}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, price: e.target.value })}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            placeholder="ราคา"
                          />
                          <input
                            type="date"
                            value={editSpecialForm.date}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              if (isValidDateForStadium(newDate, selectedStadiumData?.scheduleDays)) {
                                setEditSpecialForm({ ...editSpecialForm, date: newDate });
                              } else {
                                setError('วันที่ต้องตรงกับวันชกของสนามตามตารางเวลา');
                              }
                            }}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                          />
                          <input
                            type="number"
                            value={editSpecialForm.quantity}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, quantity: e.target.value })}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            placeholder="จำนวน"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">ภาพตั๋ว</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              
                              const validation = validateImage(file, 10);
                              if (!validation.valid) {
                                setError(validation.error);
                                setTimeout(() => setError(''), 3000);
                                return;
                              }
                              
                              try {
                                const compressedImage = await compressImage(file, 1920, 1080, 0.85);
                                setEditSpecialForm({ ...editSpecialForm, image: compressedImage });
                              } catch (err) {
                                console.error('Error compressing image:', err);
                                setError('เกิดข้อผิดพลาดในการประมวลผลภาพ');
                                setTimeout(() => setError(''), 3000);
                              } finally {
                                e.target.value = '';
                              }
                            }}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
                          />
                          {editSpecialForm.image && (
                            <div className="mt-2 relative">
                              <img
                                src={editSpecialForm.image}
                                alt="Ticket preview"
                                className="w-32 h-auto rounded-lg border border-gray-600"
                              />
                              <button
                                onClick={() => setEditSpecialForm({ ...editSpecialForm, image: null })}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleUpdateSpecialTicket(ticket.id, editSpecialForm.name, editSpecialForm.price, editSpecialForm.date, editSpecialForm.quantity, editSpecialForm.image);
                            }}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            บันทึก
                          </button>
                          <button
                            onClick={() => {
                              setEditingSpecial(null);
                              setEditSpecialForm({ name: '', price: '', date: '', quantity: '', image: null });
                            }}
                            className="text-gray-400 hover:text-white p-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {/* Drag Handle */}
                        <div
                          className="cursor-move text-gray-500 hover:text-yellow-500 mr-3 flex-shrink-0"
                          title="ลากเพื่อเรียงลำดับ"
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{ticket.name}</div>
                          <div className="text-yellow-500 text-lg font-black">฿{parseFloat(ticket.price).toLocaleString()}</div>
                          <div className="text-gray-400 text-sm">
                            {ticket.date ? (() => {
                              // Parse date string directly to avoid timezone issues
                              const [year, month, day] = ticket.date.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })() : ''}
                          </div>
                          <div className="text-gray-400 text-sm mt-1">
                            จำนวนคงเหลือ: <span className={`font-semibold ${(ticket.quantity || 0) <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                              {ticket.quantity !== undefined && ticket.quantity !== null ? ticket.quantity : 0} ใบ
                            </span>
                          </div>
                          {ticket.hasLinkedMatch !== undefined && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                ticket.hasLinkedMatch
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}>
                                {ticket.hasLinkedMatch ? '✓ เชื่อมโยงกับแมตช์พิเศษแล้ว' : '⚠ ยังไม่มีแมตช์พิเศษ'}
                              </span>
                            </div>
                          )}
                          {ticket.image && (
                            <div className="mt-2">
                              <img
                                src={ticket.image}
                                alt="Ticket image"
                                className="w-32 h-auto rounded-lg border border-gray-600"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSpecial(ticket.id);
                              setEditSpecialForm({ name: ticket.name, price: ticket.price, date: ticket.date, quantity: ticket.quantity || '', image: ticket.image || null });
                            }}
                            className="text-yellow-500 hover:text-yellow-400 p-2"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpecialTicket(ticket.id)}
                            className="text-red-500 hover:text-red-400 p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  ))
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketsManagement;
