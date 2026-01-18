import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db, { 
  initDatabase, 
  createBooking, 
  getAllBookings, 
  getBookingById,
  getRegularTickets,
  createRegularTicket,
  updateRegularTicket,
  deleteRegularTicket,
  getSpecialTickets,
  createSpecialTicket,
  updateSpecialTicket,
  deleteSpecialTicket,
  deductTicketQuantity,
  getTicketQuantityByDate,
  resetTicketQuantityForDate,
  resetExpiredTicketQuantities,
  getHeroImage,
  updateHeroImage,
  getHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getStadiumsExtended,
  createStadiumExtended,
  updateStadiumExtended,
  deleteStadiumExtended,
  getStadiumImageSchedules,
  updateStadiumImageSchedules,
  getSpecialMatches,
  createSpecialMatch,
  updateSpecialMatch,
  deleteSpecialMatch,
  getDailyImages,
  createDailyImage,
  updateDailyImage,
  deleteDailyImage,
  getUpcomingFightsBackground,
  updateUpcomingFightsBackground,
  getPromptPayQr,
  updatePromptPayQr,
  getNewsPopupImages,
  createNewsPopupImage,
  updateNewsPopupImage,
  deleteNewsPopupImage,
  getStadiumPaymentImages,
  createStadiumPaymentImage,
  updateStadiumPaymentImage,
  deleteStadiumPaymentImage,
  getTicketsForDate,
  updateTicketForDate,
  areTicketsEnabledForDate
} from './database.js';

// Import services
import { hasAvailableTickets, getAvailableTicketsForDate, getTicketConfig as getTicketConfigService } from './services/ticketService.js';
import { getStadiumEvents, getAllUpcomingEvents } from './services/eventService.js';
import paymentService from './services/paymentService.js';
import emailService from './services/emailService.js';
import { processImage } from './services/imageService.js';
import { generateNextMonthTickets, getTicketTemplates, checkAndGenerateTickets } from './services/autoTicketService.js';
import { startScheduler, getLastGeneratedDate, manualCheck } from './utils/scheduler.js';

// Import authentication middleware
import { verifyApiKey, requireAdmin, rateLimit } from './middleware/auth.js';
import { isValidDateFormat, isValidStadiumId, isValidEmail, sanitizeString } from './utils/validators.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Database initialization will happen before server starts (see below)

// ✅ CORS Configuration - MCP Compliant (uses environment variables)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      // Default fallback origins (should be set via ALLOWED_ORIGINS env var)
      'https://dsmuaythaiticket.com',
      'http://dsmuaythaiticket.com',
      'https://www.dsmuaythaiticket.com',
      'http://www.dsmuaythaiticket.com',
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://localhost:5000'  // Backend API (for admin)
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
let tickets = [
  { id: 'rajadamnern', name: 'Rajadamnern Stadium', location: 'Bangkok' },
  { id: 'lumpinee', name: 'Lumpinee Stadium', location: 'Bangkok' },
  { id: 'bangla', name: 'Bangla Boxing Stadium', location: 'Phuket' },
  { id: 'patong', name: 'Patong Stadium', location: 'Phuket' }
];

const zones = [
  { id: 'vip', name: 'VIP Ringside', price: 2500 },
  { id: 'club', name: 'Club Class', price: 1800 },
  { id: 'standard', name: 'Standard', price: 1200 }
];

// Helper function to get ticket config from database
const getTicketConfig = (stadiumId) => {
  const regularTickets = getRegularTickets(stadiumId);
  const specialTickets = getSpecialTickets(stadiumId);
  return {
    regularTickets: regularTickets || [],
    specialTickets: specialTickets || []
  };
};

// Routes

// Get all stadiums
app.get('/api/stadiums', (req, res) => {
  res.json(tickets);
});

// Get all zones
app.get('/api/zones', (req, res) => {
  res.json(zones);
});

// Create a booking
app.post('/api/bookings', (req, res) => {
  const { 
    stadium, 
    date, 
    zone, 
    ticketId,
    ticketType, // 'regular' or 'special'
    name, 
    email, 
    phone, 
    quantity, 
    totalPrice,
    paymentStartTime,
    paymentTime,
    paymentSlip,
    paymentDateTime,
    timeDiff
  } = req.body;

  // Validation - support both zone (legacy) and ticketId (new)
  if (!stadium || !date || !name || !email || !phone || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!zone && !ticketId) {
    return res.status(400).json({ error: 'Either zone or ticketId is required' });
  }

  let zoneData = null;
  if (zone) {
    zoneData = zones.find(z => z.id === zone);
    if (!zoneData) {
      return res.status(400).json({ error: 'Invalid zone' });
    }
  }

  const stadiumData = tickets.find(t => t.id === stadium);
  if (!stadiumData) {
    return res.status(400).json({ error: 'Invalid stadium' });
  }

  // Payment verification (if payment data is provided)
  let paymentStatus = 'pending';
  let paymentVerification = null;
  
  if (paymentStartTime && paymentTime && paymentSlip) {
    // Verify payment
    const startTime = new Date(paymentStartTime);
    const payTime = new Date(paymentDateTime);
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const paymentDate = new Date(payTime);
    paymentDate.setHours(0, 0, 0, 0);

    const timeDiffMinutes = parseFloat(timeDiff);
    const withinTimeLimit = timeDiffMinutes >= 0 && timeDiffMinutes <= 10;
    const correctDate = paymentDate.getTime() === bookingDate.getTime();
    const hasSlip = !!paymentSlip;

    paymentVerification = {
      withinTimeLimit,
      correctDate,
      hasSlip,
      timeDiff: timeDiffMinutes,
      paymentDateTime: paymentDateTime
    };

    // Payment is valid if all checks pass
    if (withinTimeLimit && correctDate && hasSlip) {
      paymentStatus = 'verified';
    } else {
      paymentStatus = 'failed';
    }
  }

  // Deduct ticket quantity if using ticketId and payment is verified
  if (ticketId && ticketType && paymentStatus === 'verified') {
    const requestedQuantity = parseInt(quantity);
    // ส่ง date ไปด้วยเพื่อแยกจำนวนตั๋วตามวัน
    const success = deductTicketQuantity(stadium, ticketId, ticketType, requestedQuantity, date);
    
    if (!success) {
      return res.status(400).json({ error: 'Insufficient tickets available' });
    }
  }

  // Create booking
  const booking = {
    id: uuidv4(),
    stadium: stadiumData.name,
    stadiumId: stadium,
    date,
    zone: zoneData ? zoneData.name : null,
    zoneId: zone || null,
    ticketId: ticketId || null,
    ticketType: ticketType || null,
    name,
    email,
    phone,
    quantity: parseInt(quantity),
    totalPrice: parseInt(totalPrice),
    status: paymentStatus === 'verified' ? 'confirmed' : paymentStatus === 'failed' ? 'payment_failed' : 'pending_payment',
    bookingDate: new Date().toISOString(),
    ticketNumber: `MT${Date.now()}${Math.floor(Math.random() * 1000)}`,
    paymentStartTime: paymentStartTime || null,
    paymentTime: paymentTime || null,
    paymentSlip: paymentSlip || null,
    paymentVerification: paymentVerification
  };

  // Save to database
  createBooking(booking);

  // In a real application, you would:
  // - Save to database
  // - Send confirmation email
  // - Process payment
  // - Generate QR code

  res.status(201).json({
    message: paymentStatus === 'verified' 
      ? 'Booking confirmed successfully' 
      : paymentStatus === 'failed'
      ? 'Payment verification failed'
      : 'Booking created, payment pending',
    booking: {
      id: booking.id,
      ticketNumber: booking.ticketNumber,
      stadium: booking.stadium,
      date: booking.date,
      zone: booking.zone,
      quantity: booking.quantity,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentVerification: paymentVerification
    }
  });
});

