import React from 'react';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Ticket, Hash, CreditCard, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatHelpers';

const BookingDetail = ({ booking, onBack }) => {

  const formatCurrency = (amount) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getTicketName = () => {
    if (booking.ticket_id && booking.ticket_type) {
      return `${booking.ticket_type === 'regular' ? 'ตั๋วปกติ' : 'ตั๋วพิเศษ'} (ID: ${booking.ticket_id})`;
    } else if (booking.zone_name) {
      return booking.zone_name;
    }
    return 'ไม่ระบุ';
  };

  const getStatusBadge = () => {
    const status = booking.status;
    if (status === 'confirmed') {
      return (
        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          ยืนยันแล้ว
        </span>
      );
    } else if (status === 'payment_failed') {
      return (
        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          ชำระเงินไม่สำเร็จ
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          รอชำระเงิน
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-yellow-500" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-wider">
            รายละเอียดการจอง
          </h2>
          <p className="text-gray-400 text-sm mt-1">ID: {booking.referenceNo || booking.ticket_number || booking.id}</p>
        </div>
        <div className="ml-auto">
          {getStatusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            ข้อมูลการจอง
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">ID คำสั่งซื้อ</div>
                <div className="text-white font-mono text-sm mt-1">
                  {booking.referenceNo || booking.ticket_number || booking.id}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">Ticket Number</div>
                <div className="text-white font-mono text-sm mt-1">
                  {booking.ticket_number || '-'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">สนาม</div>
                <div className="text-white font-medium mt-1">
                  {booking.stadium_name || booking.stadium || '-'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">วันที่</div>
                <div className="text-white font-medium mt-1">
                  {formatDate(booking.date, 'th')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Ticket className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">ประเภทตั๋ว</div>
                <div className="text-white font-medium mt-1">
                  {getTicketName()}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">จำนวน</div>
                <div className="text-white font-medium mt-1">
                  {booking.quantity || 0} ใบ
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">ราคารวม</div>
                <div className="text-yellow-500 font-black text-xl mt-1">
                  {formatCurrency(booking.total_price)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">วันที่จอง</div>
                <div className="text-white text-sm mt-1">
                  {formatDateTime(booking.created_at, 'th')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            ข้อมูลลูกค้า
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">ชื่อ</div>
                <div className="text-white font-medium mt-1">
                  {booking.name || '-'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">อีเมล</div>
                <div className="text-white font-medium mt-1 break-all">
                  {booking.email || '-'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm">เบอร์โทร</div>
                <div className="text-white font-medium mt-1">
                  {booking.phone || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {(booking.payment_start_time || booking.payment_time || booking.payment_slip) && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            ข้อมูลการชำระเงิน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.payment_start_time && (
              <div>
                <div className="text-gray-400 text-sm">เวลาเริ่มจ่าย</div>
                <div className="text-white text-sm mt-1">
                  {formatDateTime(booking.payment_start_time, 'th')}
                </div>
              </div>
            )}
            {booking.payment_time && (
              <div>
                <div className="text-gray-400 text-sm">เวลาจ่ายเงิน</div>
                <div className="text-white text-sm mt-1">
                  {booking.payment_time}
                </div>
              </div>
            )}
            {booking.payment_slip && (
              <div className="md:col-span-2">
                <div className="text-gray-400 text-sm mb-2">สลิปการจ่ายเงิน</div>
                <img
                  src={booking.payment_slip}
                  alt="Payment Slip"
                  className="max-w-md w-full h-auto border border-gray-700 rounded-lg"
                />
              </div>
            )}
            {booking.paymentVerification && (
              <div className="md:col-span-2">
                <div className="text-gray-400 text-sm mb-2">ผลการตรวจสอบ</div>
                <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">ระยะเวลาจ่าย:</span>
                    <span className={`font-semibold ${booking.paymentVerification.withinTimeLimit ? 'text-green-400' : 'text-red-400'}`}>
                      {booking.paymentVerification.timeDiff} นาที
                      {booking.paymentVerification.withinTimeLimit ? ' ✓' : ' ✗'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">วันที่จ่ายถูกต้อง:</span>
                    <span className={`font-semibold ${booking.paymentVerification.correctDate ? 'text-green-400' : 'text-red-400'}`}>
                      {booking.paymentVerification.correctDate ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">มีสลิปการจ่าย:</span>
                    <span className={`font-semibold ${booking.paymentVerification.hasSlip ? 'text-green-400' : 'text-red-400'}`}>
                      {booking.paymentVerification.hasSlip ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          ข้อมูลเพิ่มเติม
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {booking.payment_reference_no && (
            <div>
              <div className="text-gray-400 text-sm">Payment Reference No</div>
              <div className="text-white font-mono text-sm mt-1">
                {booking.payment_reference_no}
              </div>
            </div>
          )}
          {booking.payment_order_no && (
            <div>
              <div className="text-gray-400 text-sm">Order No</div>
              <div className="text-white font-mono text-sm mt-1">
                {booking.payment_order_no}
              </div>
            </div>
          )}
          {booking.payment_status && (
            <div>
              <div className="text-gray-400 text-sm">Payment Status</div>
              <div className="text-white text-sm mt-1">
                {booking.payment_status}
              </div>
            </div>
          )}
          {booking.payment_amount && (
            <div>
              <div className="text-gray-400 text-sm">Payment Amount</div>
              <div className="text-yellow-500 font-semibold text-sm mt-1">
                {formatCurrency(booking.payment_amount)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;

