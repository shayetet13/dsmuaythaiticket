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
    // Validate email configuration before creating transporter
    this.validateConfig();
    
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
  }

  /**
   * Validate email configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!EMAIL_CONFIG.host) {
      errors.push('EMAIL_HOST is not set');
    }
    
    if (!EMAIL_CONFIG.port) {
      errors.push('EMAIL_PORT is not set');
    }
    
    if (!EMAIL_CONFIG.auth.user) {
      errors.push('EMAIL_USER is not set');
    }
    
    if (!EMAIL_CONFIG.auth.pass) {
      errors.push('EMAIL_PASSWORD is not set');
    }
    
    if (!ADMIN_EMAIL) {
      errors.push('ADMIN_EMAIL is not set');
    }
    
    if (errors.length > 0) {
      console.error('[EmailService] ❌ Email configuration errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      console.error('[EmailService] Please check your .env file and set the required email variables');
      throw new Error(`Email configuration incomplete: ${errors.join(', ')}`);
    }
    
    console.log('[EmailService] ✅ Email configuration validated');
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
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
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
      background: #3b82f6;
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    .header p {
      margin-top: 8px;
      opacity: 0.9;
      font-size: 16px;
    }
    
    .content {
      padding: 32px 24px;
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
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    
    .price-label {
      font-size: 14px;
      color: #0369a1;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .price-value {
      font-size: 32px;
      font-weight: 700;
      color: #0284c7;
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
    
    .alert {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 16px;
      padding: 20px;
      color: #92400e;
      font-weight: 600;
      margin-top: 28px;
      display: flex;
      gap: 12px;
    }
    
    .alert-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .success-button {
      display: inline-block;
      background: #3b82f6;
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
      background: #2563eb;
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
      .container {
        border-radius: 16px;
      }
      
      .header {
        padding: 24px 16px;
      }
      
      .content {
        padding: 24px 16px;
      }
      
      .info-label {
        flex: 0 0 120px;
        font-size: 15px;
      }
      
      .info-value {
        font-size: 15px;
      }
      
      .price-value {
        font-size: 28px;
      }
      
      .reference-section {
        flex-direction: column;
        gap: 12px;
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
      <h1>Booking Confirmed</h1>
      <p>DS Muay Thai Tickets</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Booking Summary -->
      <div class="section">
        <div class="section-title">📋 Booking Details</div>
        <div class="info-item">
          <span class="info-label">Stadium</span>
          <span class="info-value">${stadiumName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date</span>
          <span class="info-value">${date || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ticket Type</span>
          <span class="info-value">${ticketName || zoneName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Quantity</span>
          <span class="info-value">${quantity || 1} ticket${quantity > 1 ? 's' : ''}</span>
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

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <div class="info-item">
          <span class="info-label">Full Name</span>
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
        <a href="${successPageUrl}" class="success-button">View Customer Booking Details</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>DS Muay Thai Tickets</p>
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
<html lang="th">
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
      console.log('[EmailService] 📤 Sending booking notification to admin...');
      console.log('[EmailService] Recipient:', ADMIN_EMAIL);
      console.log('[EmailService] SMTP Host:', EMAIL_CONFIG.host);
      console.log('[EmailService] SMTP Port:', EMAIL_CONFIG.port);

      // Verify connection before sending
      try {
        await this.transporter.verify();
        console.log('[EmailService] ✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('[EmailService] ❌ SMTP connection failed:', verifyError.message);
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
      console.log('[EmailService] 📤 Sending confirmation email to customer...');
      console.log('[EmailService] Recipient:', bookingData.customerEmail);
      console.log('[EmailService] Customer data:', {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone
      });

      // Validate customer email
      if (!bookingData.customerEmail || bookingData.customerEmail === 'N/A') {
        console.error('[EmailService] ❌ Invalid customer email:', bookingData.customerEmail);
        throw new Error('Invalid customer email address');
      }

      // Verify connection before sending
      try {
        await this.transporter.verify();
        console.log('[EmailService] ✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('[EmailService] ❌ SMTP connection failed:', verifyError.message);
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
      await this.transporter.verify();
      console.log('[EmailService] Email server connection verified ✓');
      return true;
    } catch (error) {
      console.error('[EmailService] Email server connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;