// Get all bookings (for admin purposes)
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (err) {
    console.error('Error getting bookings:', err);
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', (req, res) => {
  try {
    const booking = getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error('Error getting booking:', err);
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

// Payment Routes

// Create payment and generate QR code
app.post('/api/payments/create', async (req, res) => {
  try {
    const bookingData = req.body;
    
    console.log('Received payment request:', {
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      totalPrice: bookingData.totalPrice,
      quantity: bookingData.quantity,
      hasStadiumData: !!bookingData.stadiumData,
      hasTicketData: !!bookingData.ticketData,
      hasZoneData: !!bookingData.zoneData
    });

    // Validate required fields
    if (!bookingData.name || !bookingData.email || !bookingData.totalPrice) {
      console.error('Validation failed:', {
        name: bookingData.name,
        email: bookingData.email,
        totalPrice: bookingData.totalPrice
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'totalPrice'],
        received: {
          name: !!bookingData.name,
          email: !!bookingData.email,
          totalPrice: !!bookingData.totalPrice
        }
      });
    }

    // Create payment and generate QR code
    const result = await paymentService.createPayment(bookingData);

    console.log('[Server] Payment created - ID:', result.payment?.id, 'Order No:', result.orderNo);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ 
      error: 'Failed to create payment',
      message: error.message 
    });
  }
});

// Get payment by reference number (with live status check)
app.get('/api/payments/reference/:referenceNo', async (req, res) => {
  try {
    const { referenceNo } = req.params;

    // Check payment status from API (includes expiry check and DB update)
    const result = await paymentService.checkPaymentStatusFromAPI(referenceNo);

    res.json({
      success: true,
      data: result.payment,
      status: result.status
    });

  } catch (error) {
    console.error('Error getting payment:', error);
    
    // Handle "Payment not found" error gracefully
    if (error.message === 'Payment not found' || error.message?.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: 'The requested payment does not exist'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get payment',
      message: error.message
    });
  }
});

// Get payment by ID
app.get('/api/payments/:id', (req, res) => {
  try {
    const { id } = req.params;

    const payment = paymentService.getPaymentById(id);

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error getting payment:', error);
    
    // Handle "Payment not found" error gracefully
    if (error.message === 'Payment not found') {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found',
        message: 'The requested payment does not exist'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to get payment',
      message: error.message 
    });
  }
});

// Update payment status (PROTECTED - requires API key)
app.put('/api/payments/:referenceNo/status', 
  rateLimit(5, 60000), // Max 5 requests per minute
  verifyApiKey, // Require valid API key
  async (req, res) => {
    try {
      const { referenceNo } = req.params;
      const { status } = req.body;

      console.log('[Payment] Status update request:', {
        referenceNo,
        status,
        ip: req.ip,
        apiKey: req.headers['x-api-key']?.substring(0, 8) + '...'
      });

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      // Validate status value
      const validStatuses = ['pending', 'paid', 'completed', 'failed', 'expired', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          validStatuses 
        });
      }

      const payment = await paymentService.updatePaymentStatus(referenceNo, status);

      console.log('[Payment] Status updated successfully:', { referenceNo, status });

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ 
        error: 'Failed to update payment status',
        message: error.message
      });
    }
  }
);

// Refresh QR code
app.post('/api/payments/:referenceNo/refresh', async (req, res) => {
  try {
    const { referenceNo } = req.params;

    const result = await paymentService.refreshQRCode(referenceNo);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error refreshing QR code:', error);
    res.status(500).json({ 
      error: 'Failed to refresh QR code',
      message: error.message 
    });
  }
});

