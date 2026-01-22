import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ExternalLink, User, Calendar, MapPin, Ticket, ArrowLeft, Clock } from 'lucide-react';
import { API_URL } from '../config/api.js';
import BookingDetail from './BookingDetail';
import { formatDate, formatDateTime } from '../utils/formatHelpers';

const LogsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stadiums, setStadiums] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchStadiums();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedStadium, searchTerm, selectedTimeRange]);

  const fetchStadiums = async () => {
    try {
      const response = await fetch(`${API_URL}/stadiums`);
      const data = await response.json();
      setStadiums(data);
    } catch (error) {
      console.error('Error fetching stadiums:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by time range
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (selectedTimeRange) {
        case 'day':
          // วันนี้ (ตั้งแต่ 00:00:00 ของวันนี้)
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          // สัปดาห์นี้ (7 วันที่ผ่านมา)
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          // เดือนนี้ (30 วันที่ผ่านมา)
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          break;
      }

      filtered = filtered.filter(booking => {
        if (!booking.created_at) return false;
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= startDate;
      });
    }

    // Filter by stadium
    if (selectedStadium !== 'all') {
      filtered = filtered.filter(booking => booking.stadium_id === selectedStadium);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.referenceNo && booking.referenceNo.toLowerCase().includes(term)) ||
        (booking.ticket_number && booking.ticket_number.toLowerCase().includes(term)) ||
        (booking.name && booking.name.toLowerCase().includes(term)) ||
        (booking.email && booking.email.toLowerCase().includes(term)) ||
        (booking.stadium_name && booking.stadium_name.toLowerCase().includes(term))
      );
    }

    setFilteredBookings(filtered);
  };

  const getTicketName = (booking) => {
    if (booking.ticket_id && booking.ticket_type) {
      // ถ้ามี ticket_id และ ticket_type แสดงว่าซื้อตั๋วแบบใหม่
      return `${booking.ticket_type === 'regular' ? 'ตั๋วปกติ' : 'ตั๋วพิเศษ'} (ID: ${booking.ticket_id})`;
    } else if (booking.zone_name) {
      // ถ้ามี zone_name แสดงว่าซื้อตั๋วแบบเก่า (zone-based)
      return booking.zone_name;
    }
    return 'ไม่ระบุ';
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`);
      const data = await response.json();
      setSelectedBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      alert('เกิดข้อผิดพลาดในการโหลดรายละเอียด');
    }
  };


  if (selectedBooking) {
    return (
      <BookingDetail 
        booking={selectedBooking} 
        onBack={() => setSelectedBooking(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Logs การซื้อตั๋ว
          </h2>
          <p className="text-gray-400 text-sm mt-1">ตรวจสอบประวัติการซื้อตั๋วทั้งหมด</p>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          รีเฟรช
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              กรองตามช่วงเวลา
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="day">วันนี้</option>
              <option value="week">สัปดาห์นี้</option>
              <option value="month">เดือนนี้</option>
            </select>
          </div>

          {/* Stadium Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              กรองตามสนาม
            </label>
            <select
              value={selectedStadium}
              onChange={(e) => setSelectedStadium(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">ทั้งหมด</option>
              {stadiums.map(stadium => (
                <option key={stadium.id} value={stadium.id}>
                  {stadium.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              ค้นหา
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาด้วย ID, ชื่อ, อีเมล..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">
            ทั้งหมด{selectedTimeRange !== 'all' && ` (${selectedTimeRange === 'day' ? 'วันนี้' : selectedTimeRange === 'week' ? 'สัปดาห์นี้' : 'เดือนนี้'})`}
          </div>
          <div className="text-2xl font-black text-yellow-500 mt-1">{bookings.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">แสดงผล</div>
          <div className="text-2xl font-black text-yellow-500 mt-1">{filteredBookings.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">ยืนยันแล้ว</div>
          <div className="text-2xl font-black text-green-500 mt-1">
            {filteredBookings.filter(b => b.status === 'confirmed').length}
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400">กำลังโหลดข้อมูล...</div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-gray-400">ไม่พบข้อมูล</div>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <button
                    onClick={() => handleViewDetails(booking.id)}
                    className="text-yellow-500 hover:text-yellow-400 font-mono text-sm flex items-center gap-1 hover:underline flex-1 text-left"
                  >
                    {booking.referenceNo || booking.ticket_number || booking.id}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : booking.status === 'payment_failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {booking.status === 'confirmed' 
                      ? 'ยืนยันแล้ว' 
                      : booking.status === 'payment_failed'
                      ? 'ชำระเงินไม่สำเร็จ'
                      : 'รอชำระเงิน'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">ชื่อ:</span>
                    <span className="text-white ml-2">{booking.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">อีเมล:</span>
                    <span className="text-white ml-2 text-xs">{booking.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">สนาม:</span>
                    <span className="text-white ml-2">{booking.stadium_name || booking.stadium || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">ตั๋ว:</span>
                    <span className="text-white ml-2">{getTicketName(booking)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">จำนวน:</span>
                    <span className="text-white ml-2">{booking.quantity || 0} ใบ</span>
                  </div>
                  <div>
                    <span className="text-gray-400">วันที่:</span>
                    <span className="text-white ml-2">{formatDate(booking.date, 'th')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">เวลา:</span>
                    <span className="text-white ml-2 text-xs">{formatDateTime(booking.created_at, 'th')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleViewDetails(booking.id)}
                  className="mt-3 w-full text-yellow-500 hover:text-yellow-400 text-sm font-semibold flex items-center justify-center gap-1 py-2 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/10 transition-colors"
                >
                  ดูรายละเอียด
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      ID คำสั่งซื้อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      ชื่อลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      สนาม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      ตั๋วแบบไหน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      จำนวน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="text-yellow-500 hover:text-yellow-400 font-mono text-sm flex items-center gap-1 hover:underline"
                        >
                          {booking.referenceNo || booking.ticket_number || booking.id}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-medium">{booking.name || '-'}</div>
                        <div className="text-gray-400 text-xs">{booking.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">{booking.stadium_name || booking.stadium || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">{getTicketName(booking)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">{booking.quantity || 0} ใบ</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white text-sm">{formatDate(booking.date, 'th')}</div>
                        <div className="text-gray-400 text-xs">{formatDateTime(booking.created_at, 'th')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : booking.status === 'payment_failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {booking.status === 'confirmed' 
                            ? 'ยืนยันแล้ว' 
                            : booking.status === 'payment_failed'
                            ? 'ชำระเงินไม่สำเร็จ'
                            : 'รอชำระเงิน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="text-yellow-500 hover:text-yellow-400 text-sm font-semibold flex items-center gap-1"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LogsManagement;

