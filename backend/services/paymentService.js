import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { createBooking, deductTicketQuantity } from '../database.js';
import { calculateBookingPrice } from './priceCalculationService.js';

// ===== PAYMENT SERVICE v2.0 - Updated for better-sqlite3 =====
console.log('[PaymentService] Loaded - Version 2.0 with better-sqlite3 support');

// Pay Solutions Configuration - Uses environment variables
const PAY_SOLUTIONS_CONFIG = {
  apiUrl: process.env.PAY_SOLUTIONS_API_URL || 'https://apis.paysolutions.asia/tep/api/v2/promptpaynew',
  merchantId: process.env.PAY_SOLUTIONS_MERCHANT_ID,
  authKey: process.env.PAY_SOLUTIONS_AUTH_KEY,
  apiKey: process.env.PAY_SOLUTIONS_API_KEY,
  secretKey: process.env.PAY_SOLUTIONS_SECRET_KEY
};

// Validate required environment variables
if (!PAY_SOLUTIONS_CONFIG.merchantId || !PAY_SOLUTIONS_CONFIG.authKey) {
  console.error('[PaymentService] ⚠️  Missing required environment variables!');
  console.error('[PaymentService] Please set PAY_SOLUTIONS_MERCHANT_ID and PAY_SOLUTIONS_AUTH_KEY');
}