// Check if payment is expired
app.get('/api/payments/:referenceNo/expired', (req, res) => {
  try {
    const { referenceNo } = req.params;

    const payment = paymentService.getPaymentByReference(referenceNo);
    const isExpired = paymentService.isPaymentExpired(payment.expire_date);

    res.json({
      success: true,
      data: {
        isExpired,
        expireDate: payment.expire_date,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Error checking payment expiration:', error);
    
    // Handle "Payment not found" error gracefully
    if (error.message === 'Payment not found') {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found',
        message: 'The requested payment does not exist'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to check payment expiration',
      message: error.message 
    });
  }
});

// Send booking confirmation email
app.post('/api/payments/send-confirmation', async (req, res) => {
  try {
    const bookingInfo = req.body;
    
    console.log('[Email] Received confirmation request for:', bookingInfo.customerName);

    // Validate required fields
    if (!bookingInfo.customerName || !bookingInfo.customerEmail || !bookingInfo.referenceNo) {
      return res.status(400).json({ 
        error: 'Missing required fields for email notification' 
      });
    }

    // Prepare email data
    const emailData = {
      customerName: bookingInfo.customerName,
      customerEmail: bookingInfo.customerEmail,
      customerPhone: bookingInfo.customerPhone || 'N/A',
      stadiumName: bookingInfo.stadiumName,
      date: bookingInfo.date,
      ticketName: bookingInfo.ticketName,
      zoneName: bookingInfo.zoneName,
      quantity: bookingInfo.quantity,
      totalPrice: bookingInfo.totalPrice,
      referenceNo: bookingInfo.referenceNo,
      orderNo: bookingInfo.orderNo
    };

    // Send email
    const result = await emailService.sendBookingNotification(emailData);

    res.json({
      success: true,
      message: 'Email notification sent successfully',
      data: result
    });

  } catch (error) {
    console.error('[Email] Error sending confirmation:', error);
    res.status(500).json({ 
      error: 'Failed to send email notification',
      message: error.message 
    });
  }
});

// ==================== Payment Gateway Webhook ====================

// Webhook endpoint for Pay Solutions payment notifications
app.post('/webhook/simple', async (req, res) => {
  try {
    console.log('=== [Webhook] Payment notification received ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('IP:', req.ip);
    console.log('Timestamp:', new Date().toISOString());

    const { 
      Status, 
      PostBackStatus, 
      PostBackType, 
      PostBackURL, 
      Message,
      referenceNo,
      orderNo,
      merchantid,
      total,
      productdetail,
      customeremail,
      refno,
      orderno,
      // Additional fields from Pay Solutions
      amount,
      status
    } = req.body;

    // Log all received data for debugging
    console.log('[Webhook] Parsed data:', {
      Status,
      PostBackStatus,
      PostBackType,
      PostBackURL,
      Message,
      referenceNo: referenceNo || refno,
      orderNo: orderNo || orderno,
      merchantid,
      total,
      productdetail,
      customeremail,
      status,
      amount
    });

    // ✅ Support 2 webhook formats:
    // Format 1: Test format with Status/PostBackStatus
    // Format 2: Production format with refno/orderno/customeremail
    
    let isSuccess = false;
    let ref = null;
    let webhookFormat = 'unknown';

    // Detect webhook format and determine success status
    if (Status && PostBackStatus) {
      // Format 1: Test webhook format
      webhookFormat = 'test';
      isSuccess = Status === 'success' && PostBackStatus === 'success';
      ref = referenceNo || refno;
      console.log('[Webhook] Detected TEST format');
    } else if (refno || referenceNo) {
      // Format 2: Production webhook format
      // Pay Solutions sends payment data without explicit "success" status
      // If we receive the webhook with refno and customeremail, it means payment was successful
      webhookFormat = 'production';
      ref = refno || referenceNo;
      
      // Consider it successful if we have essential payment data
      if (ref && (customeremail || merchantid)) {
        isSuccess = true;
        console.log('[Webhook] Detected PRODUCTION format - Payment successful');
      } else {
        console.log('[Webhook] Detected PRODUCTION format - Missing essential data');
      }
    } else {
      console.error('[Webhook] Unknown webhook format - no reference number found');
    }

    console.log('[Webhook] Format:', webhookFormat);
    console.log('[Webhook] Payment status:', isSuccess ? 'SUCCESS ✅' : 'FAILED ❌');
    console.log('[Webhook] Reference:', ref);

    // Update payment status in database if successful
    if (ref && isSuccess) {
      try {
        console.log(`[Webhook] Updating payment status for reference: ${ref}`);
        const updatedPayment = await paymentService.updatePaymentStatus(ref, 'paid');
        console.log('[Webhook] Payment status updated successfully:', updatedPayment.reference_no);
        console.log('[Webhook] Booking record should be created automatically by updatePaymentStatus');

        // Send confirmation email with booking details
        try {
          // Get booking data from payment
          const bookingStmt = db.prepare('SELECT * FROM bookings WHERE ticket_number = ?');
          const booking = bookingStmt.get(ref);
          
          // Parse booking_metadata to get full booking details
          let bookingMetadata = null;
          if (updatedPayment.booking_metadata) {
            try {
              bookingMetadata = JSON.parse(updatedPayment.booking_metadata);
            } catch (e) {
              console.warn('[Webhook] Error parsing booking_metadata:', e.message);
            }
          }
          
          // Get stadium name from metadata or database
          let stadiumName = 'N/A';
          let ticketName = 'N/A';
          let zoneName = 'N/A';
          
          if (bookingMetadata) {
            // Get stadium name from metadata
            if (bookingMetadata.stadiumData?.name) {
              stadiumName = bookingMetadata.stadiumData.name;
            } else if (bookingMetadata.stadium) {
              // Try to get stadium name from database
              try {
                const stadiums = getStadiumsExtended();
                const stadium = stadiums.find(s => s.id === bookingMetadata.stadium);
                if (stadium) {
                  stadiumName = stadium.name;
                } else {
                  stadiumName = bookingMetadata.stadium;
                }
              } catch (e) {
                stadiumName = bookingMetadata.stadium;
              }
            }
            
            // Get ticket name from metadata
            if (bookingMetadata.ticketData?.name) {
              ticketName = bookingMetadata.ticketData.name;
            } else if (bookingMetadata.ticketName) {
              ticketName = bookingMetadata.ticketName;
            }
            
            // Get zone name from metadata
            if (bookingMetadata.zoneData?.name) {
              zoneName = bookingMetadata.zoneData.name;
            } else if (bookingMetadata.zoneName) {
              zoneName = bookingMetadata.zoneName;
            }
          }
          
          // Fallback to booking record if metadata not available
          if (stadiumName === 'N/A' && booking?.stadium) {
            stadiumName = booking.stadium;
          }
          if (ticketName === 'N/A' && booking?.ticket_name) {
            ticketName = booking.ticket_name;
          }
          if (zoneName === 'N/A' && booking?.zone_name) {
            zoneName = booking.zone_name;
          }
          
          // Get date
          const date = bookingMetadata?.date || bookingMetadata?.dateDisplay || updatedPayment.date || booking?.date || 'N/A';
          
          // Get quantity
          const quantity = bookingMetadata?.quantity || booking?.quantity || updatedPayment.quantity || 1;

          // Prepare email data with complete customer information
          console.log('[Webhook] Updated payment ID:', updatedPayment.id);
          console.log('[Webhook] Updated payment order_no:', updatedPayment.order_no);
          
          const emailData = {
            customerName: updatedPayment.customer_name || booking?.name || 'N/A',
            customerEmail: updatedPayment.customer_email || booking?.email || 'N/A',
            customerPhone: updatedPayment.customer_phone || booking?.phone || 'N/A',
            stadiumName: stadiumName,
            date: date,
            ticketName: ticketName,
            zoneName: zoneName,
            quantity: quantity,
            totalPrice: updatedPayment.amount || booking?.total_price || 0,
            referenceNo: ref,
            orderNo: updatedPayment.id ? String(updatedPayment.id).padStart(6, '0') : (updatedPayment.order_no || 'N/A') // ใช้ ID แทน order_no และ format เป็น 000001
          };
          
          console.log('[Webhook] Email data prepared:', emailData);
          console.log('[Webhook] Order Number (formatted):', emailData.orderNo);

          // Send email notifications
          // 1. Send to admin
          await emailService.sendBookingNotification(emailData);
          console.log('[Webhook] ✅ Admin email notification sent');
          
          // 2. Send to customer with success page link
          await emailService.sendCustomerConfirmation(emailData);
          console.log('[Webhook] ✅ Customer confirmation email sent to:', emailData.customerEmail);

        } catch (emailError) {
          console.error('[Webhook] Error sending email notification:', emailError.message);
          // Don't fail webhook if email fails
        }

      } catch (error) {
        console.error('[Webhook] Error updating payment:', error.message);
        console.error('[Webhook] Error details:', error);
        // Continue processing webhook even if DB update fails
      }
    } else if (!ref) {
      console.warn('[Webhook] No reference number found in webhook data');
    } else if (!isSuccess) {
      console.warn('[Webhook] Payment was not successful');
    }

    // Always respond with 200 OK to acknowledge webhook receipt
    // This prevents Pay Solutions from retrying
    // If payment is successful, include success page URL in response
    const response = {
      success: true,
      message: 'Webhook received successfully',
      status: isSuccess ? 'payment_confirmed' : 'payment_received',
      format: webhookFormat,
      referenceNo: ref,
      timestamp: new Date().toISOString()
    };

    // If payment is successful, include success page URL
    if (isSuccess && ref) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://dsmuaythaiticket.com';
      response.successPageUrl = `${frontendUrl}/success?ref=${ref}`;
      response.message = 'Payment confirmed. Customer can visit success page.';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('=== [Webhook] Error processing webhook ===');
    console.error(error);
    
    // Still respond with 200 to prevent retries
    res.status(200).json({
      success: true,
      message: 'Webhook received (with errors)',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Stadium Ticket Configuration Routes

// Get ticket configuration for a stadium
app.get('/api/stadiums/:stadiumId/tickets', (req, res) => {
  const { stadiumId } = req.params;
  console.log(`Getting ticket config for stadium: ${stadiumId}`);
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      console.error(`Stadium not found: ${stadiumId}`);
      return res.status(404).json({ error: 'Stadium not found' });
    }
    
    const config = getTicketConfig(stadiumId);
    console.log(`Returning config for ${stadiumId}:`, {
      regularTickets: config.regularTickets?.length || 0,
      specialTickets: config.specialTickets?.length || 0
    });
    res.json(config);
  } catch (err) {
    console.error('Error getting ticket config:', err);
    res.status(500).json({ error: 'Failed to retrieve ticket configuration' });
  }
});

// Add regular ticket to a stadium
app.post('/api/stadiums/:stadiumId/tickets/regular', (req, res) => {
  const { stadiumId } = req.params;
  const { name, price, quantity, day_of_week, match_id, match_name, days } = req.body;
  
  console.log(`Adding regular ticket to ${stadiumId}:`, { name, price, quantity, day_of_week, match_id, match_name, days });
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      console.error(`Stadium not found: ${stadiumId}`);
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  if (!name || !price) {
    console.error('Missing required fields:', { name, price });
    return res.status(400).json({ error: 'Name and price are required' });
  }
  
  // Validate day_of_week if provided (0-6, where 0 = Sunday, 1 = Monday, etc.)
  if (day_of_week !== undefined && day_of_week !== null) {
    const day = parseInt(day_of_week);
    if (isNaN(day) || day < 0 || day > 6) {
      return res.status(400).json({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' });
    }
  }
  
  // Validate days array if provided
  let daysArray = null;
  if (days !== undefined && days !== null) {
    if (Array.isArray(days)) {
      daysArray = days.filter(d => d >= 0 && d <= 6).map(d => parseInt(d));
    } else if (typeof days === 'string') {
      try {
        daysArray = JSON.parse(days).filter(d => d >= 0 && d <= 6).map(d => parseInt(d));
      } catch (e) {
        return res.status(400).json({ error: 'Invalid days format' });
      }
    }
  }
  
  try {
    const ticket = {
      id: uuidv4(),
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      day_of_week: day_of_week !== undefined && day_of_week !== null ? parseInt(day_of_week) : null,
      match_id: match_id !== undefined && match_id !== null ? parseInt(match_id) : null,
      match_name: match_name || null,
      days: daysArray
    };
    
    createRegularTicket(stadiumId, ticket);
    console.log(`Ticket added successfully to database for ${stadiumId}`);
    res.status(201).json({ message: 'Regular ticket added', ticket });
  } catch (err) {
    console.error('Error adding regular ticket:', err);
    res.status(500).json({ error: 'Failed to add regular ticket' });
  }
});

// Update regular ticket
app.put('/api/stadiums/:stadiumId/tickets/regular/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  const { name, price, quantity, day_of_week, match_id, match_name, days } = req.body;
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  // Validate day_of_week if provided
  if (day_of_week !== undefined && day_of_week !== null) {
    const day = parseInt(day_of_week);
    if (isNaN(day) || day < 0 || day > 6) {
      return res.status(400).json({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' });
    }
  }
  
  // Validate days array if provided
  let daysArray = undefined;
  if (days !== undefined) {
    if (days === null) {
      daysArray = null;
    } else if (Array.isArray(days)) {
      daysArray = days.filter(d => d >= 0 && d <= 6).map(d => parseInt(d));
    } else if (typeof days === 'string') {
      try {
        daysArray = JSON.parse(days).filter(d => d >= 0 && d <= 6).map(d => parseInt(d));
      } catch (e) {
        return res.status(400).json({ error: 'Invalid days format' });
      }
    }
  }
  
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (day_of_week !== undefined) updates.day_of_week = day_of_week !== null ? parseInt(day_of_week) : null;
    if (match_id !== undefined) updates.match_id = match_id !== null ? parseInt(match_id) : null;
    if (match_name !== undefined) updates.match_name = match_name || null;
    if (days !== undefined) updates.days = daysArray;
    
    const ticket = updateRegularTicket(stadiumId, ticketId, updates);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket updated', ticket });
  } catch (err) {
    console.error('Error updating regular ticket:', err);
    res.status(500).json({ error: 'Failed to update regular ticket' });
  }
});

// Delete regular ticket
app.delete('/api/stadiums/:stadiumId/tickets/regular/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  try {
    const result = deleteRegularTicket(stadiumId, ticketId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error('Error deleting regular ticket:', err);
    res.status(500).json({ error: 'Failed to delete regular ticket' });
  }
});

// Add special ticket to a stadium
app.post('/api/stadiums/:stadiumId/tickets/special', async (req, res) => {
  const { stadiumId } = req.params;
  const { name, price, date, scheduleDays, quantity } = req.body;
  
  console.log(`Adding special ticket to ${stadiumId}:`, { name, price, date, quantity });
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      console.error(`Stadium not found: ${stadiumId}`);
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  if (!name || !price || !date) {
    console.error('Missing required fields:', { name, price, date });
    return res.status(400).json({ error: 'Name, price, and date are required' });
  }
  
  // Validate that the date matches the stadium's schedule days
  if (scheduleDays && Array.isArray(scheduleDays) && scheduleDays.length > 0) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    if (!scheduleDays.includes(dayOfWeek)) {
      console.error('Date does not match schedule days:', { date, dayOfWeek, scheduleDays });
      return res.status(400).json({ error: 'Special ticket date must match the stadium\'s fight schedule days' });
    }
  }
  
  try {
    // Process image if provided
    let processedImage = null;
    if (req.body.image) {
      processedImage = await processImage(req.body.image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }

    const ticket = {
      id: uuidv4(),
      name,
      price: parseFloat(price),
      date,
      quantity: parseInt(quantity) || 0,
      image: processedImage
    };
    
    createSpecialTicket(stadiumId, ticket);
    console.log(`Special ticket added successfully to database for ${stadiumId}`);
    res.status(201).json({ message: 'Special ticket added', ticket });
  } catch (err) {
    console.error('Error adding special ticket:', err);
    res.status(500).json({ error: 'Failed to add special ticket' });
  }
});

// Update special ticket
app.put('/api/stadiums/:stadiumId/tickets/special/:ticketId', async (req, res) => {
  const { stadiumId, ticketId } = req.params;
  const { name, price, date, scheduleDays, quantity } = req.body;
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  // Validate date if provided
  if (date && scheduleDays && Array.isArray(scheduleDays) && scheduleDays.length > 0) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    if (!scheduleDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: 'Special ticket date must match the stadium\'s fight schedule days' });
    }
  }
  
  try {
    // Process image if provided
    let processedImage = undefined;
    if (req.body.image !== undefined) {
      if (req.body.image) {
        processedImage = await processImage(req.body.image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
      } else {
        processedImage = null; // Allow clearing image
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (date !== undefined) updates.date = date;
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (processedImage !== undefined) updates.image = processedImage;
    
    const ticket = updateSpecialTicket(stadiumId, ticketId, updates);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Special ticket updated', ticket });
  } catch (err) {
    console.error('Error updating special ticket:', err);
    res.status(500).json({ error: 'Failed to update special ticket' });
  }
});

// Delete special ticket
app.delete('/api/stadiums/:stadiumId/tickets/special/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  
  // Validate stadium exists in database
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  try {
    const result = deleteSpecialTicket(stadiumId, ticketId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ message: 'Special ticket deleted' });
  } catch (err) {
    console.error('Error deleting special ticket:', err);
    res.status(500).json({ error: 'Failed to delete special ticket' });
  }
});

// ==================== Daily Ticket Adjustments API ====================

// Get tickets for a specific date
app.get('/api/stadiums/:stadiumId/tickets/date/:date', (req, res) => {
  const { stadiumId, date } = req.params;
  
  // Clean date parameter (remove any trailing characters like :1)
  const cleanDate = date.split(':')[0];
  
  console.log(`[getTicketsForDate] Request: stadiumId=${stadiumId}, date=${date}, cleanDate=${cleanDate}`);
  
  // Validate stadium exists
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      console.error(`[getTicketsForDate] Stadium not found: ${stadiumId}`);
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('[getTicketsForDate] Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium', details: err.message });
  }
  
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    console.error(`[getTicketsForDate] Invalid date format: ${cleanDate}`);
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD', received: cleanDate });
  }
  
  try {
    const tickets = getTicketsForDate(stadiumId, cleanDate);
    console.log(`[getTicketsForDate] Success: stadiumId=${stadiumId}, date=${cleanDate}, regularTickets=${tickets.regularTickets?.length || 0}, specialTickets=${tickets.specialTickets?.length || 0}`);
    res.json(tickets);
  } catch (err) {
    console.error('[getTicketsForDate] Error getting tickets for date:', err);
    console.error('[getTicketsForDate] Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to get tickets for date', 
      details: err.message,
      stadiumId,
      date: cleanDate
    });
  }
});

// Update ticket for a specific date
app.put('/api/stadiums/:stadiumId/tickets/date/:date/:ticketId', (req, res) => {
  const { stadiumId, date, ticketId } = req.params;
  const { ticket_type, name_override, price_override, quantity, enabled } = req.body;
  
  // Validate stadium exists
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  // Validate ticket_type
  if (!ticket_type || !['regular', 'special'].includes(ticket_type)) {
    return res.status(400).json({ error: 'ticket_type must be "regular" or "special"' });
  }
  
  try {
    const updates = {};
    if (name_override !== undefined) updates.name_override = name_override;
    if (price_override !== undefined) updates.price_override = price_override !== null ? parseFloat(price_override) : null;
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (enabled !== undefined) updates.enabled = enabled === true || enabled === 1 || enabled === '1';
    
    const result = updateTicketForDate(stadiumId, ticketId, ticket_type, date, updates);
    if (!result) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket updated for date', ticket: result });
  } catch (err) {
    console.error('Error updating ticket for date:', err);
    res.status(500).json({ error: 'Failed to update ticket for date' });
  }
});

// Toggle enabled status for all tickets on a date
app.put('/api/stadiums/:stadiumId/tickets/date/:date/toggle-enabled', (req, res) => {
  const { stadiumId, date } = req.params;
  const { enabled } = req.body;
  
  // Validate stadium exists
  try {
    const allStadiums = getStadiumsExtended();
    const stadiumExists = allStadiums.find(s => s.id === stadiumId);
    if (!stadiumExists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error checking stadium:', err);
    return res.status(500).json({ error: 'Failed to validate stadium' });
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  try {
    // Get all tickets for this date
    const tickets = getTicketsForDate(stadiumId, date);
    const allTickets = [...tickets.regularTickets, ...tickets.specialTickets];
    
    // Update enabled status for all tickets
    const enabledValue = enabled === true || enabled === 1 || enabled === '1';
    const updates = allTickets.map(ticket => {
      return updateTicketForDate(stadiumId, ticket.id, ticket.ticket_type, date, {
        enabled: enabledValue
      });
    });
    
    res.json({ 
      message: `Tickets ${enabledValue ? 'enabled' : 'disabled'} for date`,
      updated: updates.length
    });
  } catch (err) {
    console.error('Error toggling enabled status:', err);
    res.status(500).json({ error: 'Failed to toggle enabled status' });
  }
});

// ==================== Images & Content Management API ====================

// Hero Image
app.get('/api/images/hero', (req, res) => {
  try {
    const hero = getHeroImage();
    res.json(hero);
  } catch (err) {
    console.error('Error getting hero image:', err);
    res.status(500).json({ error: 'Failed to get hero image' });
  }
});

app.put('/api/images/hero', async (req, res) => {
  try {
    const { image, alt, fallback } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    let processedFallback = fallback;
    
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    if (fallback) {
      processedFallback = await processImage(fallback, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const hero = updateHeroImage(processedImage, alt, processedFallback);
    res.json(hero);
  } catch (err) {
    console.error('Error updating hero image:', err);
    res.status(500).json({ error: 'Failed to update hero image', message: err.message });
  }
});

// Highlights
app.get('/api/images/highlights', (req, res) => {
  try {
    const highlights = getHighlights();
    res.json(highlights);
  } catch (err) {
    console.error('Error getting highlights:', err);
    res.status(500).json({ error: 'Failed to get highlights' });
  }
});

app.post('/api/images/highlights', async (req, res) => {
  try {
    const { image, ...rest } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const highlight = createHighlight({ ...rest, image: processedImage });
    res.status(201).json(highlight);
  } catch (err) {
    console.error('Error creating highlight:', err);
    res.status(500).json({ error: 'Failed to create highlight', message: err.message });
  }
});

app.put('/api/images/highlights/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { image, ...rest } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const highlight = updateHighlight(id, { ...rest, image: processedImage });
    res.json(highlight);
  } catch (err) {
    console.error('Error updating highlight:', err);
    res.status(500).json({ error: 'Failed to update highlight', message: err.message });
  }
});

app.delete('/api/images/highlights/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    deleteHighlight(id);
    res.json({ message: 'Highlight deleted successfully' });
  } catch (err) {
    console.error('Error deleting highlight:', err);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// Stadiums (Extended)
app.get('/api/images/stadiums', (req, res) => {
  try {
    const stadiums = getStadiumsExtended();
    res.json(stadiums);
  } catch (err) {
    console.error('Error getting stadiums:', err);
    res.status(500).json({ error: 'Failed to get stadiums' });
  }
});

app.post('/api/images/stadiums', async (req, res) => {
  try {
    const { id, name, location, image, schedule, scheduleDays, logoBase64, paymentImage } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'Stadium id and name are required' });
    }
    
    // Check if stadium already exists
    const existingStadiums = getStadiumsExtended();
    if (existingStadiums.find(s => s.id === id)) {
      return res.status(400).json({ error: 'Stadium with this id already exists' });
    }
    
    // Convert images to WebP if provided
    let processedImage = image;
    let processedLogoBase64 = logoBase64;
    let processedPaymentImage = paymentImage;
    
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    if (logoBase64) {
      processedLogoBase64 = await processImage(logoBase64, { quality: 90, maxWidth: 500, maxHeight: 500 });
    }
    
    if (paymentImage) {
      processedPaymentImage = await processImage(paymentImage, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const stadium = createStadiumExtended({
      id,
      name,
      location,
      image: processedImage || '',
      schedule: schedule || { th: '', en: '' },
      scheduleDays: scheduleDays || [],
      logoBase64: processedLogoBase64,
      paymentImage: processedPaymentImage
    });
    
    res.status(201).json(stadium);
  } catch (err) {
    console.error('Error creating stadium:', err);
    res.status(500).json({ error: 'Failed to create stadium', message: err.message });
  }
});

app.put('/api/images/stadiums/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { image, logoBase64, paymentImage, ...rest } = req.body;
    
    // Convert images to WebP if provided
    let processedImage = image;
    let processedLogoBase64 = logoBase64;
    let processedPaymentImage = paymentImage;
    
    if (image !== undefined) {
      processedImage = image ? await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 }) : image;
    }
    
    if (logoBase64 !== undefined) {
      processedLogoBase64 = logoBase64 ? await processImage(logoBase64, { quality: 90, maxWidth: 500, maxHeight: 500 }) : logoBase64;
    }
    
    // Note: paymentImage is deprecated, use payment images API instead
    if (paymentImage !== undefined) {
      processedPaymentImage = paymentImage ? await processImage(paymentImage, { quality: 85, maxWidth: 1920, maxHeight: 1080 }) : paymentImage;
    }
    
    const updateData = {
      ...rest,
      ...(image !== undefined && { image: processedImage }),
      ...(logoBase64 !== undefined && { logoBase64: processedLogoBase64 }),
      ...(paymentImage !== undefined && { paymentImage: processedPaymentImage })
    };
    
    const stadium = updateStadiumExtended(id, updateData);
    res.json(stadium);
  } catch (err) {
    console.error('Error updating stadium:', err);
    res.status(500).json({ error: 'Failed to update stadium', message: err.message });
  }
});

