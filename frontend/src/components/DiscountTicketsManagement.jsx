import React, { useState, useEffect } from 'react';
import { Ticket, ArrowLeft, Plus, X, Save, Trash2, Edit2, MapPin, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL, getAdminAxiosConfig } from '../config/api.js';

const DiscountTicketsManagement = ({ stadiums, selectedStadium, onSelectStadium, onClose }) => {
  const [discountTickets, setDiscountTickets] = useState([]);
  const [ticketConfig, setTicketConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [editForm, setEditForm] = useState({ discount_price: '', day_of_month: '', month: '' });
  const [newDiscount, setNewDiscount] = useState({ base_ticket_id: '', base_ticket_type: 'regular', discount_price: '', day_of_month: '', month: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [editSelectedMonth, setEditSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12

  useEffect(() => {
    if (selectedStadium) {
      loadDiscountTickets();
      loadTicketConfig();
    }
  }, [selectedStadium]);

  const loadDiscountTickets = async () => {
    if (!selectedStadium) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/stadiums/${selectedStadium}/discount-tickets`,
        getAdminAxiosConfig()
      );
      setDiscountTickets(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading discount tickets:', err);
      setError('ไม่สามารถโหลดข้อมูลตั๋วลดราคาได้');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketConfig = async () => {
    if (!selectedStadium) return;
    try {
      const response = await axios.get(`${API_URL}/stadiums/${selectedStadium}/tickets`);
      setTicketConfig(response.data);
    } catch (err) {
      console.error('Error loading ticket config:', err);
    }
  };

  const handleCreateDiscount = async () => {
    if (!selectedStadium || !newDiscount.base_ticket_id || !newDiscount.discount_price || !newDiscount.day_of_month || !newDiscount.month) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/stadiums/${selectedStadium}/discount-tickets`,
        {
          base_ticket_id: newDiscount.base_ticket_id,
          base_ticket_type: newDiscount.base_ticket_type,
          discount_price: parseFloat(newDiscount.discount_price),
          day_of_month: parseInt(newDiscount.day_of_month),
          month: parseInt(newDiscount.month)
        },
        getAdminAxiosConfig()
      );
      
      setError('');
      setSuccess('เพิ่มตั๋วลดราคาสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      setNewDiscount({ base_ticket_id: '', base_ticket_type: 'regular', discount_price: '', day_of_month: '', month: '' });
      await loadDiscountTickets();
    } catch (err) {
      console.error('Error creating discount ticket:', err);
      setError(err.response?.data?.error || 'ไม่สามารถเพิ่มตั๋วลดราคาได้');
    }
  };

  const handleUpdateDiscount = async (discountTicketId) => {
    if (!selectedStadium) return;

    try {
      await axios.put(
        `${API_URL}/stadiums/${selectedStadium}/discount-tickets/${discountTicketId}`,
        {
          discount_price: parseFloat(editForm.discount_price),
          day_of_month: parseInt(editForm.day_of_month),
          month: parseInt(editForm.month)
        },
        getAdminAxiosConfig()
      );
      
      setEditingDiscount(null);
      setError('');
      setSuccess('อัปเดตตั๋วลดราคาสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      await loadDiscountTickets();
    } catch (err) {
      console.error('Error updating discount ticket:', err);
      setError(err.response?.data?.error || 'ไม่สามารถอัปเดตตั๋วลดราคาได้');
    }
  };

  const handleDeleteDiscount = async (discountTicketId) => {
    if (!selectedStadium || !confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตั๋วลดราคานี้?')) return;

    try {
      await axios.delete(
        `${API_URL}/stadiums/${selectedStadium}/discount-tickets/${discountTicketId}`,
        getAdminAxiosConfig()
      );
      setError('');
      setSuccess('ลบตั๋วลดราคาสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      await loadDiscountTickets();
    } catch (err) {
      console.error('Error deleting discount ticket:', err);
      setError('ไม่สามารถลบตั๋วลดราคาได้');
    }
  };

  const getTicketName = (ticketId, ticketType) => {
    if (!ticketConfig) return ticketId;
    const tickets = ticketType === 'regular' ? ticketConfig.regularTickets : ticketConfig.specialTickets;
    const ticket = tickets?.find(t => t.id === ticketId);
    return ticket ? ticket.name : ticketId;
  };

  const getTicketPrice = (ticketId, ticketType) => {
    if (!ticketConfig) return 0;
    const tickets = ticketType === 'regular' ? ticketConfig.regularTickets : ticketConfig.specialTickets;
    const ticket = tickets?.find(t => t.id === ticketId);
    return ticket ? ticket.price : 0;
  };

  const getMonthName = (month) => {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                     'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[month - 1] || '';
  };

  // Stadium Selection View
  if (!selectedStadium) {
    return (
      <div>
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
                จัดการตั๋วลดราคา
              </h2>
              <p className="text-gray-400">เลือกสนามเพื่อจัดการตั๋วลดราคา</p>
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
              onClick={() => onSelectStadium(stadium.id)}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 cursor-pointer hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <MapPin className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                    {stadium.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{stadium.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
  const regularTickets = ticketConfig?.regularTickets || [];
  const specialTickets = ticketConfig?.specialTickets || [];

  return (
    <div>
      {/* Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onSelectStadium(null)}
            className="text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              จัดการตั๋วลดราคา - {selectedStadiumData?.name}
            </h2>
            <p className="text-gray-400">{selectedStadiumData?.location}</p>
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

      {/* Add New Discount Ticket */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            เพิ่มตั๋วลดราคา
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">ประเภทตั๋ว</label>
            <select
              value={newDiscount.base_ticket_type}
              onChange={(e) => setNewDiscount({ ...newDiscount, base_ticket_type: e.target.value, base_ticket_id: '' })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            >
              <option value="regular">ตั๋วปกติ</option>
              <option value="special">ตั๋วพิเศษ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">เลือกตั๋ว</label>
            <select
              value={newDiscount.base_ticket_id}
              onChange={(e) => setNewDiscount({ ...newDiscount, base_ticket_id: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            >
              <option value="">-- เลือกตั๋ว --</option>
              {(newDiscount.base_ticket_type === 'regular' ? regularTickets : specialTickets).map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.name} - ฿{parseFloat(ticket.price).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">ราคาลด (บาท)</label>
            <input
              type="number"
              value={newDiscount.discount_price}
              onChange={(e) => setNewDiscount({ ...newDiscount, discount_price: e.target.value })}
              placeholder="2000"
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">เลือกเดือนและวันที่</label>
            
            {/* Month Navigation */}
            <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newMonth = selectedMonth > 1 ? selectedMonth - 1 : 12;
                  setSelectedMonth(newMonth);
                  setNewDiscount({ ...newDiscount, month: newMonth.toString() });
                }}
                className="p-1.5 hover:bg-gray-600 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <div className="text-white text-center font-semibold text-sm px-2">
                {getMonthName(selectedMonth)}
              </div>
              <button
                onClick={() => {
                  const newMonth = selectedMonth < 12 ? selectedMonth + 1 : 1;
                  setSelectedMonth(newMonth);
                  setNewDiscount({ ...newDiscount, month: newMonth.toString() });
                }}
                className="p-1.5 hover:bg-gray-600 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white rotate-180" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                <div key={index} className="text-center text-gray-400 text-xs font-semibold py-1">
                  {day}
                </div>
              ))}
              
              {/* Generate calendar days */}
              {(() => {
                const year = new Date().getFullYear(); // Use current year for display only
                const month = selectedMonth - 1; // JavaScript months are 0-indexed
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                const days = [];
                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="p-1"></div>);
                }
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const isSelected = newDiscount.day_of_month === day.toString() && newDiscount.month === selectedMonth.toString();
                  
                  days.push(
                    <div
                      key={day}
                      onClick={() => {
                        setNewDiscount({ 
                          ...newDiscount, 
                          day_of_month: day.toString(),
                          month: selectedMonth.toString()
                        });
                      }}
                      className={`
                        p-2 text-center rounded-lg cursor-pointer transition-all min-h-[40px] flex items-center justify-center
                        ${isSelected 
                          ? 'bg-yellow-500 text-black font-black' 
                          : 'bg-gray-700 text-white hover:bg-yellow-500/30 hover:text-yellow-500'
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
            
            {newDiscount.day_of_month && newDiscount.month && (
              <p className="text-gray-400 text-sm mt-3">
                เลือกแล้ว: วันที่ {newDiscount.day_of_month} {getMonthName(parseInt(newDiscount.month))}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreateDiscount}
            className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มตั๋วลดราคา
          </button>
        </div>
      </div>

      {/* Discount Tickets List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            ตั๋วลดราคาทั้งหมด
          </h3>
        </div>

        {loading ? (
          <div className="text-white text-center py-4">กำลังโหลดข้อมูล...</div>
        ) : discountTickets.length === 0 ? (
          <div className="text-gray-400 text-center py-4">ยังไม่มีตั๋วลดราคา</div>
        ) : (
          <div className="space-y-3">
            {discountTickets.map((discount) => {
              const originalPrice = getTicketPrice(discount.base_ticket_id, discount.base_ticket_type);
              const discountAmount = originalPrice - discount.discount_price;

              return (
                <div
                  key={discount.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                >
                  {editingDiscount === discount.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">ราคาลด (บาท)</label>
                          <input
                            type="number"
                            value={editForm.discount_price}
                            onChange={(e) => setEditForm({ ...editForm, discount_price: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => handleUpdateDiscount(discount.id)}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            บันทึก
                          </button>
                          <button
                            onClick={() => {
                              setEditingDiscount(null);
                              setEditForm({ discount_price: '', day_of_month: '', month: '' });
                            }}
                            className="text-gray-400 hover:text-white p-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Calendar for Edit */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">เลือกเดือนและวันที่</label>
                        
                        {/* Month Navigation */}
                        <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              const newMonth = editSelectedMonth > 1 ? editSelectedMonth - 1 : 12;
                              setEditSelectedMonth(newMonth);
                              setEditForm({ ...editForm, month: newMonth.toString() });
                            }}
                            className="p-1.5 hover:bg-gray-600 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-white" />
                          </button>
                          <div className="text-white text-center font-semibold text-sm px-2">
                            {getMonthName(editSelectedMonth)}
                          </div>
                          <button
                            onClick={() => {
                              const newMonth = editSelectedMonth < 12 ? editSelectedMonth + 1 : 1;
                              setEditSelectedMonth(newMonth);
                              setEditForm({ ...editForm, month: newMonth.toString() });
                            }}
                            className="p-1.5 hover:bg-gray-600 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-white rotate-180" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                            <div key={index} className="text-center text-gray-400 text-xs font-semibold py-1">
                              {day}
                            </div>
                          ))}
                          
                          {/* Generate calendar days */}
                          {(() => {
                            const year = new Date().getFullYear(); // Use current year for display only
                            const month = editSelectedMonth - 1; // JavaScript months are 0-indexed
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            
                            const days = [];
                            // Empty cells for days before month starts
                            for (let i = 0; i < firstDay; i++) {
                              days.push(<div key={`empty-${i}`} className="p-1"></div>);
                            }
                            
                            // Days of the month
                            for (let day = 1; day <= daysInMonth; day++) {
                              const isSelected = editForm.day_of_month === day.toString() && editForm.month === editSelectedMonth.toString();
                              
                              days.push(
                                <div
                                  key={day}
                                  onClick={() => {
                                    setEditForm({ 
                                      ...editForm, 
                                      day_of_month: day.toString(),
                                      month: editSelectedMonth.toString()
                                    });
                                  }}
                                  className={`
                                    p-2 text-center rounded-lg cursor-pointer transition-all min-h-[40px] flex items-center justify-center
                                    ${isSelected 
                                      ? 'bg-yellow-500 text-black font-black' 
                                      : 'bg-gray-700 text-white hover:bg-yellow-500/30 hover:text-yellow-500'
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
                        
                        {editForm.day_of_month && editForm.month && (
                          <p className="text-gray-400 text-sm mt-3">
                            เลือกแล้ว: วันที่ {editForm.day_of_month} {getMonthName(parseInt(editForm.month))}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-semibold">
                          {getTicketName(discount.base_ticket_id, discount.base_ticket_type)}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          ประเภท: {discount.base_ticket_type === 'regular' ? 'ตั๋วปกติ' : 'ตั๋วพิเศษ'}
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-400 text-sm line-through mr-2">
                            ฿{originalPrice.toLocaleString()}
                          </span>
                          <span className="text-yellow-500 text-lg font-black">
                            ฿{parseFloat(discount.discount_price).toLocaleString()}
                          </span>
                          <span className="text-red-500 text-sm ml-2">
                            (ลด {discountAmount.toLocaleString()} บาท)
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          วันที่ {discount.day_of_month} {getMonthName(discount.month)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingDiscount(discount.id);
                            setEditSelectedMonth(discount.month);
                            setEditForm({
                              discount_price: discount.discount_price.toString(),
                              day_of_month: discount.day_of_month.toString(),
                              month: discount.month.toString()
                            });
                          }}
                          className="text-yellow-500 hover:text-yellow-400 p-2"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountTicketsManagement;
