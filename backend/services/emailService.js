import pkg from 'nodemailer';
const nodemailer = pkg.default || pkg;

// Email Configuration - Uses environment variables
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// Admin notification email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

class EmailService {
  constructor() {
    // Initialize config validity flag
    this.isConfigValid = false;
    
    // Validate email configuration before creating transporter
    const isValid = this.validateConfig();
    
    // Only create transporter if config is valid
    if (isValid) {
      // Create reusable transporter
      this.transporter = nodemailer.createTransport(EMAIL_CONFIG);
      
      // Log configuration (without password)
      console.log('[EmailService] Initialized with config:', {
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        user: EMAIL_CONFIG.auth.user,
        adminEmail: ADMIN_EMAIL,
        hasPassword: !!EMAIL_CONFIG.auth.pass
      });
    } else {
      // Create a dummy transporter to prevent errors, but it won't work
      this.transporter = null;
      console.warn('[EmailService] ⚠️ Email service initialized but not configured. Emails will not be sent.');
    }
  }

  /**
   * Validate email configuration
   */
  validateConfig() {
    const errors = [];
    
    // Check if host is set and not empty
    if (!EMAIL_CONFIG.host || typeof EMAIL_CONFIG.host !== 'string' || EMAIL_CONFIG.host.trim() === '') {
      errors.push('EMAIL_HOST is not set or is empty');
    }
    
    // Check if port is set and valid
    if (!EMAIL_CONFIG.port || isNaN(EMAIL_CONFIG.port) || EMAIL_CONFIG.port <= 0) {
      errors.push('EMAIL_PORT is not set or is invalid');
    }
    
    // Check if user is set and not empty (trim whitespace)
    if (!EMAIL_CONFIG.auth.user || typeof EMAIL_CONFIG.auth.user !== 'string' || EMAIL_CONFIG.auth.user.trim() === '') {
      errors.push('EMAIL_USER is not set or is empty');
    }
    
    // Check if password is set and not empty (trim whitespace)
    if (!EMAIL_CONFIG.auth.pass || typeof EMAIL_CONFIG.auth.pass !== 'string' || EMAIL_CONFIG.auth.pass.trim() === '') {
      errors.push('EMAIL_PASSWORD is not set or is empty');
    }
    
    // Check if admin email is set
    if (!ADMIN_EMAIL || typeof ADMIN_EMAIL !== 'string' || ADMIN_EMAIL.trim() === '') {
      errors.push('ADMIN_EMAIL is not set or is empty');
    }
    
    if (errors.length > 0) {
      console.error('[EmailService] ❌ Email configuration errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      console.error('[EmailService] Please check your .env file and set the required email variables');
      console.error('[EmailService] Current values (masked):');
      console.error(`  - EMAIL_HOST: ${EMAIL_CONFIG.host || 'NOT SET'}`);
      console.error(`  - EMAIL_PORT: ${EMAIL_CONFIG.port || 'NOT SET'}`);
      console.error(`  - EMAIL_USER: ${EMAIL_CONFIG.auth.user ? EMAIL_CONFIG.auth.user.substring(0, 3) + '***' : 'NOT SET'}`);
      console.error(`  - EMAIL_PASSWORD: ${EMAIL_CONFIG.auth.pass ? '***SET***' : 'NOT SET'}`);
      console.error(`  - ADMIN_EMAIL: ${ADMIN_EMAIL || 'NOT SET'}`);
      
      // Don't throw error, just mark as invalid
      this.isConfigValid = false;
      return false;
    }
    
    // Trim whitespace from credentials
    EMAIL_CONFIG.auth.user = EMAIL_CONFIG.auth.user.trim();
    EMAIL_CONFIG.auth.pass = EMAIL_CONFIG.auth.pass.trim();
    
    console.log('[EmailService] ✅ Email configuration validated');
    this.isConfigValid = true;
    return true;
  }
  
  /**
   * Check if email service is properly configured
   */
  isConfigured() {
    return this.isConfigValid === true;
  }

  /**
   * Generate HTML email template for booking confirmation (Admin)
   * Minimal theme: Black buttons, white text, clean layout
   */
  generateBookingEmailHTML(bookingData) {
    const {
      customerName,
      customerEmail,
      customerPhone,
      stadiumName,
      date,
      ticketName,
      zoneName,
      quantity,
      totalPrice,
      referenceNo,
      orderNo
    } = bookingData;

    // Generate success page URL for admin to view customer's booking
    const frontendUrl = process.env.FRONTEND_URL || 'https://dsmuaythaiticket.com';
    const successPageUrl = `${frontendUrl}/success?ref=${referenceNo}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking - DS Muay Thai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      color: #0f172a;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      width: 100%;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: #ffffff;
      padding: 56px 32px 48px;
      text-align: center;
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    }
    
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }
    
    .header p {
      font-size: 14px;
      font-weight: 600;
      opacity: 0.9;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    
    .content {
      padding: 48px 32px;
    }
    
    .order-card {
      background: #f8fafc;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 36px;
      border: 1px solid #e2e8f0;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #cbd5e1;
    }
    
    .card-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
    }
    
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .order-grid {
      display: grid;
      gap: 16px;
    }
    
    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .order-item:last-child {
      border-bottom: none;
    }
    
    .item-label {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }
    
    .item-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'Courier New', monospace;
    }
    
    .section {
      margin-bottom: 36px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .section-icon {
      width: 32px;
      height: 32px;
      background: #f1f5f9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0ea5e9;
      font-weight: bold;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .info-grid {
      display: grid;
      gap: 18px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 14px 0;
    }
    
    .info-label {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      flex: 0 0 120px;
    }
    
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
    
    .price-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 36px;
      margin: 36px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .price-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
      transform: rotate(30deg);
    }
    
    .price-label {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 16px;
    }
    
    .price-value {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    
    .alert-card {
      background: #fffbeb;
      border: 1px solid #fee9ae;
      border-radius: 12px;
      padding: 24px;
      margin: 36px 0;
      display: flex;
      gap: 16px;
    }
    
    .alert-icon {
      font-size: 24px;
      color: #d97706;
      margin-top: 2px;
    }
    
    .alert-text {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      line-height: 1.6;
    }
    
    .action-button {
      display: block;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: #ffffff;
      padding: 18px 48px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      border: none;
      width: 100%;
      max-width: 320px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 12px;
      margin: 0 auto;
      box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
      transition: all 0.3s ease;
    }
    
    .action-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(14, 165, 233, 0.4);
    }
    
    .button-container {
      text-align: center;
      margin: 40px 0 0 0;
    }
    
    .footer {
      background: #f8fafc;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #0ea5e9;
      margin-bottom: 8px;
    }
    
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0;
    }
    
    @media (max-width: 600px) {
      .header {
        padding: 48px 24px 40px;
      }
      
      .header h1 {
        font-size: 28px;
      }
      
      .content {
        padding: 40px 24px;
      }
      
      .order-card,
      .price-card {
        padding: 24px;
      }
      
      .price-value {
        font-size: 36px;
      }
      
      .info-label {
        flex: 0 0 100px;
        font-size: 13px;
      }
      
      .info-value {
        font-size: 13px;
      }
      
      .action-button {
        padding: 16px 32px;
        font-size: 14px;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>New Booking Received</h1>
      <p>DS Muay Thai Stadium</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Order Reference -->
      <div class="order-card">
        <div class="card-header">
          <div class="card-icon">#</div>
          <div class="card-title">Order Information</div>
        </div>
        <div class="order-grid">
          <div class="order-item">
            <span class="item-label">Order Number</span>
            <span class="item-value">${orderNo || referenceNo || 'N/A'}</span>
          </div>
          <div class="order-item">
            <span class="item-label">Booking Reference</span>
            <span class="item-value">${referenceNo || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Event Details -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🎫</div>
          <div class="section-title">Event Details</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Stadium</span>
            <span class="info-value">${stadiumName || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date</span>
            <span class="info-value">${date || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Zone / Ticket</span>
            <span class="info-value">${ticketName || zoneName || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Quantity</span>
            <span class="info-value">${quantity || 1} ticket${quantity > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <!-- Total Price -->
      <div class="price-card">
        <div class="price-label">Total Amount</div>
        <div class="price-value">฿${typeof totalPrice === 'number' ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice || '0.00'}</div>
      </div>

      <!-- Customer Information -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <div class="section-title">Customer Information</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name</span>
            <span class="info-value">${customerName || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">${customerEmail || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone</span>
            <span class="info-value">${customerPhone || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Alert -->
      <div class="alert-card">
        <span class="alert-icon">⚠️</span>
        <p class="alert-text">Please verify the payment and prepare the ticket for the customer.</p>
      </div>

      <!-- Action Button -->
      <div class="button-container">
        <a href="${successPageUrl}" class="action-button">View Full Details</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-brand">DS Muay Thai</p>
      <p class="footer-text">Powered By Devkao & Max</p>
    </div>
  </div>
</body>
</html>


    `;
  }

  /**
   * Generate HTML email template for customer confirmation
   * Minimal theme: Black buttons, white text, clean layout
   */
  generateCustomerConfirmationHTML(bookingData) {
    // Extract and validate customer data with fallbacks
    const customerName = bookingData.customerName || bookingData.name || 'N/A';
    const customerEmail = bookingData.customerEmail || bookingData.email || 'N/A';
    const customerPhone = bookingData.customerPhone || bookingData.phone || 'N/A';
    const stadiumName = bookingData.stadiumName || bookingData.stadium || 'N/A';
    const date = bookingData.date || bookingData.dateDisplay || 'N/A';
    const ticketName = bookingData.ticketName || bookingData.ticket_name || 'N/A';
    const zoneName = bookingData.zoneName || bookingData.zone_name || bookingData.zone || 'N/A';
    const quantity = bookingData.quantity || 1;
    const totalPrice = bookingData.totalPrice || bookingData.amount || 0;
    const referenceNo = bookingData.referenceNo || bookingData.reference_no || 'N/A';
    const orderNo = bookingData.orderNo || bookingData.order_no || 'N/A';
    
    console.log('[EmailService] Generating email HTML with customer data:', {
      customerName,
      customerEmail,
      customerPhone,
      stadiumName,
      ticketName
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://dsmuaythaiticket.com';
    const successPageUrl = `${frontendUrl}/success?ref=${referenceNo}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed - DS Muay Thai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      color: #111827;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    .header {
      background: white;
      color: #111827;
      padding: 56px 32px 48px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .success-icon {
      width: 64px;
      height: 64px;
      background: #dcfce7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: #16a34a;
      font-size: 28px;
      font-weight: bold;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.2px;
      color: #111827;
    }
    
    .header p {
      font-size: 15px;
      font-weight: 500;
      color: #6b7280;
      margin: 0;
    }
    
    .content {
      padding: 48px 32px;
    }
    
    .order-section {
      background: #f9fafb;
      border-radius: 18px;
      padding: 28px;
      margin-bottom: 32px;
      border: 1px solid #f3f4f6;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      gap: 18px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    
    .info-label {
      font-size: 14px;
      font-weight: 600;
      color: #4b5563;
      flex: 0 0 130px;
    }
    
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
    
    .reference-value {
      font-family: 'Courier New', monospace;
      background: white;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      font-weight: 700;
    }
    
    .price-section {
      text-align: center;
      margin: 36px 0;
      padding: 24px;
      background: #f9fafb;
      border-radius: 18px;
      border: 1px solid #f3f4f6;
    }
    
    .price-label {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .price-value {
      font-size: 42px;
      font-weight: 700;
      color: #16a34a;
      letter-spacing: -0.5px;
    }
    
    .action-button {
      display: block;
      background: #16a34a;
      color: white;
      padding: 18px 48px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      border: none;
      width: 100%;
      max-width: 320px;
      border-radius: 12px;
      margin: 0 auto;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
      transition: all 0.2s ease;
    }
    
    .action-button:hover {
      background: #15803d;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(22, 163, 74, 0.35);
    }
    
    .button-container {
      text-align: center;
      margin: 40px 0 0 0;
    }
    
    .footer {
      background: #f9fafb;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #16a34a;
      margin-bottom: 8px;
    }
    
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0;
    }
    
    @media (max-width: 600px) {
      .header {
        padding: 48px 24px 40px;
      }
      
      .header h1 {
        font-size: 28px;
      }
      
      .content {
        padding: 40px 24px;
      }
      
      .order-section,
      .price-section {
        padding: 24px;
      }
      
      .price-value {
        font-size: 36px;
      }
      
      .info-label {
        flex: 0 0 110px;
        font-size: 13px;
      }
      
      .info-value {
        font-size: 13px;
      }
      
      .action-button {
        padding: 16px 32px;
        font-size: 15px;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="success-icon">✓</div>
      <h1>Payment Confirmed</h1>
      <p>Your booking has been successfully processed</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Order Reference -->
      <div class="order-section">
        <div class="section-title">Order Information</div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Order Number</span>
            <span class="info-value reference-value">${orderNo || referenceNo || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Booking Reference</span>
            <span class="info-value reference-value">${referenceNo || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Event Details -->
      <div class="order-section">
        <div class="section-title">Event Details</div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Stadium</span>
            <span class="info-value">${stadiumName || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${date || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Zone / Ticket</span>
            <span class="info-value">${ticketName || zoneName || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quantity</span>
            <span class="info-value">${quantity || 1} ticket${quantity > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <!-- Total Price -->
      <div class="price-section">
        <div class="price-label">Total Amount Paid</div>
        <div class="price-value">฿${typeof totalPrice === 'number' ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice || '0.00'}</div>
      </div>

      <!-- Customer Information -->
      <div class="order-section">
        <div class="section-title">Your Information</div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${customerName || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${customerEmail || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${customerPhone || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="button-container">
        <a href="${successPageUrl}" class="action-button">View Booking Details</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-brand">DS Muay Thai</p>
      <p class="footer-text">Powered By Devkao & Max</p>
    </div>
  </div>
</body>
</html>




    `;
  }

  /**
   * Send booking notification email to admin
   */
  async sendBookingNotification(bookingData) {
    try {
      // Check if email service is configured
      if (!this.isConfigured()) {
        console.error('[EmailService] ❌ Cannot send email: Email configuration is invalid');
        console.error('[EmailService] Please check your .env file and set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and ADMIN_EMAIL');
        throw new Error('Email service is not properly configured. Please check environment variables.');
      }
      
      console.log('[EmailService] 📤 Sending booking notification to admin...');
      console.log('[EmailService] Recipient:', ADMIN_EMAIL);
      console.log('[EmailService] SMTP Host:', EMAIL_CONFIG.host);
      console.log('[EmailService] SMTP Port:', EMAIL_CONFIG.port);

      // Check if transporter is available
      if (!this.transporter) {
        throw new Error('Email transporter is not initialized. Please check email configuration.');
      }

      // Verify connection before sending
      try {
        await this.transporter.verify();
        console.log('[EmailService] ✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('[EmailService] ❌ SMTP connection failed:', verifyError.message);
        console.error('[EmailService] Error code:', verifyError.code);
        if (verifyError.code === 'EAUTH') {
          throw new Error(`SMTP authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file. ${verifyError.message}`);
        }
        throw new Error(`SMTP connection failed: ${verifyError.message}`);
      }

      const mailOptions = {
        from: `"DS Muay Thai Tickets" <${EMAIL_CONFIG.auth.user}>`,
        to: ADMIN_EMAIL,
        subject: `🎫 New Booking - ${bookingData.stadiumName} - ${bookingData.customerName}`,
        html: this.generateBookingEmailHTML(bookingData)
      };

      console.log('[EmailService] Sending email...');
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('[EmailService] ✅ Email sent successfully!');
      console.log('[EmailService] Message ID:', info.messageId);
      console.log('[EmailService] Response:', info.response);
      
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('[EmailService] ❌ Error sending admin email:');
      console.error('[EmailService] Error code:', error.code);
      console.error('[EmailService] Error message:', error.message);
      console.error('[EmailService] Full error:', error);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        throw new Error(`Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD in .env file. ${error.message}`);
      } else if (error.code === 'ECONNECTION') {
        throw new Error(`Connection failed. Check EMAIL_HOST and EMAIL_PORT in .env file. ${error.message}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Connection timeout. Check network and firewall settings. ${error.message}`);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send confirmation email to customer
   */
  async sendCustomerConfirmation(bookingData) {
    try {
      // Check if email service is configured
      if (!this.isConfigured()) {
        console.error('[EmailService] ❌ Cannot send email: Email configuration is invalid');
        console.error('[EmailService] Please check your .env file and set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and ADMIN_EMAIL');
        throw new Error('Email service is not properly configured. Please check environment variables.');
      }
      
      console.log('[EmailService] 📤 Sending confirmation email to customer...');
      console.log('[EmailService] Recipient:', bookingData.customerEmail);
      console.log('[EmailService] Customer data:', {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone
      });

      // Validate customer email
      if (!bookingData.customerEmail || bookingData.customerEmail === 'N/A' || bookingData.customerEmail.trim() === '') {
        console.error('[EmailService] ❌ Invalid customer email:', bookingData.customerEmail);
        throw new Error('Invalid customer email address');
      }

      // Check if transporter is available
      if (!this.transporter) {
        throw new Error('Email transporter is not initialized. Please check email configuration.');
      }

      // Verify connection before sending
      try {
        await this.transporter.verify();
        console.log('[EmailService] ✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('[EmailService] ❌ SMTP connection failed:', verifyError.message);
        console.error('[EmailService] Error code:', verifyError.code);
        if (verifyError.code === 'EAUTH') {
          throw new Error(`SMTP authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file. ${verifyError.message}`);
        }
        throw new Error(`SMTP connection failed: ${verifyError.message}`);
      }

      const mailOptions = {
        from: `"DS Muay Thai Tickets" <${EMAIL_CONFIG.auth.user}>`,
        to: bookingData.customerEmail,
        subject: `✅ Payment Confirmed - Booking Reference: ${bookingData.referenceNo}`,
        html: this.generateCustomerConfirmationHTML(bookingData)
      };

      console.log('[EmailService] Sending email...');
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('[EmailService] ✅ Customer email sent successfully!');
      console.log('[EmailService] Message ID:', info.messageId);
      console.log('[EmailService] Response:', info.response);
      
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('[EmailService] ❌ Error sending customer email:');
      console.error('[EmailService] Error code:', error.code);
      console.error('[EmailService] Error message:', error.message);
      console.error('[EmailService] Full error:', error);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        throw new Error(`Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD in .env file. ${error.message}`);
      } else if (error.code === 'ECONNECTION') {
        throw new Error(`Connection failed. Check EMAIL_HOST and EMAIL_PORT in .env file. ${error.message}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Connection timeout. Check network and firewall settings. ${error.message}`);
      }
      
      throw new Error(`Failed to send customer email: ${error.message}`);
    }
  }

  /**
   * Generate HTML email template for email verification
   * Minimal theme: Black buttons, white text, clean layout
   */
  generateVerificationEmailHTML(verificationData) {
    const {
      customerName,
      customerEmail,
      verificationUrl,
      expiresInMinutes = 30
    } = verificationData;

    const frontendUrl = process.env.FRONTEND_URL || 'https://dsmuaythaiticket.com';

    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันอีเมล - DS Muay Thai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #000000;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      width: 100%;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    
    .header {
      background: #000000;
      color: #ffffff;
      padding: 48px 32px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    
    .header p {
      font-size: 14px;
      font-weight: 500;
      color: #cccccc;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    
    .content {
      padding: 48px 32px;
    }
    
    .message-section {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .message-section p {
      font-size: 18px;
      color: #000000;
      margin-bottom: 28px;
      font-weight: 600;
      line-height: 1.7;
    }
    
    .message-section p strong {
      color: #000000;
      font-weight: 700;
    }
    
    .verify-button {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 20px 48px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      border: none;
      width: 100%;
      max-width: 320px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    }
    
    .verify-button:hover {
      background: #1a1a1a;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .url-section {
      margin-top: 32px;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #000000;
    }
    
    .url-label {
      font-size: 13px;
      font-weight: 600;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .url-text {
      font-size: 14px;
      color: #000000;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      line-height: 1.5;
    }
    
    .warning {
      background: #fff8e1;
      border: 1px solid #ffecb3;
      border-radius: 8px;
      padding: 24px;
      margin-top: 32px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    
    .warning-icon {
      font-size: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .warning-text {
      font-size: 14px;
      font-weight: 600;
      color: #856404;
      line-height: 1.6;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    
    .footer p {
      font-size: 12px;
      color: #6c757d;
      margin: 4px 0;
    }
    
    .footer-brand {
      font-size: 15px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 8px;
    }
    
    @media (max-width: 600px) {
      .header {
        padding: 40px 24px;
      }
      
      .header h1 {
        font-size: 28px;
      }
      
      .content {
        padding: 40px 24px;
      }
      
      .message-section p {
        font-size: 16px;
        margin-bottom: 24px;
      }
      
      .verify-button {
        padding: 18px 32px;
        font-size: 15px;
        width: 100%;
      }
      
      .url-section {
        padding: 20px;
      }
      
      .url-text {
        font-size: 13px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ยืนยันอีเมล</h1>
      <p>DS Muay Thai Stadium</p>
    </div>

    <div class="content">
      <div class="message-section">
        <p>สวัสดี <strong>${customerName || 'คุณ'}</strong></p>
        <p>กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ</p>
        <a href="${verificationUrl}" class="verify-button">ยืนยันอีเมล</a>
        
        <div class="url-section">
          <div class="url-label">หรือคัดลอกลิงก์นี้</div>
          <div class="url-text">${verificationUrl}</div>
        </div>
      </div>

      <div class="warning">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">ลิงก์นี้จะหมดอายุใน ${expiresInMinutes} นาที กรุณายืนยันอีเมลโดยเร็ว</span>
      </div>
    </div>

    <div class="footer">
      <p class="footer-brand">DS Muay Thai</p>
      <p>Powered By Devkao & Max</p>
    </div>
  </div>
</body>
</html>






    `;
  }

  /**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} token - JWT token
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} Result with success and messageId
   */
  async sendVerificationEmail(email, token, bookingData) {
    try {
      // Check if email service is configured
      if (!this.isConfigured()) {
        console.error('[EmailService] ❌ Cannot send email: Email configuration is invalid');
        throw new Error('Email service is not properly configured. Please check environment variables.');
      }

      console.log('[EmailService] 📤 Sending verification email to:', email);
      console.log('[EmailService] Customer name:', bookingData.name);

      // Validate email
      if (!email || email === 'N/A' || email.trim() === '') {
        console.error('[EmailService] ❌ Invalid email:', email);
        throw new Error('Invalid email address');
      }

      // Check if transporter is available
      if (!this.transporter) {
        throw new Error('Email transporter is not initialized. Please check email configuration.');
      }

      // Verify connection before sending
      try {
        await this.transporter.verify();
        console.log('[EmailService] ✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('[EmailService] ❌ SMTP connection failed:', verifyError.message);
        if (verifyError.code === 'EAUTH') {
          throw new Error(`SMTP authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file. ${verifyError.message}`);
        }
        throw new Error(`SMTP connection failed: ${verifyError.message}`);
      }

      // Generate verification URL
      const frontendUrl = process.env.FRONTEND_URL || 'https://dsmuaythaiticket.com';
      const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

      // Generate email HTML
      const html = this.generateVerificationEmailHTML({
        customerName: bookingData.name,
        customerEmail: email,
        verificationUrl: verificationUrl,
        expiresInMinutes: 30
      });

      const mailOptions = {
        from: `"DS Muay Thai Tickets" <${EMAIL_CONFIG.auth.user}>`,
        to: email,
        subject: `🔐 ยืนยันอีเมล - DS Muay Thai Tickets`,
        html: html
      };

      console.log('[EmailService] Sending verification email...');
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('[EmailService] ✅ Verification email sent successfully!');
      console.log('[EmailService] Message ID:', info.messageId);
      console.log('[EmailService] Recipient:', email);
      
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('[EmailService] ❌ Error sending verification email:');
      console.error('[EmailService] Error code:', error.code);
      console.error('[EmailService] Error message:', error.message);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        throw new Error(`Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD in .env file. ${error.message}`);
      } else if (error.code === 'ECONNECTION') {
        throw new Error(`Connection failed. Check EMAIL_HOST and EMAIL_PORT in .env file. ${error.message}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Connection timeout. Check network and firewall settings. ${error.message}`);
      }
      
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      if (!this.isConfigured() || !this.transporter) {
        console.error('[EmailService] Email service is not configured');
        return false;
      }
      
      await this.transporter.verify();
      console.log('[EmailService] Email server connection verified ✓');
      return true;
    } catch (error) {
      console.error('[EmailService] Email server connection failed:', error);
      console.error('[EmailService] Error code:', error.code);
      if (error.code === 'EAUTH') {
        console.error('[EmailService] Authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file');
      }
      return false;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;