// Stadium Payment Images endpoints
app.get('/api/stadiums/:stadiumId/payment-images', (req, res) => {
  try {
    const { stadiumId } = req.params;
    const images = getStadiumPaymentImages(stadiumId);
    res.json(images);
  } catch (err) {
    console.error('Error getting payment images:', err);
    res.status(500).json({ error: 'Failed to get payment images' });
  }
});

app.post('/api/stadiums/:stadiumId/payment-images', async (req, res) => {
  try {
    const { stadiumId } = req.params;
    const { image, days } = req.body;
    
    if (!image || !days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ error: 'Image and days array are required' });
    }
    
    // Process image
    const processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    
    const imageData = createStadiumPaymentImage(stadiumId, {
      image: processedImage,
      days
    });
    
    res.status(201).json(imageData);
  } catch (err) {
    console.error('Error creating payment image:', err);
    res.status(500).json({ error: 'Failed to create payment image' });
  }
});

app.put('/api/stadiums/:stadiumId/payment-images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { image, days } = req.body;
    
    const updateData = {};
    if (image !== undefined) {
      updateData.image = image ? await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 }) : null;
    }
    if (days !== undefined) {
      if (!Array.isArray(days) || days.length === 0) {
        return res.status(400).json({ error: 'Days must be a non-empty array' });
      }
      updateData.days = days;
    }
    
    const imageData = updateStadiumPaymentImage(parseInt(imageId), updateData);
    res.json(imageData);
  } catch (err) {
    console.error('Error updating payment image:', err);
    res.status(500).json({ error: 'Failed to update payment image' });
  }
});