class PaymentService {
  /**
   * Generate unique 12-digit reference number
   */
  generateReferenceNo() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return (timestamp + random).slice(-12);
  }

  /**
   * Create payment and generate QR code
   */
  async createPayment(bookingData) {
    try {
      // Validate input
      if (!bookingData.name || !bookingData.email) {
        throw new Error('Missing required booking data: name and email');
      }

      // ✅ SECURITY: Calculate price server-side to prevent tampering
      let totalPrice = 0;
      let calculatedTicket = null;

      if (bookingData.ticketId && bookingData.ticketType) {
        // Calculate price from ticket data
        const priceResult = calculateBookingPrice({
          stadiumId: bookingData.stadiumId || bookingData.stadium,
          ticketId: bookingData.ticketId,
          ticketType: bookingData.ticketType,
          quantity: bookingData.quantity || 1
        });

        if (!priceResult.success) {
          throw new Error(`Price calculation failed: ${priceResult.error}`);
        }

        totalPrice = priceResult.totalPrice;
        calculatedTicket = priceResult.ticket;
        
        console.log('[PaymentService] ✅ Price calculated server-side:', {
          unitPrice: priceResult.unitPrice,
          quantity: priceResult.quantity,
          totalPrice: totalPrice
        });
      } else {
        // Legacy: Use totalPrice from frontend (for old bookings)
        if (!bookingData.totalPrice) {
          throw new Error('Missing totalPrice for legacy booking');
        }
        totalPrice = parseFloat(bookingData.totalPrice);
        console.warn('[PaymentService] ⚠️  Using legacy price calculation from frontend');
      }

      // Generate unique reference number
      const referenceNo = this.generateReferenceNo();

      // Prepare product detail
      const productDetail = this.formatProductDetail(bookingData);

      // Call Pay Solutions API
      const qrResponse = await this.generateQRCode({
        merchantID: PAY_SOLUTIONS_CONFIG.merchantId,
        productDetail: productDetail,
        customerEmail: bookingData.email,
        customerName: bookingData.name,
        total: totalPrice.toFixed(2),
        referenceNo: referenceNo
      });

      // Check if API call was successful
      if (!qrResponse || !qrResponse.data) {
        console.error('Invalid QR response:', qrResponse);
        throw new Error('Failed to generate QR code from Pay Solutions');
      }

      // API returns { status: "success", data: { orderNo, referenceNo, ... } }
      // So we need to access qrResponse.data.data
      const apiData = qrResponse.data.data;
      
      if (!apiData) {
        console.error('No data field in response:', qrResponse.data);
        throw new Error('Invalid response structure from Pay Solutions');
      }

      console.log('[PaymentService] API Data fields:', Object.keys(apiData));
      const { orderNo, referenceNo: apiRefNo, total, orderdatetime, expiredate, image } = apiData;
      console.log('[PaymentService] Extracted fields:', {
        orderNo,
        apiRefNo,
        total,
        orderdatetime,
        expiredate,
        hasImage: !!image,
        imageLength: image ? image.length : 0
      });

      // Calculate amount (use API total if available, otherwise use bookingData.totalPrice)
      const amount = total ? parseFloat(total) : parseFloat(bookingData.totalPrice);
      
      console.log('[PaymentService] Payment amount:', { 
        apiTotal: total, 
        bookingTotal: bookingData.totalPrice, 
        finalAmount: amount 
      });

      // Store booking metadata in JSON format for later booking creation
      const bookingMetadata = {
        stadium: bookingData.stadium || bookingData.stadiumId,
        date: bookingData.date,
        zone: bookingData.zone || null,
        ticketId: bookingData.ticketId || null,
        ticketType: bookingData.ticketType || null,
        quantity: bookingData.quantity || 1,
        totalPrice: totalPrice,
        stadiumData: bookingData.stadiumData || null,
        ticketData: bookingData.ticketData || null,
        zoneData: bookingData.zoneData || null
      };

      // Save payment to database with booking metadata
      const payment = this.savePayment({
        orderNo,
        referenceNo: apiRefNo || referenceNo,
        amount: amount,
        qrCodeImage: image,
        expireDate: expiredate,
        orderDatetime: orderdatetime,
        customerName: bookingData.name,
        customerEmail: bookingData.email,
        customerPhone: bookingData.phone || '',
        productDetail: productDetail,
        bookingMetadata: JSON.stringify(bookingMetadata),
        merchantId: PAY_SOLUTIONS_CONFIG.merchantId,
        status: 'pending'
      });

      return {
        success: true,
        payment: payment,
        qrCode: image,
        expireDate: expiredate,
        orderNo: orderNo,
        referenceNo: apiRefNo || referenceNo
      };

    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code by calling Pay Solutions API
   */
  async generateQRCode(params) {
    try {
      console.log('=== [PaymentService] Calling Pay Solutions API ===');
      console.log('API URL:', PAY_SOLUTIONS_CONFIG.apiUrl);
      console.log('Merchant ID:', PAY_SOLUTIONS_CONFIG.merchantId);
      console.log('Request params:', {
        merchantID: params.merchantID,
        productDetail: params.productDetail,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        total: params.total,
        referenceNo: params.referenceNo
      });

      const response = await axios.post(
        PAY_SOLUTIONS_CONFIG.apiUrl,
        null,
        {
          params: {
            merchantID: params.merchantID,
            productDetail: params.productDetail,
            customerEmail: params.customerEmail,
            customerName: params.customerName,
            total: params.total,
            referenceNo: params.referenceNo
          },
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${PAY_SOLUTIONS_CONFIG.authKey}`
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      console.log('=== [PaymentService] API Response ===');
      console.log('Status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      // Check response status
      if (response.data && response.data.status === 'success') {
        return response;
      } else if (response.data && response.data.message) {
        console.error('API returned error message:', response.data.message);
        throw new Error(response.data.message);
      } else {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from Pay Solutions API');
      }

    } catch (error) {
      console.error('=== [PaymentService] API Error ===');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Headers:', error.response.headers);
        throw new Error(`API Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received from API');
        throw new Error('No response from payment gateway');
      } else {
        console.error('Error calling Pay Solutions API:', error.message);
        throw error;
      }
    }
  }

  /**
   * Save payment to database
   */
  savePayment(paymentData) {
    try {
      console.log('[PaymentService] Saving payment with better-sqlite3...');
      
      // Check if booking_metadata column exists, if not add it
      const tableInfo = db.prepare("PRAGMA table_info(payments)").all();
      const hasBookingMetadata = tableInfo.some(col => col.name === 'booking_metadata');
      
      if (!hasBookingMetadata) {
        console.log('[PaymentService] Adding booking_metadata column to payments table...');
        db.exec(`ALTER TABLE payments ADD COLUMN booking_metadata TEXT`);
      }
      
      const stmt = db.prepare(`
        INSERT INTO payments (
          order_no, reference_no, amount, status, qr_code_image,
          expire_date, order_datetime, customer_name, customer_email,
          customer_phone, product_detail, booking_metadata, merchant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        paymentData.orderNo,
        paymentData.referenceNo,
        paymentData.amount,
        paymentData.status,
        paymentData.qrCodeImage,
        paymentData.expireDate,
        paymentData.orderDatetime,
        paymentData.customerName,
        paymentData.customerEmail,
        paymentData.customerPhone,
        paymentData.productDetail,
        paymentData.bookingMetadata || null,
        paymentData.merchantId
      );

      return {
        id: result.lastInsertRowid,
        ...paymentData
      };

    } catch (error) {
      console.error('Error saving payment to database:', error);
      throw new Error(`Failed to save payment: ${error.message}`);
    }
  }

  /**
   * Get payment by reference number
   */
  getPaymentByReference(referenceNo) {
    try {
      const stmt = db.prepare('SELECT * FROM payments WHERE reference_no = ?');
      const payment = stmt.get(referenceNo);

      if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404;
        throw error;
      }

      // Log payment ID for debugging
      console.log('[PaymentService] Payment found - ID:', payment.id, 'Reference:', payment.reference_no);

      return payment;

    } catch (error) {
      // Only log if it's not a "not found" error
      if (error.message !== 'Payment not found') {
        console.error('Error getting payment:', error);
      }
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  getPaymentById(paymentId) {
    try {
      const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
      const payment = stmt.get(paymentId);

      if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404;
        throw error;
      }

      return payment;

    } catch (error) {
      // Only log if it's not a "not found" error
      if (error.message !== 'Payment not found') {
        console.error('Error getting payment by ID:', error);
      }
      throw error;
    }
  }

  /**
   * Create booking record from payment data
   */
  createBookingFromPayment(payment) {
    try {
      // Check if booking already exists for this payment (by reference number as ticket_number)
      const existingBookingStmt = db.prepare(`
        SELECT id FROM bookings WHERE ticket_number = ?
      `);
      const existing = existingBookingStmt.get(payment.reference_no);
      
      if (existing) {
        console.log('[PaymentService] Booking already exists for payment:', payment.reference_no);
        // Update booking status to confirmed if not already confirmed
        const updateStmt = db.prepare(`
          UPDATE bookings SET status = 'confirmed' WHERE ticket_number = ?
        `);
        updateStmt.run(payment.reference_no);
        return existing;
      }

      // Parse booking metadata
      let bookingMetadata = null;
      if (payment.booking_metadata) {
        try {
          bookingMetadata = JSON.parse(payment.booking_metadata);
        } catch (e) {
          console.error('[PaymentService] Error parsing booking_metadata:', e);
          return null;
        }
      } else {
        console.warn('[PaymentService] No booking_metadata found for payment:', payment.reference_no);
        return null;
      }

      // Get stadium data
      const stadiums = [
        { id: 'rajadamnern', name: 'Rajadamnern Stadium' },
        { id: 'lumpinee', name: 'Lumpinee Stadium' },
        { id: 'bangla', name: 'Bangla Boxing Stadium' },
        { id: 'patong', name: 'Patong Stadium' }
      ];
      
      const stadiumId = bookingMetadata.stadium || bookingMetadata.stadiumData?.id;
      const stadiumData = stadiums.find(s => s.id === stadiumId);
      
      if (!stadiumData) {
        console.error('[PaymentService] Invalid stadium ID:', stadiumId);
        return null;
      }

      // Deduct ticket quantity if using ticket system
      if (bookingMetadata.ticketId && bookingMetadata.ticketType && bookingMetadata.date) {
        const success = deductTicketQuantity(
          stadiumId,
          bookingMetadata.ticketId,
          bookingMetadata.ticketType,
          parseInt(bookingMetadata.quantity || 1),
          bookingMetadata.date
        );
        
        if (!success) {
          console.error('[PaymentService] Failed to deduct ticket quantity');
          return null;
        }
      }

      // Create booking record
      const booking = {
        id: uuidv4(),
        stadium: stadiumData.name,
        stadiumId: stadiumId,
        date: bookingMetadata.date,
        zone: bookingMetadata.zone || null,
        zoneId: bookingMetadata.zone || null,
        ticketId: bookingMetadata.ticketId || null,
        ticketType: bookingMetadata.ticketType || null,
        name: payment.customer_name,
        email: payment.customer_email,
        phone: payment.customer_phone || '',
        quantity: parseInt(bookingMetadata.quantity || 1),
        totalPrice: parseFloat(payment.amount),
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        ticketNumber: payment.reference_no,
        paymentStartTime: null,
        paymentTime: null,
        paymentSlip: null,
        paymentVerification: null
      };

      // Save booking to database
      createBooking(booking);
      
      // Link payment to booking
      const updatePaymentStmt = db.prepare(`
        UPDATE payments 
        SET booking_id = (SELECT id FROM bookings WHERE ticket_number = ?), 
            updated_at = CURRENT_TIMESTAMP 
        WHERE reference_no = ?
      `);
      updatePaymentStmt.run(payment.reference_no, payment.reference_no);

      console.log('[PaymentService] ✅ Booking created from payment:', {
        bookingId: booking.id,
        referenceNo: payment.reference_no
      });

      return booking;

    } catch (error) {
      console.error('[PaymentService] Error creating booking from payment:', error);
      return null;
    }
  }

  /**
   * Update payment status and create booking if payment is successful
   */
  updatePaymentStatus(referenceNo, status) {
    try {
      const stmt = db.prepare(`
        UPDATE payments 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE reference_no = ?
      `);
      
      stmt.run(status, referenceNo);

      const updatedPayment = this.getPaymentByReference(referenceNo);

      // Create booking record when payment is successful
      if (status === 'paid' || status === 'completed') {
        console.log('[PaymentService] Payment successful, creating booking record...');
        this.createBookingFromPayment(updatedPayment);
      }

      return updatedPayment;

    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  /**
   * Refresh QR code (generate new one)
   */
  async refreshQRCode(oldReferenceNo) {
    try {
      // Get old payment data
      const oldPayment = await this.getPaymentByReference(oldReferenceNo);

      // Generate new reference number
      const newReferenceNo = this.generateReferenceNo();

      // Call Pay Solutions API with new reference
      const qrResponse = await this.generateQRCode({
        merchantID: PAY_SOLUTIONS_CONFIG.merchantId,
        productDetail: oldPayment.product_detail,
        customerEmail: oldPayment.customer_email,
        customerName: oldPayment.customer_name,
        total: oldPayment.amount.toFixed(2),
        referenceNo: newReferenceNo
      });

      if (!qrResponse || !qrResponse.data) {
        throw new Error('Failed to refresh QR code');
      }

      // API returns { status: "success", data: { orderNo, referenceNo, ... } }
      const apiData = qrResponse.data.data;
      
      if (!apiData) {
        throw new Error('Invalid response structure from Pay Solutions');
      }

      const { orderNo, referenceNo: apiRefNo, total, orderdatetime, expiredate, image } = apiData;

      // Calculate amount (use API total if available, otherwise use old payment amount)
      const amount = total ? parseFloat(total) : oldPayment.amount;

      // Mark old payment as expired
      this.updatePaymentStatus(oldReferenceNo, 'expired');

      // Create new payment record
      const newPayment = this.savePayment({
        orderNo,
        referenceNo: apiRefNo || newReferenceNo,
        amount: amount,
        qrCodeImage: image,
        expireDate: expiredate,
        orderDatetime: orderdatetime,
        customerName: oldPayment.customer_name,
        customerEmail: oldPayment.customer_email,
        customerPhone: oldPayment.customer_phone,
        productDetail: oldPayment.product_detail,
        merchantId: PAY_SOLUTIONS_CONFIG.merchantId,
        status: 'pending'
      });

      return {
        success: true,
        payment: newPayment,
        qrCode: image,
        expireDate: expiredate,
        orderNo: orderNo,
        referenceNo: apiRefNo || newReferenceNo
      };

    } catch (error) {
      console.error('Error refreshing QR code:', error);
      throw new Error(`QR refresh failed: ${error.message}`);
    }
  }

  /**
   * Format product detail for API
   */
  formatProductDetail(bookingData) {
    const details = [];
    
    if (bookingData.stadiumData && bookingData.stadiumData.name) {
      details.push(`Stadium: ${bookingData.stadiumData.name}`);
    }
    
    if (bookingData.dateDisplay) {
      details.push(`Date: ${bookingData.dateDisplay}`);
    }
    
    if (bookingData.ticketData && bookingData.ticketData.name) {
      details.push(`Ticket: ${bookingData.ticketData.name}`);
    } else if (bookingData.zoneData && bookingData.zoneData.name) {
      details.push(`Zone: ${bookingData.zoneData.name}`);
    }
    
    if (bookingData.quantity) {
      details.push(`Qty: ${bookingData.quantity}`);
    }

    const productDetail = details.join(' | ');
    
    // Limit to 1024 characters
    return productDetail.length > 1024 
      ? productDetail.substring(0, 1021) + '...'
      : productDetail;
  }

  /**
   * Check if payment is expired
   */
  isPaymentExpired(expireDate) {
    try {
      if (!expireDate) return true;
      
      const expireTime = new Date(expireDate).getTime();
      const currentTime = new Date().getTime();
      
      return currentTime > expireTime;
    } catch (error) {
      console.error('Error checking expiration:', error);
      return true;
    }
  }

  /**
   * Check payment status from database
   * Status is updated by manual verification (Test Button) or admin panel
   */
  async checkPaymentStatusFromAPI(referenceNo) {
    try {
      console.log('[PaymentService] Checking payment status for:', referenceNo);
      
      // Get payment from database
      const payment = this.getPaymentByReference(referenceNo);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check if payment has expired (based on expire_date)
      if (payment.status === 'pending' && this.isPaymentExpired(payment.expire_date)) {
        console.log('[PaymentService] Payment expired, updating status');
        this.updatePaymentStatus(referenceNo, 'expired');
        return {
          status: 'expired',
          payment: { ...payment, status: 'expired' }
        };
      }

      // Return current status from database
      console.log(`[PaymentService] Current payment status: ${payment.status}`);
      
      return {
        status: payment.status,
        payment: payment
      };

    } catch (error) {
      console.error('[PaymentService] Error checking payment status:', error);
      throw error;
    }
  }
}

export default new PaymentService();

