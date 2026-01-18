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
   * Generate HTML email template for booking confirmation
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
  <title>Booking Confirmation - DS Muay Thai</title>
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
      background: #0a0a0a;
      color: #ffffff;
      line-height: 1.6;
      padding: 24px 16px;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    
    /* Ring Ropes Background */
    body::before,
    body::after {
      content: '';
      position: fixed;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #dc2626 20%, 
        #dc2626 80%, 
        transparent 100%);
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.6);
      z-index: 0;
    }
    
    body::before {
      top: 60px;
    }
    
    body::after {
      bottom: 60px;
    }
    
    .rope-decoration {
      position: fixed;
      width: 3px;
      height: 100%;
      top: 0;
      background: linear-gradient(180deg, 
        transparent 0%, 
        #dc2626 10%, 
        #dc2626 90%, 
        transparent 100%);
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
      z-index: 0;
    }
    
    .rope-decoration.left {
      left: 40px;
    }
    
    .rope-decoration.right {
      right: 40px;
    }
    
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: 
        linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 20, 20, 0.98) 100%);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.8),
        0 0 0 3px #dc2626,
        0 0 0 6px #1a1a1a,
        0 0 30px rgba(220, 38, 38, 0.4);
      position: relative;
      z-index: 1;
    }
    
    /* Corner Posts */
    .corner-post {
      position: absolute;
      width: 20px;
      height: 20px;
      background: 
        radial-gradient(circle, #dc2626 0%, #991b1b 100%);
      border: 3px solid #1a1a1a;
      border-radius: 50%;
      box-shadow: 
        0 0 20px rgba(220, 38, 38, 0.6),
        inset 0 2px 4px rgba(0, 0, 0, 0.5);
      z-index: 10;
    }
    
    .corner-post.top-left {
      top: -10px;
      left: -10px;
    }
    
    .corner-post.top-right {
      top: -10px;
      right: -10px;
    }
    
    .corner-post.bottom-left {
      bottom: -10px;
      left: -10px;
    }
    
    .corner-post.bottom-right {
      bottom: -10px;
      right: -10px;
    }
    
    .header {
      background: 
        linear-gradient(180deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%),
        linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
      color: white;
      padding: 48px 32px 40px;
      text-align: center;
      position: relative;
      border-bottom: 4px solid #dc2626;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(220, 38, 38, 0.03) 2px,
          rgba(220, 38, 38, 0.03) 4px
        );
      pointer-events: none;
    }
    
    .header::after {
      content: '🥊';
      position: absolute;
      font-size: 200px;
      opacity: 0.03;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      pointer-events: none;
    }
    
    .logo {
      font-size: 64px;
      margin-bottom: 12px;
      filter: drop-shadow(0 4px 12px rgba(220, 38, 38, 0.6));
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .header h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 48px;
      font-weight: 400;
      margin: 0;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 
        0 0 20px rgba(220, 38, 38, 0.8),
        0 4px 8px rgba(0, 0, 0, 0.8);
      position: relative;
    }
    
    .header p {
      margin-top: 8px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #dc2626;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    }
    
    .fight-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      padding: 10px 28px;
      border-radius: 4px;
      margin-top: 20px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      font-weight: 400;
      letter-spacing: 2px;
      box-shadow: 
        0 4px 12px rgba(220, 38, 38, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .fight-badge::before {
      content: '✓';
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      font-size: 14px;
      font-weight: bold;
    }
    
    .content {
      padding: 40px 32px;
      position: relative;
    }
    
    .section {
      margin-bottom: 32px;
      background: rgba(220, 38, 38, 0.05);
      border: 2px solid rgba(220, 38, 38, 0.2);
      border-radius: 4px;
      padding: 28px;
      position: relative;
    }
    
    .section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%);
    }
    
    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 24px;
      font-weight: 400;
      color: #dc2626;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    .section-title::after {
      content: '';
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, 
        rgba(220, 38, 38, 0.5) 0%, 
        transparent 100%);
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid rgba(220, 38, 38, 0.15);
      gap: 16px;
    }
    
    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .info-item:first-child {
      padding-top: 0;
    }
    
    .info-label {
      font-weight: 600;
      color: #999;
      font-size: 15px;
      flex: 0 0 140px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-weight: 700;
      color: #ffffff;
      font-size: 16px;
      flex: 1;
      text-align: right;
    }
    
    .price-section {
      background: 
        linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(153, 27, 27, 0.2) 100%),
        #1a1a1a;
      border: 3px solid #dc2626;
      border-radius: 4px;
      padding: 40px 28px;
      text-align: center;
      margin: 36px 0;
      position: relative;
      overflow: hidden;
      box-shadow: 
        0 8px 24px rgba(220, 38, 38, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .price-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(220, 38, 38, 0.3) 50%, 
        transparent 100%);
      animation: priceShimmer 3s infinite;
    }
    
    @keyframes priceShimmer {
      0% { left: -100%; }
      100% { left: 200%; }
    }
    
    .price-label {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 16px;
      color: #ffffff;
      font-weight: 400;
      margin-bottom: 12px;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .price-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 64px;
      font-weight: 400;
      color: #dc2626;
      letter-spacing: 2px;
      position: relative;
      text-shadow: 
        0 0 30px rgba(220, 38, 38, 0.8),
        0 4px 8px rgba(0, 0, 0, 0.8);
      filter: drop-shadow(0 0 20px rgba(220, 38, 38, 0.6));
    }
    
    .reference-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 32px 0;
    }
    
    .reference-item {
      background: 
        linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
      border: 2px solid rgba(220, 38, 38, 0.3);
      border-radius: 4px;
      padding: 24px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .reference-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, 
        #dc2626 0%, 
        #991b1b 50%, 
        #dc2626 100%);
    }
    
    .reference-label {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 14px;
      color: #dc2626;
      font-weight: 400;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .reference-value {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      letter-spacing: 2px;
    }
    
    .alert {
      background: 
        linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.1) 100%);
      border: 2px solid rgba(234, 179, 8, 0.4);
      border-left: 6px solid #eab308;
      border-radius: 4px;
      padding: 24px;
      color: #ffffff;
      font-weight: 600;
      margin-top: 32px;
      display: flex;
      gap: 16px;
      align-items: start;
    }
    
    .alert-icon {
      font-size: 28px;
      flex-shrink: 0;
      filter: drop-shadow(0 2px 8px rgba(234, 179, 8, 0.6));
    }
    
    .success-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: #ffffff;
      padding: 18px 40px;
      border-radius: 4px;
      text-decoration: none;
      font-family: 'Bebas Neue', sans-serif;
      font-weight: 400;
      font-size: 20px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 32px 0 8px;
      text-align: center;
      box-shadow: 
        0 8px 20px rgba(220, 38, 38, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .success-button:active {
      transform: translateY(2px);
    }
    
    .success-button span {
      position: relative;
      z-index: 1;
    }
    
    .footer {
      background: 
        linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
      padding: 32px 24px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 4px solid #dc2626;
    }
    
    .footer p {
      margin: 6px 0;
      font-weight: 600;
    }
    
    .footer p:first-child {
      font-family: 'Bebas Neue', sans-serif;
      color: #dc2626;
      font-size: 24px;
      font-weight: 400;
      letter-spacing: 3px;
      margin-bottom: 8px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    .divider {
      height: 2px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #dc2626 50%, 
        transparent 100%);
      margin: 36px 0;
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
    }
    
    @media (max-width: 600px) {
      body::before,
      body::after {
        display: none;
      }
      
      .rope-decoration {
        display: none;
      }
      
      body {
        padding: 16px 12px;
      }
      
      .container {
        border-radius: 4px;
      }
      
      .header {
        padding: 36px 24px 32px;
      }
      
      .header h1 {
        font-size: 36px;
        letter-spacing: 2px;
      }
      
      .logo {
        font-size: 48px;
      }
      
      .content {
        padding: 28px 20px;
      }
      
      .section {
        padding: 20px;
      }
      
      .section-title {
        font-size: 20px;
      }
      
      .info-label {
        flex: 0 0 100px;
        font-size: 13px;
      }
      
      .info-value {
        font-size: 14px;
      }
      
      .price-value {
        font-size: 48px;
      }
      
      .reference-section {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .success-button {
        padding: 16px 32px;
        font-size: 18px;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="rope-decoration left"></div>
  <div class="rope-decoration right"></div>
  
  <div class="container">
    <!-- Corner Posts -->
    <div class="corner-post top-left"></div>
    <div class="corner-post top-right"></div>
    <div class="corner-post bottom-left"></div>
    <div class="corner-post bottom-right"></div>
    
    <!-- Header -->
    <div class="header">
      <div class="logo">🥊</div>
      <h1>Confirmed</h1>
      <p>DS Muay Thai Stadium</p>
      <div class="fight-badge">Booking Verified</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Booking Summary -->
      <div class="section">
        <div class="section-title">🏟️ Fight Event</div>
        <div class="info-item">
          <span class="info-label">Stadium</span>
          <span class="info-value">${stadiumName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date</span>
          <span class="info-value">${date || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Seat Zone</span>
          <span class="info-value">${ticketName || zoneName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tickets</span>
          <span class="info-value">${quantity || 1} ticket${quantity > 1 ? 's' : ''}</span>
        </div>
      </div>

      <!-- Total Price -->
      <div class="price-section">
        <div class="price-label">Total Paid</div>
        <div class="price-value">฿${typeof totalPrice === 'number' ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice || '0.00'}</div>
      </div>

      <!-- Reference Numbers -->
      <div class="reference-section">
        <div class="reference-item">
          <div class="reference-label">Booking Ref</div>
          <div class="reference-value">${referenceNo || 'N/A'}</div>
        </div>
        ${orderNo ? `
        <div class="reference-item">
          <div class="reference-label">Order No</div>
          <div class="reference-value">${orderNo}</div>
        </div>
        ` : ''}
      </div>

      <div class="divider"></div>

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">👤 Fighter Info</div>
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

      <!-- Alert -->
      <div class="alert">
        <div class="alert-icon">⚠️</div>
        <div>Please verify the payment and prepare the ticket for the customer.</div>
      </div>

      <!-- Success Page Link -->
      <div style="text-align: center;">
        <a href="${successPageUrl}" class="success-button">
          <span>View Details</span>
          <span>→</span>
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>DS Muay Thai</p>
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
  <title>Payment Confirmed</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      padding: 24px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 24px 20px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      word-wrap: break-word;
    }
    
    .header p {
      margin-top: 8px;
      opacity: 0.95;
      font-size: 14px;
      word-wrap: break-word;
    }
    
    .content {
      padding: 24px 20px;
    }
    
    .section {
      margin-bottom: 28px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .info-item:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 500;
      color: #64748b;
      flex: 0 0 140px;
    }
    
    .info-value {
      font-weight: 500;
      color: #0f172a;
      flex: 1;
      text-align: right;
    }
    
    .price-section {
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    
    .price-label {
      font-size: 14px;
      color: #059669;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .price-value {
      font-size: 28px;
      font-weight: 700;
      color: #047857;
      word-wrap: break-word;
    }
    
    .reference-section {
      display: flex;
      gap: 16px;
      margin: 24px 0;
    }
    
    .reference-item {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    
    .reference-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .reference-value {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      font-family: monospace;
    }
    
    .success-button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
      transition: background 0.3s;
    }
    
    .success-button:hover {
      background: #059669;
    }
    
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      margin: 4px 0;
      font-weight: 600;
    }
    
    @media (max-width: 600px) {
      body {
        padding: 8px;
      }
      
      .container {
        border-radius: 16px;
      }
      
      .header {
        padding: 20px 16px;
      }
      
      .header h1 {
        font-size: 20px;
      }
      
      .header p {
        font-size: 13px;
      }
      
      .content {
        padding: 20px 16px;
      }
      
      .info-label {
        flex: 0 0 100px;
        font-size: 13px;
      }
      
      .info-value {
        font-size: 13px;
      }
      
      .price-value {
        font-size: 24px;
      }
      
      .reference-section {
        flex-direction: column;
      }
      
      .reference-item {
        min-width: 100%;
      }
      
      .success-button {
        padding: 14px 24px;
        font-size: 14px;
        width: 100%;
        display: block;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>✅ Payment Confirmed!</h1>
      <p>Your booking has been successfully processed</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Booking Summary -->
      <div class="section">
        <div class="section-title">📋 Booking Details</div>
        <div class="info-item">
          <span class="info-label">Stadium</span>
          <span class="info-value">${stadiumName && stadiumName !== 'N/A' ? stadiumName : 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date</span>
          <span class="info-value">${date && date !== 'N/A' ? date : 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ticket Type</span>
          <span class="info-value">${(ticketName && ticketName !== 'N/A') ? ticketName : (zoneName && zoneName !== 'N/A' ? zoneName : 'N/A')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Quantity</span>
          <span class="info-value">${quantity || 1} ticket${quantity > 1 ? 's' : ''}</span>
        </div>
      </div>

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <div class="info-item">
          <span class="info-label">Full Name</span>
          <span class="info-value">${customerName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">${customerEmail}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Phone</span>
          <span class="info-value">${customerPhone}</span>
        </div>
      </div>

      <!-- Total Price -->
      <div class="price-section">
        <div class="price-label">Total Amount Paid</div>
        <div class="price-value">฿${typeof totalPrice === 'number' ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice || '0.00'}</div>
      </div>

      <!-- Reference Numbers -->
      <div class="reference-section">
        <div class="reference-item">
          <div class="reference-label">Booking Reference</div>
          <div class="reference-value">${referenceNo || 'N/A'}</div>
        </div>
        ${orderNo ? `
        <div class="reference-item">
          <div class="reference-label">Order Number</div>
          <div class="reference-value">${orderNo}</div>
        </div>
        ` : ''}
      </div>

      <!-- Success Page Link -->
      <div style="text-align: center;">
        <a href="${successPageUrl}" class="success-button">View Booking Details</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>DS Muay Thai Tickets</p>
      <p>Thank you for your booking!</p>
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