app.delete('/api/stadiums/:stadiumId/payment-images/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    const result = deleteStadiumPaymentImage(parseInt(imageId));
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Payment image not found' });
    }
    
    res.json({ message: 'Payment image deleted' });
  } catch (err) {
    console.error('Error deleting payment image:', err);
    res.status(500).json({ error: 'Failed to delete payment image' });
  }
});

app.delete('/api/images/stadiums/:id', (req, res) => {
  try {
    const id = req.params.id;
    const deleted = deleteStadiumExtended(id);
    if (deleted) {
      res.json({ message: 'Stadium deleted successfully' });
    } else {
      res.status(404).json({ error: 'Stadium not found' });
    }
  } catch (err) {
    console.error('Error deleting stadium:', err);
    res.status(500).json({ error: 'Failed to delete stadium' });
  }
});

// Stadium Image Schedules
app.get('/api/images/stadium-schedules', (req, res) => {
  try {
    const schedules = getStadiumImageSchedules();
    res.json(schedules);
  } catch (err) {
    console.error('Error getting stadium schedules:', err);
    res.status(500).json({ error: 'Failed to get stadium schedules' });
  }
});

app.put('/api/images/stadium-schedules/:stadiumId', async (req, res) => {
  try {
    const stadiumId = req.params.stadiumId;
    const schedules = req.body;
    
    // Convert images in schedules to WebP
    const processedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        if (schedule.image) {
          const processedImage = await processImage(schedule.image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
          return { ...schedule, image: processedImage };
        }
        return schedule;
      })
    );
    
    const updated = updateStadiumImageSchedules(stadiumId, processedSchedules);
    res.json(updated);
  } catch (err) {
    console.error('Error updating stadium schedules:', err);
    res.status(500).json({ error: 'Failed to update stadium schedules', message: err.message });
  }
});

