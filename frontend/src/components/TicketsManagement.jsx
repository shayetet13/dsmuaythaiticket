import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Plus, X, Save, Trash2, Edit2, ArrowLeft, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { getStadiums } from '../db/imagesDb';

const API_URL = 'http://localhost:5000/api';

const TicketsManagement = () => {
  const [stadiums, setStadiums] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [ticketConfig, setTicketConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRegular, setEditingRegular] = useState(null);
  const [editingSpecial, setEditingSpecial] = useState(null);
  const [editRegularForm, setEditRegularForm] = useState({ name: '', price: '', quantity: '' });
  const [editSpecialForm, setEditSpecialForm] = useState({ name: '', price: '', date: '', quantity: '' });
  const [newRegularTicket, setNewRegularTicket] = useState({ name: '', price: '', quantity: '' });
  const [newSpecialTicket, setNewSpecialTicket] = useState({ name: '', price: '', date: '', quantity: '' });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    loadStadiums();
  }, []);

  useEffect(() => {
    if (selectedStadium) {
      loadTicketConfig(selectedStadium);
    }
  }, [selectedStadium]);

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
      console.log('Loading ticket config for stadium:', stadiumId);
      const response = await axios.get(`${API_URL}/stadiums/${stadiumId}/tickets`);
      console.log('Ticket config loaded:', response.data);
      console.log('Regular tickets count:', response.data?.regularTickets?.length || 0);
      console.log('Special tickets count:', response.data?.specialTickets?.length || 0);
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
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      if (date >= today && scheduleDays.includes(dayOfWeek)) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  // Check if a date is valid for the stadium
  const isValidDateForStadium = (dateString, scheduleDays) => {
    if (!scheduleDays || scheduleDays.length === 0) return false;
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return scheduleDays.includes(dayOfWeek);
  };

  const handleAddRegularTicket = async (clearForm = false) => {
    if (!selectedStadium || !newRegularTicket.name || !newRegularTicket.price) {
      setError('กรุณากรอกชื่อและราคาตั๋ว');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/stadiums/${selectedStadium}/tickets/regular`, {
        name: newRegularTicket.name,
        price: newRegularTicket.price,
        quantity: newRegularTicket.quantity || 0
      });
      
      console.log('Ticket added successfully:', response.data);
      setError('');
      setSuccess('เพิ่มตั๋วสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload ticket config to show new ticket
      console.log('Reloading ticket config for:', selectedStadium);
      await loadTicketConfig(selectedStadium);
      
      // Only clear form if explicitly requested
      if (clearForm) {
        setNewRegularTicket({ name: '', price: '', quantity: '' });
      }
    } catch (err) {
      console.error('Error adding regular ticket:', err);
      const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถเพิ่มตั๋วได้';
      setError(`ไม่สามารถเพิ่มตั๋วได้: ${errorMessage}`);
      setSuccess('');
    }
  };

  const handleUpdateRegularTicket = async (ticketId, name, price, quantity) => {
    if (!selectedStadium || !name || !price) return;

    try {
      await axios.put(`${API_URL}/stadiums/${selectedStadium}/tickets/regular/${ticketId}`, {
        name,
        price,
        quantity: quantity || 0
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
      const response = await axios.post(`${API_URL}/stadiums/${selectedStadium}/tickets/special`, {
        name: newSpecialTicket.name,
        price: newSpecialTicket.price,
        date: newSpecialTicket.date,
        quantity: newSpecialTicket.quantity || 0,
        scheduleDays: selectedStadiumData.scheduleDays
      });
      
      console.log('Special ticket added successfully:', response.data);
      setError('');
      setSuccess('เพิ่มตั๋วราคาพิเศษสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload ticket config to show new ticket
      await loadTicketConfig(selectedStadium);
      
      // Only clear form if explicitly requested
      if (clearForm) {
        setNewSpecialTicket({ name: '', price: '', date: '', quantity: '' });
      }
    } catch (err) {
      console.error('Error adding special ticket:', err);
      const errorMessage = err.response?.data?.error || err.message || 'ไม่สามารถเพิ่มตั๋วราคาพิเศษได้';
      setError(`ไม่สามารถเพิ่มตั๋วราคาพิเศษได้: ${errorMessage}`);
      setSuccess('');
    }
  };

  const handleUpdateSpecialTicket = async (ticketId, name, price, date, quantity) => {
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
      await axios.put(`${API_URL}/stadiums/${selectedStadium}/tickets/special/${ticketId}`, {
        name,
        price,
        date,
        quantity: quantity || 0,
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

  if (loading && !selectedStadium) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <div className="text-white">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  // Stadium Selection View
  if (!selectedStadium) {
    return (
      <div>
        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
            จัดการตั๋ว
          </h2>
          <p className="text-gray-400">เลือกสนามเพื่อจัดการตั๋ว</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Stadiums Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              จัดการตั๋ว - {selectedStadiumData?.name}
            </h2>
            <p className="text-gray-400">{selectedStadiumData?.location}</p>
            <p className="text-gray-500 text-sm mt-1">{selectedStadiumData?.schedule}</p>
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                จัดการตั๋วปกติ
              </h3>
            </div>

            {/* Add New Regular Ticket */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ชื่อตั๋ว</label>
                  <input
                    type="text"
                    value={newRegularTicket.name}
                    onChange={(e) => setNewRegularTicket({ ...newRegularTicket, name: e.target.value })}
                    placeholder="เช่น VIP Ringside"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={newRegularTicket.price}
                    onChange={(e) => setNewRegularTicket({ ...newRegularTicket, price: e.target.value })}
                    placeholder="2500"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
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
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddRegularTicket(false)}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                  <button
                    onClick={() => {
                      handleAddRegularTicket(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"
                    title="เพิ่มและเคลียร์ฟอร์ม"
                  >
                    <Plus className="w-4 h-4" />
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {(newRegularTicket.name || newRegularTicket.price) && (
                <button
                  onClick={() => setNewRegularTicket({ name: '', price: '', quantity: '' })}
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  เคลียร์ฟอร์ม
                </button>
              )}
            </div>

            {/* Regular Tickets List */}
            <div className="space-y-3">
              {ticketConfig?.regularTickets?.length === 0 ? (
                <p className="text-gray-400 text-center py-4">ยังไม่มีตั๋วปกติ</p>
              ) : (
                ticketConfig?.regularTickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                  >
                    {editingRegular === ticket.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                        <input
                          type="text"
                          value={editRegularForm.name}
                          onChange={(e) => setEditRegularForm({ ...editRegularForm, name: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                          placeholder="ชื่อตั๋ว"
                        />
                        <input
                          type="number"
                          value={editRegularForm.price}
                          onChange={(e) => setEditRegularForm({ ...editRegularForm, price: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                          placeholder="ราคา"
                        />
                        <input
                          type="number"
                          value={editRegularForm.quantity}
                          onChange={(e) => setEditRegularForm({ ...editRegularForm, quantity: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                          placeholder="จำนวน"
                          min="0"
                        />
                        <button
                          onClick={() => {
                            handleUpdateRegularTicket(ticket.id, editRegularForm.name, editRegularForm.price, editRegularForm.quantity);
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition-colors flex items-center justify-center"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRegular(null);
                            setEditRegularForm({ name: '', price: '', quantity: '' });
                          }}
                          className="text-gray-400 hover:text-white p-2 flex items-center justify-center"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{ticket.name}</div>
                          <div className="text-yellow-500 text-lg font-black">฿{parseFloat(ticket.price).toLocaleString()}</div>
                          <div className="text-gray-400 text-sm mt-1">
                            จำนวนคงเหลือ: <span className={`font-semibold ${(ticket.quantity || 0) <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                              {ticket.quantity !== undefined && ticket.quantity !== null ? ticket.quantity : 0} ใบ
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingRegular(ticket.id);
                              setEditRegularForm({ name: ticket.name, price: ticket.price, quantity: ticket.quantity || '' });
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
                ))
              )}
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

              {/* Calendar for Date Selection */}
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">เลือกวันที่</label>
                
                {/* Month Navigation */}
                <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(calendarMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCalendarMonth(newDate);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="text-white text-center font-semibold">
                    {calendarMonth.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
                  </div>
                  <button
                    onClick={() => {
                      const newDate = new Date(calendarMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCalendarMonth(newDate);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white rotate-180" />
                  </button>
                </div>

                {/* Available Dates Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                    <div key={index} className="text-center text-gray-400 text-xs font-semibold py-2">
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
                      days.push(<div key={`empty-${i}`} className="p-2"></div>);
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const dateString = date.toISOString().split('T')[0];
                      const isAvailable = availableDates.includes(dateString);
                      const isSelected = newSpecialTicket.date === dateString;
                      const isPast = date < today;
                      
                      days.push(
                        <div
                          key={day}
                          onClick={() => {
                            if (isAvailable && !isPast) {
                              handleDateClick(dateString);
                            }
                          }}
                          className={`
                            p-2 text-center rounded-lg cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-yellow-500 text-black font-black' 
                              : isAvailable && !isPast
                              ? 'bg-gray-700 text-white hover:bg-yellow-500/30 hover:text-yellow-500'
                              : 'text-gray-600 cursor-not-allowed'
                            }
                          `}
                        >
                          {day}
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
              
              {(newSpecialTicket.name || newSpecialTicket.price || newSpecialTicket.date) && (
                <button
                  onClick={() => setNewSpecialTicket({ name: '', price: '', date: '', quantity: '' })}
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mt-2"
                >
                  <X className="w-3 h-3" />
                  เคลียร์ฟอร์ม
                </button>
              )}
            </div>

            {/* Special Tickets List */}
            <div className="space-y-3">
              {!ticketConfig?.specialTickets || ticketConfig.specialTickets.length === 0 ? (
                <p className="text-gray-400 text-center py-4">ยังไม่มีตั๋วราคาพิเศษ</p>
              ) : (
                ticketConfig.specialTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    {editingSpecial === ticket.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleUpdateSpecialTicket(ticket.id, editSpecialForm.name, editSpecialForm.price, editSpecialForm.date, editSpecialForm.quantity);
                            }}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            บันทึก
                          </button>
                          <button
                            onClick={() => {
                              setEditingSpecial(null);
                              setEditSpecialForm({ name: '', price: '', date: '', quantity: '' });
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
                          <div className="text-gray-400 text-sm">
                            {new Date(ticket.date).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-gray-400 text-sm mt-1">
                            จำนวนคงเหลือ: <span className={`font-semibold ${(ticket.quantity || 0) <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                              {ticket.quantity !== undefined && ticket.quantity !== null ? ticket.quantity : 0} ใบ
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSpecial(ticket.id);
                              setEditSpecialForm({ name: ticket.name, price: ticket.price, date: ticket.date, quantity: ticket.quantity || '' });
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsManagement;
