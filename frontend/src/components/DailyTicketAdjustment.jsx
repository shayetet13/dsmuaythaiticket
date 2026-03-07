import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowLeft, ChevronLeft, Save, Edit2, X, Power, Plus, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getStadiums, getStadiumImageSchedules, getSpecialMatches, getDailyImages } from '../db/imagesDb';
import { API_URL, getAdminAxiosConfig } from '../config/api.js';
import { getMatchName } from '../utils/formatHelpers';
import Toast, { ConfirmationToast } from './Toast';

const DailyTicketAdjustment = ({ onClose }) => {
  const [stadiums, setStadiums] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [tickets, setTickets] = useState({ regularTickets: [], specialTickets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingTicket, setEditingTicket] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', quantity: '', enabled: true });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ name: '', price: '', quantity: '' });
  const [stadiumImageSchedules, setStadiumImageSchedules] = useState({});
  const [specialMatches, setSpecialMatches] = useState([]);
  const [dailyImages, setDailyImages] = useState([]);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenStatus, setAutoGenStatus] = useState(null);
  const [autoGenResult, setAutoGenResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadStadiums();
    loadMatchData();
  }, []);

  useEffect(() => {
    if (selectedStadium === 'rajadamnern') {
      loadAutoGenStatus();
    }
  }, [selectedStadium]);

  useEffect(() => {
    if (selectedStadium && selectedDate) {
      loadTicketsForDate();
    }
  }, [selectedStadium, selectedDate]);

  const loadMatchData = async () => {
    try {
      const [schedules, matches, images] = await Promise.all([
        getStadiumImageSchedules(),
        getSpecialMatches(),
        getDailyImages()
      ]);
      setStadiumImageSchedules(schedules);
      setSpecialMatches(matches);
      setDailyImages(images);
    } catch (err) {
      console.error('Error loading match data:', err);
    }
  };

  const loadAutoGenStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/stadiums/rajadamnern/tickets/auto-generate/status`,
        getAdminAxiosConfig()
      );
      setAutoGenStatus(response.data);
    } catch (err) {
      console.error('Error loading auto-gen status:', err);
      setAutoGenStatus(null);
    }
  };

  const handleGenerateNextMonth = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmDialog(false);
    setAutoGenLoading(true);
    setError('');
    setSuccess('');
    setAutoGenResult(null);

    try {
      const response = await axios.post(
        `${API_URL}/stadiums/rajadamnern/tickets/auto-generate`,
        {},
        getAdminAxiosConfig()
      );
      setAutoGenResult(response.data.result);
      const successMessage = `สร้างตั๋วสำเร็จ! สร้าง ${response.data.result.ticketsCreated} ตั๋ว, ข้าม ${response.data.result.ticketsSkipped} ตั๋ว, วันที่สร้าง ${response.data.result.datesProcessed} วัน`;
      setSuccess(successMessage);
      setToast({ message: successMessage, type: 'success' });
      setTimeout(() => {
        setSuccess('');
        setToast(null);
      }, 5000);
      
      // Reload tickets if a date is selected
      if (selectedDate) {
        await loadTicketsForDate();
      }
      await loadAutoGenStatus();
    } catch (err) {
      console.error('Error generating tickets:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'ไม่สามารถสร้างตั๋วได้';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setAutoGenLoading(false);
    }
  };

  const handleCancelGenerate = () => {
    setShowConfirmDialog(false);
  };

  const loadStadiums = async () => {
    try {
      const stadiumsData = await getStadiums('th');
      setStadiums(stadiumsData);
    } catch (err) {
      console.error('Error loading stadiums:', err);
      setError('ไม่สามารถโหลดข้อมูลสนามได้');
    }
  };

  const loadTicketsForDate = async () => {
    if (!selectedStadium || !selectedDate) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/stadiums/${selectedStadium}/tickets/date/${selectedDate}`);
      setTickets(response.data);
    } catch (err) {
      console.error('Error loading tickets for date:', err);
      setError('ไม่สามารถโหลดข้อมูลตั๋วได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateString) => {
    setSelectedDate(dateString);
    setEditingTicket(null);
    setShowCreateForm(false);
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket.id);
    setEditForm({
      name: ticket.name,
      price: ticket.price,
      quantity: ticket.quantity,
      enabled: ticket.enabled
    });
  };

  const handleSaveTicket = async () => {
    if (!selectedStadium || !selectedDate || !editingTicket) return;
    
    const ticket = tickets.regularTickets.find(t => t.id === editingTicket) ||
                   tickets.specialTickets.find(t => t.id === editingTicket);
    
    if (!ticket) return;

    setLoading(true);
    setError('');
    try {
      await axios.put(
        `${API_URL}/stadiums/${selectedStadium}/tickets/date/${selectedDate}/${ticket.id}`,
        {
          ticket_type: ticket.ticket_type,
          name_override: editForm.name !== ticket.original_name ? editForm.name : null,
          price_override: editForm.price !== ticket.original_price ? parseFloat(editForm.price) : null,
          quantity: parseInt(editForm.quantity),
          enabled: editForm.enabled
        }
      );
      
      setSuccess('บันทึกข้อมูลตั๋วสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      setEditingTicket(null);
      await loadTicketsForDate();
    } catch (err) {
      console.error('Error saving ticket:', err);
      setError('ไม่สามารถบันทึกข้อมูลตั๋วได้');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTicketEnabled = async (ticket) => {
    if (!selectedStadium || !selectedDate) return;
    
    const newEnabled = !ticket.enabled;
    setLoading(true);
    setError('');
    try {
      await axios.put(
        `${API_URL}/stadiums/${selectedStadium}/tickets/date/${selectedDate}/${ticket.id}`,
        {
          ticket_type: ticket.ticket_type,
          enabled: newEnabled
        }
      );
      
      setSuccess(`${newEnabled ? 'เปิด' : 'ปิด'}การขายตั๋ว "${ticket.name}" สำเร็จ!`);
      setTimeout(() => setSuccess(''), 3000);
      await loadTicketsForDate();
    } catch (err) {
      console.error('Error toggling ticket enabled status:', err);
      setError('ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedStadium || !selectedDate) return;
    
    if (!newTicketForm.name || !newTicketForm.price || !newTicketForm.quantity) {
      setError('กรุณากรอกชื่อตั๋ว ราคา และจำนวนให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(
        `${API_URL}/stadiums/${selectedStadium}/tickets/special`,
        {
          name: newTicketForm.name,
          price: parseFloat(newTicketForm.price),
          date: selectedDate,
          quantity: parseInt(newTicketForm.quantity)
        }
      );
      
      setSuccess('สร้างตั๋วใหม่สำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      setShowCreateForm(false);
      setNewTicketForm({ name: '', price: '', quantity: '' });
      await loadTicketsForDate();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.response?.data?.error || 'ไม่สามารถสร้างตั๋วได้');
    } finally {
      setLoading(false);
    }
  };

  // Use utility function for match name
  const getMatchNameLocal = (stadiumId, dayOfWeek, dateString) => 
    getMatchName(stadiumId, dayOfWeek, dateString, stadiumImageSchedules, specialMatches, dailyImages);

  // Get available dates based on scheduleDays
  const getAvailableDates = () => {
    if (!selectedStadium) return [];
    
    const stadium = stadiums.find(s => s.id === selectedStadium);
    if (!stadium?.scheduleDays || stadium.scheduleDays.length === 0) return [];
    
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day, 12, 0, 0);
      const dayOfWeek = date.getDay();
      
      if (date >= today && stadium.scheduleDays.includes(dayOfWeek)) {
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${yearStr}-${monthStr}-${dayStr}`;
        dates.push(dateString);
      }
    }
    
    return dates;
  };

  // Stadium Selection View
  if (!selectedStadium) {
    return (
      <div>
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onClose}
              className="text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                ปรับตั๋วรายวัน
              </h2>
              <p className="text-gray-400">เลือกสนามเพื่อปรับตั๋วรายวัน</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

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

  const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
  const availableDates = getAvailableDates();

  // Calendar View
  if (!selectedDate) {
    return (
      <div>
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        {/* Confirmation Dialog for Generate */}
        <ConfirmationToast
          message="คุณต้องการสร้างตั๋วสำหรับเดือนถัดไปหรือไม่? (จะสร้าง special tickets สำหรับทุกวันในเดือนถัดไป)"
          onConfirm={handleConfirmGenerate}
          onCancel={handleCancelGenerate}
          isOpen={showConfirmDialog}
        />

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setSelectedStadium(null)}
              className="text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                ปรับตั๋วรายวัน - {selectedStadiumData?.name}
              </h2>
              <p className="text-gray-400">เลือกวันที่ต้องการปรับตั๋ว</p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
          {/* Month Navigation */}
          <div className="bg-gray-900 rounded-lg p-3 md:p-4 flex items-center justify-between mb-3 md:mb-4">
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
              <div key={index} className="text-center text-gray-400 text-[10px] md:text-xs font-semibold py-1 md:py-2">
                {day}
              </div>
            ))}
            
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
                const yearStr = date.getFullYear();
                const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                const dayStr = String(date.getDate()).padStart(2, '0');
                const dateString = `${yearStr}-${monthStr}-${dayStr}`;
                const isAvailable = availableDates.includes(dateString);
                const isSelected = selectedDate === dateString;
                const isPast = date < today;
                const dayOfWeek = date.getDay();
                const matchName = isAvailable && !isPast ? getMatchNameLocal(selectedStadium, dayOfWeek, dateString) : '';
                
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
                  if (name.includes('PETHYINDEE') || name.includes('PETHY')) return 'PETHY';
                  if (name.includes('RWS')) return 'RWS';
                  if (name.includes('ONE')) return 'ONE';
                  return name.substring(0, 6);
                };
                
                days.push(
                  <div
                    key={day}
                    onClick={() => {
                      if (isAvailable && !isPast) {
                        setShowCreateForm(false);
                        setNewTicketForm({ name: '', price: '', quantity: '' });
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
        </div>

        {/* Auto Generation Section for RAJADAMNERN */}
        {selectedStadium === 'rajadamnern' && (
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">
                  เพิ่มตั๋วอัตโนมัติเดือนถัดไป
                </h3>
                <p className="text-gray-400 text-sm">
                  สร้าง special tickets ทั้ง 8 แบบสำหรับทุกวันในเดือนถัดไป (เฉพาะตั๋วที่ยังไม่มี)
                </p>
              </div>
              <button
                onClick={handleGenerateNextMonth}
                disabled={autoGenLoading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoGenLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    เพิ่มตั๋วเดือนถัดไป
                  </>
                )}
              </button>
            </div>

            {/* Ticket Templates List */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">รายการตั๋วที่จะสร้าง (8 แบบ):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {autoGenStatus?.templates?.map((ticket, index) => (
                  <div key={index} className="bg-gray-800 rounded p-2 border border-gray-700">
                    <div className="text-white text-sm font-semibold truncate">{ticket.name}</div>
                    <div className="text-yellow-500 text-xs font-bold">฿{ticket.price.toLocaleString()}</div>
                    <div className="text-gray-400 text-xs">จำนวน: {ticket.quantity} ใบ</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            {autoGenStatus && (
              <div className="text-xs text-gray-400 mb-4">
                {autoGenStatus.lastGeneratedDate ? (
                  <span>สร้างครั้งล่าสุด: {new Date(autoGenStatus.lastGeneratedDate).toLocaleString('th-TH')}</span>
                ) : (
                  <span className="text-yellow-400">ยังไม่เคยสร้าง</span>
                )}
              </div>
            )}

            {/* Generate Result */}
            {autoGenResult && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="text-green-400 text-sm font-semibold mb-2">ผลลัพธ์การสร้าง:</div>
                <div className="text-white text-xs space-y-1">
                  <div>ตั๋วที่สร้าง: {autoGenResult.ticketsCreated} ตั๋ว</div>
                  <div>ตั๋วที่ข้าม (มีอยู่แล้ว): {autoGenResult.ticketsSkipped} ตั๋ว</div>
                  <div>วันที่สร้าง: {autoGenResult.datesProcessed} วัน</div>
                  {autoGenResult.dateDetails && autoGenResult.dateDetails.length > 0 && (
                    <div className="mt-2">
                      <div className="text-green-300 text-xs font-semibold">รายละเอียดแต่ละวัน:</div>
                      <div className="text-gray-300 text-xs mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {autoGenResult.dateDetails.slice(0, 10).map((detail, idx) => (
                          <div key={idx}>
                            {detail.date}: สร้าง {detail.ticketsCreated} ตั๋ว, ข้าม {detail.ticketsSkipped} ตั๋ว
                          </div>
                        ))}
                        {autoGenResult.dateDetails.length > 10 && (
                          <div className="text-gray-400">... และอีก {autoGenResult.dateDetails.length - 10} วัน</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Ticket Editing View
  // Remove duplicate tickets by ID (ป้องกันการแสดงตั๋วซ้ำกัน)
  // Sort tickets by price: highest to lowest (แพงสุดไปถูกสุด)
  const allTicketsMap = new Map();
  
  // Add regular tickets first (they have priority)
  if (tickets.regularTickets) {
    tickets.regularTickets.forEach(ticket => {
      if (ticket.id && !allTicketsMap.has(ticket.id)) {
        allTicketsMap.set(ticket.id, ticket);
      }
    });
  }
  
  // Add special tickets (skip if ID already exists)
  if (tickets.specialTickets) {
    tickets.specialTickets.forEach(ticket => {
      if (ticket.id && !allTicketsMap.has(ticket.id)) {
        allTicketsMap.set(ticket.id, ticket);
      }
    });
  }
  
  const allTickets = Array.from(allTicketsMap.values())
    .sort((a, b) => b.price - a.price);

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Confirmation Dialog for Generate */}
      <ConfirmationToast
        message="คุณต้องการสร้างตั๋วสำหรับเดือนถัดไปหรือไม่? (จะสร้าง special tickets สำหรับทุกวันในเดือนถัดไป)"
        onConfirm={handleConfirmGenerate}
        onCancel={handleCancelGenerate}
        isOpen={showConfirmDialog}
      />

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                setSelectedDate(null);
                setEditingTicket(null);
                setShowCreateForm(false);
                setNewTicketForm({ name: '', price: '', quantity: '' });
              }}
              className="text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              ปรับตั๋วรายวัน - {selectedStadiumData?.name}
            </h2>
            <p className="text-gray-400">
              วันที่: {new Date(selectedDate + 'T12:00:00').toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg p-4 mb-6">
          {success}
        </div>
      )}

      {/* Create New Ticket Form */}
      {showCreateForm && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">เพิ่มตั๋วใหม่</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewTicketForm({ name: '', price: '', quantity: '' });
                setError('');
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">ชื่อตั๋ว *</label>
              <input
                type="text"
                value={newTicketForm.name}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="ชื่อตั๋ว"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">ราคา (บาท) *</label>
              <input
                type="number"
                value={newTicketForm.price}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, price: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="ราคา"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">จำนวนตั๋ว *</label>
              <input
                type="number"
                value={newTicketForm.quantity}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, quantity: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="จำนวน"
                min="0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTicket}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              สร้างตั๋ว
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewTicketForm({ name: '', price: '', quantity: '' });
                setError('');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Add Ticket Button */}
      {!showCreateForm && (
        <div className="mb-4">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingTicket(null);
              setError('');
            }}
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            เพิ่มตั๋วใหม่
          </button>
        </div>
      )}

      {loading && !tickets.regularTickets.length && !tickets.specialTickets.length && !showCreateForm ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <div className="text-white">กำลังโหลดข้อมูล...</div>
        </div>
      ) : allTickets.length === 0 && !showCreateForm ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <div className="text-gray-400">ไม่มีตั๋วสำหรับวันนี้</div>
        </div>
      ) : (
        <div className="space-y-4">
          {allTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4"
            >
              {editingTicket === ticket.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">ชื่อตั๋ว</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        placeholder="ชื่อตั๋ว"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">ราคา (บาท)</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        placeholder="ราคา"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">จำนวนตั๋ว</label>
                      <input
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        placeholder="จำนวน"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.enabled}
                          onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                          className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-400">เปิดการขาย</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTicket}
                      disabled={loading}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      บันทึก
                    </button>
                    <button
                      onClick={() => {
                        setEditingTicket(null);
                        setEditForm({ name: '', price: '', quantity: '', enabled: true });
                      }}
                      className="text-gray-400 hover:text-white p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{ticket.name}</div>
                    <div className="text-yellow-500 text-lg font-black">฿{parseFloat(ticket.price).toLocaleString()}</div>
                    <div className="text-gray-400 text-sm mt-1">
                      จำนวนคงเหลือ: <span className={`font-semibold ${ticket.quantity <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                        {ticket.quantity} ใบ
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {ticket.name !== ticket.original_name && (
                        <span className="text-gray-500 text-xs">(ชื่อเดิม: {ticket.original_name})</span>
                      )}
                      {ticket.price !== ticket.original_price && (
                        <span className="text-gray-500 text-xs">(ราคาเดิม: ฿{ticket.original_price.toLocaleString()})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">เปิดการขาย:</span>
                      <button
                        onClick={() => handleToggleTicketEnabled(ticket)}
                        disabled={loading}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${ticket.enabled ? 'bg-green-500' : 'bg-gray-600'}
                          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={ticket.enabled ? 'ปิดการขายตั๋วนี้' : 'เปิดการขายตั๋วนี้'}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${ticket.enabled ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                    <button
                      onClick={() => handleEditTicket(ticket)}
                      className="text-yellow-500 hover:text-yellow-400 p-2"
                      title="แก้ไขตั๋ว"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyTicketAdjustment;