// Special Matches
app.get('/api/images/special-matches', (req, res) => {
  try {
    const matches = getSpecialMatches();
    res.json(matches);
  } catch (err) {
    console.error('Error getting special matches:', err);
    res.status(500).json({ error: 'Failed to get special matches' });
  }
});

app.post('/api/images/special-matches', async (req, res) => {
  try {
    const { image, ...rest } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const match = createSpecialMatch({ ...rest, image: processedImage });
    res.status(201).json(match);
  } catch (err) {
    console.error('Error creating special match:', err);
    res.status(500).json({ error: 'Failed to create special match', message: err.message });
  }
});

app.put('/api/images/special-matches/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { image, ...rest } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const match = updateSpecialMatch(id, { ...rest, image: processedImage });
    res.json(match);
  } catch (err) {
    console.error('Error updating special match:', err);
    res.status(500).json({ error: 'Failed to update special match', message: err.message });
  }
});

app.delete('/api/images/special-matches/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    deleteSpecialMatch(id);
    res.json({ message: 'Special match deleted successfully' });
  } catch (err) {
    console.error('Error deleting special match:', err);
    res.status(500).json({ error: 'Failed to delete special match' });
  }
});

// Daily Images
app.get('/api/images/daily-images', (req, res) => {
  try {
    const images = getDailyImages();
    res.json(images);
  } catch (err) {
    console.error('Error getting daily images:', err);
    res.status(500).json({ error: 'Failed to get daily images' });
  }
});

