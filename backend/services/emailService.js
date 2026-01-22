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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: #1e293b;
      line-height: 1.6;
      padding: 40px 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 48px 32px;
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
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #ffffff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header p {
      font-size: 14px;
      font-weight: 500;
      color: #94a3b8;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 8px 20px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 20px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .content {
      padding: 40px 32px;
    }
    
    .order-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .order-number {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .order-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'Courier New', monospace;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .section {
      margin-bottom: 36px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
      display: flex;
      align-items: center;
    }
    
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
      margin-right: 12px;
    }
    
    .info-grid {
      display: grid;
      gap: 18px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 0;
      border-bottom: 1px solid #f8fafc;
    }
    
    .info-item:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      flex: 0 0 120px;
    }
    
    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
    
    .price-box {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      border-radius: 16px;
      padding: 36px;
      text-align: center;
      margin: 36px 0;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
      position: relative;
      overflow: hidden;
    }
    
    .price-box::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      transform: rotate(30deg);
    }
    
    .price-label {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .price-value {
      font-size: 48px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -1px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .reference-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 28px 0;
    }
    
    .reference-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 22px;
      text-align: center;
      transition: transform 0.2s ease;
    }
    
    .reference-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .reference-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .reference-value {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'Courier New', monospace;
    }
    
    .alert-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-left: 4px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 28px 0;
      border: 1px solid #fee9ae;
    }
    
    .alert-box p {
      font-size: 14px;
      font-weight: 500;
      color: #92400e;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .alert-box p::before {
      content: '⚠️';
      font-size: 16px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 16px 40px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
      border: none;
      cursor: pointer;
      width: 100%;
      max-width: 300px;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
    
    .button-center {
      text-align: center;
      margin: 40px 0 0 0;
    }
    
    .footer {
      background: #f8fafc;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 12px;
      color: #64748b;
      margin: 6px 0;
    }
    
    .footer-brand {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    @media (max-width: 600px) {
      body {
        padding: 20px 12px;
      }
      
      .header {
        padding: 36px 24px;
      }
      
      .header h1 {
        font-size: 26px;
      }
      
      .content {
        padding: 32px 24px;
      }
      
      .order-info {
        padding: 24px;
      }
      
      .price-box {
        padding: 28px;
      }
      
      .price-value {
        font-size: 36px;
      }
      
      .reference-box {
        grid-template-columns: 1fr;
      }
      
      .info-label {
        flex: 0 0 100px;
        font-size: 13px;
      }
      
      .info-value {
        font-size: 13px;
      }
      
      .button {
        padding: 18px;
        font-size: 14px;
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
      <span class="badge">Verified</span>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Order Reference -->
      <div class="order-info">
        <div class="order-header">
          <div>
            <div class="order-number">Order Number</div>
            <div class="order-value">${orderNo || referenceNo || 'N/A'}</div>
          </div>
          <div>
            <div class="order-number">Booking Reference</div>
            <div class="order-value">${referenceNo || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Booking Details -->
      <div class="section">
        <div class="section-title">Event Details</div>
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
      <div class="price-box">
        <div class="price-label">Total Amount</div>
        <div class="price-value">฿${typeof totalPrice === 'number' ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice || '0.00'}</div>
      </div>

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">Customer Information</div>
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
      <div class="alert-box">
        <p>Please verify the payment and prepare the ticket for the customer.</p>
      </div>

      <!-- Action Button -->
      <div class="button-center">
        <a href="${successPageUrl}" class="button">View Full Details →</a>
      </div>
    </div>

    <!-- Footer -->
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
   * Generate HTML email template for customer confirmation
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
  <title>New Booking - DS Muay Thai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: #1e293b;
      line-height: 1.6;
      padding: 40px 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 48px 32px;
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
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #ffffff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header p {
      font-size: 14px;
      font-weight: 500;
      color: #94a3b8;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 8px 20px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 20px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .content {
      padding: 40px 32px;
    }
    
    .order-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .order-number {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .order-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'Courier New', monospace;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .section {
      margin-bottom: 36px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
      display: flex;
      align-items: center;
    }
    
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
      margin-right: 12px;
    }
    
    .info-grid {
      display: grid;
      gap: 18px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 0;
      border-bottom: 1px solid #f8fafc;
    }
    
    .info-item:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      flex: 0 0 120px;
    }
    
    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
    
    .price-box {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      border-radius: 16px;
      padding: 36px;
      text-align: center;
      margin: 36px 0;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
      position: relative;
      overflow: hidden;
    }
    
    .price-box::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      transform: rotate(30deg);
    }
    
    .price-label {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .price-value {
      font-size: 48px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -1px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .reference-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 28px 0;
    }
    
    .reference-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 22px;
      text-align: center;
      transition: transform 0.2s ease;
    }
    
    .reference-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .reference-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .reference-value {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'Courier New', monospace;
    }
    
    .alert-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-left: 4px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 28px 0;
      border: 1px solid #fee9ae;
    }
    
    .alert-box p {
      font-size: 14px;
      font-weight: 500;
      color: #92400e;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .alert-box p::before {
      content: '⚠️';
      font-size: 16px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 16px 40px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
      border: none;
      cursor: pointer;
      width: 100%;
      max-width: 300px;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
    
    .button-center {
      text-align: center;
      margin: 40px 0 0 0;
    }
    
    .footer {
      background: #f8fafc;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 12px;
      color: #64748b;
      margin: 6px 0;
    }
    
    .footer-brand {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    @media (max-width: 600px) {
      body {
        padding: 20px 12px;
      }
      
      .header {
        padding: 36px 24px;
      }
      
      .header h1 {
        font-size: 26px;
      }
      
      .content {
        padding: 32px 24px;
      }
      
      .order-info {
        padding: 24px;
      }
      
      .price-box {
        padding: 28px;
      }
      
      .price-value {
        font-size: 36px;
      }
      
      .reference-box {
        grid-template-columns: 1fr;
      }
      
      .info-label {
        flex: 0 0 100px;
        font-size: 13px;
      }
      
      .info-value {
        font-size: 13px;
      }
      
      .button {
        padding: 18px;
        font-size: 14px;
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
      <span class="badge">Verified</span>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Order Reference -->
      <div class="order-info">
        <div class="order-header">
          <div>
            <div class="order-number">Order Number</div>
            <div class="order-value">${orderNo || referenceNo || 'N/A'}</div>
          </div>
          <div>
            <div class="order-number">Booking Reference</div>
            <div class="order-value">${referenceNo || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Booking Details -->
      <div class="section">
        <div class="section-title">Event Details</div>
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
      <div class="price-box">
        <div class="price-label">Total Amount</div>
        <div class="price-value">฿${typeof totalPrice === 'number' ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice || '0.00'}</div>
      </div>

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">Customer Information</div>
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
      <div class="alert-box">
        <p>Please verify the payment and prepare the ticket for the customer.</p>
      </div>

      <!-- Action Button -->
      <div class="button-center">
        <a href="${successPageUrl}" class="button">View Full Details →</a>
      </div>
    </div>

    <!-- Footer -->
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันอีเมล - DS Muay Thai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Sarabun', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: #1e293b;
      line-height: 1.6;
      padding: 24px 16px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1),
                  0 0 0 1px #e2e8f0;
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 48px 32px 40px;
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
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
    }
    
    .header h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 48px;
      font-weight: 400;
      margin: 0;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .header p {
      margin-top: 8px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #bfdbfe;
    }
    
    .content {
      padding: 40px 32px;
    }
    
    .message {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    
    .message p {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .message p strong {
      color: #1e40af;
      font-weight: 800;
    }
    
    .verify-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 18px 48px;
      border-radius: 12px;
      text-decoration: none;
      font-family: 'Bebas Neue', sans-serif;
      font-weight: 400;
      font-size: 20px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 24px 0;
      box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3),
                  0 4px 6px rgba(0, 0, 0, 0.05);
      border: none;
      transition: all 0.3s ease;
    }
    
    .verify-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(30, 64, 175, 0.4);
    }
    
    .url-text {
      font-size: 14px;
      color: #64748b;
      margin-top: 20px;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 8px;
      border-left: 3px solid #3b82f6;
    }
    
    .url-text span {
      word-break: break-all;
      color: #1e40af;
      font-weight: 600;
      display: block;
      margin-top: 8px;
    }
    
    .warning {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fee9ae;
      border-left: 4px solid #f59e0b;
      border-radius: 12px;
      padding: 24px;
      color: #92400e;
      font-weight: 600;
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .warning-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    
    .footer {
      background: #f8fafc;
      padding: 32px 24px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-brand {
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    @media (max-width: 600px) {
      .header h1 {
        font-size: 36px;
        letter-spacing: 2px;
      }
      
      .content {
        padding: 28px 20px;
      }
      
      .message {
        padding: 24px;
      }
      
      .verify-button {
        padding: 16px 32px;
        font-size: 18px;
        width: 100%;
      }
      
      .url-text {
        padding: 12px;
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
      <div class="message">
        <p>สวัสดี <strong>${customerName || 'คุณ'}</strong></p>
        <p>กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ</p>
        <a href="${verificationUrl}" class="verify-button">ยืนยันอีเมล</a>
        <div class="url-text">
          หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
          <span>${verificationUrl}</span>
        </div>
      </div>

      <div class="warning">
        <span class="warning-icon">⚠️</span>
        <span>ลิงก์นี้จะหมดอายุใน ${expiresInMinutes} นาที กรุณายืนยันอีเมลโดยเร็ว</span>
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