app.post('/api/images/daily-images', async (req, res) => {
  try {
    const { image, ...rest } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const dailyImage = createDailyImage({ ...rest, image: processedImage });
    res.status(201).json(dailyImage);
  } catch (err) {
    console.error('Error creating daily image:', err);
    res.status(500).json({ error: 'Failed to create daily image', message: err.message });
  }
});

app.put('/api/images/daily-images/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { image, ...rest } = req.body;
    
    // Convert image to WebP if provided
    let processedImage = image;
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const dailyImage = updateDailyImage(id, { ...rest, image: processedImage });
    res.json(dailyImage);
  } catch (err) {
    console.error('Error updating daily image:', err);
    res.status(500).json({ error: 'Failed to update daily image', message: err.message });
  }
});

app.delete('/api/images/daily-images/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    deleteDailyImage(id);
    res.json({ message: 'Daily image deleted successfully' });
  } catch (err) {
    console.error('Error deleting daily image:', err);
    res.status(500).json({ error: 'Failed to delete daily image' });
  }
});

// Upcoming Fights Background
app.get('/api/images/upcoming-fights-background', (req, res) => {
  try {
    const background = getUpcomingFightsBackground();
    res.json(background);
  } catch (err) {
    console.error('Error getting upcoming fights background:', err);
    res.status(500).json({ error: 'Failed to get upcoming fights background' });
  }
});

app.put('/api/images/upcoming-fights-background', async (req, res) => {
  try {
    const { image, fallback } = req.body;
    
    // Convert images to WebP if provided
    let processedImage = image;
    let processedFallback = fallback;
    
    if (image) {
      processedImage = await processImage(image, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    if (fallback) {
      processedFallback = await processImage(fallback, { quality: 85, maxWidth: 1920, maxHeight: 1080 });
    }
    
    const background = updateUpcomingFightsBackground(processedImage, processedFallback);
    res.json(background);
  } catch (err) {
    console.error('Error updating upcoming fights background:', err);
    res.status(500).json({ error: 'Failed to update upcoming fights background', message: err.message });
  }
});

// PromptPay QR
app.get('/api/images/promptpay-qr', (req, res) => {
  try {
    const qr = getPromptPayQr();
    res.json({ promptPayQr: qr });
  } catch (err) {
    console.error('Error getting PromptPay QR:', err);
    res.status(500).json({ error: 'Failed to get PromptPay QR' });
  }
});

app.put('/api/images/promptpay-qr', async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    // Convert QR code image to WebP if provided
    let processedQrCode = qrCode;
    if (qrCode) {
      processedQrCode = await processImage(qrCode, { quality: 90, maxWidth: 1000, maxHeight: 1000 });
    }
    
    const qr = updatePromptPayQr(processedQrCode);
    res.json({ promptPayQr: qr });
  } catch (err) {
    console.error('Error updating PromptPay QR:', err);
    res.status(500).json({ error: 'Failed to update PromptPay QR', message: err.message });
  }
});

// News Popup Images
app.get('/api/images/news-popup', (req, res) => {
  try {
    const images = getNewsPopupImages();
    res.json(images);
  } catch (err) {
    console.error('Error getting news popup images:', err);
    res.status(500).json({ error: 'Failed to get news popup images' });
  }
});

app.post('/api/images/news-popup', async (req, res) => {
  try {
    const { image, displayOrder } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }
    
    // Check if we already have 5 images
    const existingImages = getNewsPopupImages();
    if (existingImages.length >= 5) {
      return res.status(400).json({ error: 'Maximum 5 news popup images allowed' });
    }
    
    // Resize image to match popup display size
    // Desktop: max-w-4xl (896px) - padding (32px) = 864px width
    // Height: 90vh - footer (~80px), but use 1200px for good quality
    // Mobile: responsive, but use 800px width for good quality
    let processedImage = image;
    if (image) {
      // Resize to 864px width (desktop max) and 1200px height (for good aspect ratio)
      // This ensures image fits perfectly in popup without scaling
      processedImage = await processImage(image, { quality: 90, maxWidth: 864, maxHeight: 1200 });
    }
    
    const newImage = createNewsPopupImage(processedImage, displayOrder || 0);
    res.status(201).json(newImage);
  } catch (err) {
    console.error('Error creating news popup image:', err);
    res.status(500).json({ error: 'Failed to create news popup image', message: err.message });
  }
});

app.put('/api/images/news-popup/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { image, displayOrder } = req.body;
    
    const updates = {};
    if (image !== undefined) {
      // Resize image to match popup display size
      // Desktop: max-w-4xl (896px) - padding (32px) = 864px width
      // Height: 90vh - footer (~80px), but use 1200px for good quality
      let processedImage = image;
      if (image) {
        processedImage = await processImage(image, { quality: 90, maxWidth: 864, maxHeight: 1200 });
      }
      updates.image = processedImage;
    }
    if (displayOrder !== undefined) {
      updates.display_order = displayOrder;
    }
    
    const updatedImage = updateNewsPopupImage(id, updates);
    res.json(updatedImage);
  } catch (err) {
    console.error('Error updating news popup image:', err);
    res.status(500).json({ error: 'Failed to update news popup image', message: err.message });
  }
});

app.delete('/api/images/news-popup/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    deleteNewsPopupImage(id);
    res.json({ message: 'News popup image deleted successfully' });
  } catch (err) {
    console.error('Error deleting news popup image:', err);
    res.status(500).json({ error: 'Failed to delete news popup image' });
  }
});

// Get All Images Data (for frontend initialization)
app.get('/api/images/all', (req, res) => {
  try {
    const hero = getHeroImage();
    const highlights = getHighlights();
    const stadiums = getStadiumsExtended();
    const stadiumSchedules = getStadiumImageSchedules();
    const specialMatches = getSpecialMatches();
    const upcomingFightsBackground = getUpcomingFightsBackground();
    const promptPayQr = getPromptPayQr();
    const newsPopupImages = getNewsPopupImages();
    
    res.json({
      hero,
      highlights,
      stadiums,
      newsPopupImages,
      stadiumImageSchedules: stadiumSchedules,
      specialMatches,
      upcomingFightsBackground,
      promptPayQr,
      newsPopupImages
    });
  } catch (err) {
    console.error('Error getting all images data:', err);
    res.status(500).json({ error: 'Failed to get all images data' });
  }
});

// ============================================================
// NEW API ENDPOINTS - Business Logic moved from Frontend
// ============================================================

/**
 * Check ticket availability for a specific date
 * GET /api/tickets/check-availability?stadiumId=rajadamnern&date=2025-01-15
 */
app.get('/api/tickets/check-availability', (req, res) => {
  try {
    const { stadiumId, date } = req.query;
    
    // Validate required parameters
    if (!stadiumId || !date) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'stadiumId and date are required' 
      });
    }
    
    // Validate formats
    if (!isValidStadiumId(stadiumId)) {
      return res.status(400).json({ 
        error: 'Invalid stadium ID',
        details: 'Stadium ID must be one of: rajadamnern, lumpinee, bangla, patong' 
      });
    }
    
    if (!isValidDateFormat(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format' 
      });
    }
    
    const ticketConfig = getTicketConfigService(stadiumId);
    const isAvailable = hasAvailableTickets(date, stadiumId, ticketConfig);
    
    res.json({ 
      success: true,
      stadiumId, 
      date, 
      isAvailable,
      ticketConfig 
    });
  } catch (err) {
    console.error('Error checking ticket availability:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check ticket availability',
      message: err.message 
    });
  }
});

/**
 * Get available tickets for a specific date
 * GET /api/tickets/available?stadiumId=rajadamnern&date=2025-01-15
 */
app.get('/api/tickets/available', (req, res) => {
  try {
    const { stadiumId, date } = req.query;
    
    // Validate required parameters
    if (!stadiumId || !date) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'stadiumId and date are required' 
      });
    }
    
    // Validate formats
    if (!isValidStadiumId(stadiumId)) {
      return res.status(400).json({ 
        error: 'Invalid stadium ID',
        details: 'Stadium ID must be one of: rajadamnern, lumpinee, bangla, patong' 
      });
    }
    
    if (!isValidDateFormat(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format' 
      });
    }
    
    const tickets = getAvailableTicketsForDate(stadiumId, date);
    
    res.json({ 
      success: true,
      stadiumId, 
      date, 
      ...tickets 
    });
  } catch (err) {
    console.error('Error getting available tickets:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get available tickets',
      message: err.message 
    });
  }
});

/**
 * Get upcoming events for a stadium
 * GET /api/events/upcoming?stadiumId=rajadamnern&limit=4
 */
app.get('/api/events/upcoming', (req, res) => {
  try {
    const { stadiumId, limit } = req.query;
    
    if (!stadiumId) {
      return res.status(400).json({ error: 'stadiumId is required' });
    }
    
    // Get stadium schedule days
    const stadiumExtended = getStadiumsExtended().find(s => s.id === stadiumId);
    const scheduleDays = stadiumExtended?.schedule_days 
      ? JSON.parse(stadiumExtended.schedule_days) 
      : [0, 1, 2, 3, 4, 5, 6];
    
    const events = getStadiumEvents(
      stadiumId, 
      scheduleDays, 
      limit ? parseInt(limit) : 4
    );
    
    res.json({ 
      stadiumId, 
      events 
    });
  } catch (err) {
    console.error('Error getting upcoming events:', err);
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

/**
 * Get upcoming events for all stadiums
 * GET /api/events/all-upcoming
 */
app.get('/api/events/all-upcoming', (req, res) => {
  try {
    // Get all stadiums from database instead of hardcoded array
    const allStadiumsExtended = getStadiumsExtended();
    const stadiums = allStadiumsExtended.map(stadium => {
      const scheduleDays = stadium.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
      
      return {
        id: stadium.id,
        name: typeof stadium.name === 'object' ? (stadium.name.en || stadium.name.th || '') : stadium.name,
        scheduleDays
      };
    });
    
    const events = getAllUpcomingEvents(stadiums);
    
    res.json({ events });
  } catch (err) {
    console.error('Error getting all upcoming events:', err);
    res.status(500).json({ error: 'Failed to get all upcoming events' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Muay Thai Ticket API is running' });
});

// ==================== Auto Ticket Generation API ====================

/**
 * Generate tickets for next month (RAJADAMNERN only)
 * POST /api/stadiums/rajadamnern/tickets/auto-generate
 */
app.post('/api/stadiums/rajadamnern/tickets/auto-generate',
  rateLimit(5, 60000), // Max 5 requests per minute
  requireAdmin, // Require admin authentication
  async (req, res) => {
    try {
      const result = generateNextMonthTickets('rajadamnern');
      
      res.json({
        success: true,
        message: 'Tickets generated successfully',
        result: {
          ticketsCreated: result.ticketsCreated,
          ticketsSkipped: result.ticketsSkipped,
          datesProcessed: result.datesProcessed,
          dateDetails: result.dateDetails,
          errors: result.errors.length > 0 ? result.errors : undefined
        }
      });
    } catch (err) {
      console.error('Error generating tickets:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to generate tickets',
        message: err.message
      });
    }
  }
);

/**
 * Get auto-generation status
 * GET /api/stadiums/rajadamnern/tickets/auto-generate/status
 */
app.get('/api/stadiums/rajadamnern/tickets/auto-generate/status',
  requireAdmin, // Require admin authentication
  (req, res) => {
    try {
      const lastGeneratedDate = getLastGeneratedDate('rajadamnern');
      const templates = getTicketTemplates();
      
      res.json({
        success: true,
        stadiumId: 'rajadamnern',
        lastGeneratedDate: lastGeneratedDate ? lastGeneratedDate.toISOString() : null,
        templates: templates,
        templateCount: templates.length
      });
    } catch (err) {
      console.error('Error getting auto-generation status:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to get status',
        message: err.message
      });
    }
  }
);

/**
 * Manually check and generate tickets (if new month)
 * POST /api/stadiums/rajadamnern/tickets/auto-generate/check
 */
app.post('/api/stadiums/rajadamnern/tickets/auto-generate/check',
  rateLimit(5, 60000), // Max 5 requests per minute
  requireAdmin, // Require admin authentication
  (req, res) => {
    try {
      const result = manualCheck('rajadamnern');
      
      if (result) {
        res.json({
          success: true,
          message: 'Tickets generated (new month detected)',
          result: {
            ticketsCreated: result.ticketsCreated,
            ticketsSkipped: result.ticketsSkipped,
            datesProcessed: result.datesProcessed,
            dateDetails: result.dateDetails,
            errors: result.errors.length > 0 ? result.errors : undefined
          }
        });
      } else {
        res.json({
          success: true,
          message: 'No tickets generated (not a new month)',
          result: null
        });
      }
    } catch (err) {
      console.error('Error checking and generating tickets:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to check and generate tickets',
        message: err.message
      });
    }
  }
);

// Reset expired ticket quantities on server start
// รีเซ็ตจำนวนตั๋วของวันที่ผ่านไปแล้วให้กลับเป็น initial_quantity
try {
  const resetCount = resetExpiredTicketQuantities();
  if (resetCount > 0) {
    console.log(`✅ Reset ${resetCount} expired ticket quantity records`);
  }
} catch (error) {
  console.error('⚠️  Error resetting expired ticket quantities:', error);
}

// Endpoint for manually resetting expired ticket quantities (Admin only)
app.post('/api/tickets/reset-expired', 
  rateLimit(5, 60000), // Max 5 requests per minute
  verifyApiKey, // Require valid API key
  (req, res) => {
    try {
      const resetCount = resetExpiredTicketQuantities();
      res.json({
        success: true,
        message: `Reset ${resetCount} expired ticket quantity records`,
        resetCount
      });
    } catch (error) {
      console.error('Error resetting expired ticket quantities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset expired ticket quantities',
        message: error.message
      });
    }
  }
);

// Start server after database initialization
(async () => {
  try {
    await initDatabase();
  console.log('✅ Database and migrations ready');
  
    // Start auto ticket generation scheduler
    startScheduler(1); // Check daily at 1 AM
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
      console.log(`📊 API endpoints available at http://0.0.0.0:${PORT}/api`);
      console.log(`🌐 Accessible from all network interfaces`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();

