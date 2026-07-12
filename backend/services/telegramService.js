/**
 * Telegram Bot Service - ส่งการแจ้งเตือนการซื้อตั๋วมวยไปยัง Telegram
 * รองรับทั้งการชำระเงินผ่าน QR Code (Pay Solutions) และ Credit Card (Stripe)
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dsmuaythaiticket.com';

class TelegramService {
  constructor() {
    this.isConfigured = !!(TELEGRAM_BOT_TOKEN?.trim() && TELEGRAM_CHAT_ID?.trim());
    if (!this.isConfigured) {
      console.warn('[TelegramService] ⚠️ Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
    } else {
      console.log('[TelegramService] ✅ Initialized - notifications will be sent to Telegram');
    }
  }

  /**
   * Check if Telegram service is properly configured
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Escape HTML special chars for Telegram
   */
  escapeHtml(text) {
    if (text == null || text === '') return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Format booking data for Telegram message (QR Code payment)
   */
  formatQRCodeMessage(bookingData) {
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

    const successPageUrl = `${FRONTEND_URL}/success?ref=${referenceNo}`;
    const priceStr = typeof totalPrice === 'number'
      ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : totalPrice || '0.00';

    return `🎫 <b>ชำระเงินสำเร็จ (QR Code)</b>
━━━━━━━━━━━━━━━━━━━━
📋 <b>Order Information</b>
• Order: <code>${this.escapeHtml(orderNo || referenceNo || 'N/A')}</code>
• Reference: <code>${this.escapeHtml(referenceNo || 'N/A')}</code>

🎫 <b>Event Details</b>
• สนาม: ${this.escapeHtml(stadiumName || 'N/A')}
• วันที่: ${this.escapeHtml(date || 'N/A')}
• โซน/ตั๋ว: ${this.escapeHtml(ticketName || zoneName || 'N/A')}
• จำนวน: ${quantity || 1} ตั๋ว

💰 <b>ยอดชำระ:</b> ฿${priceStr}

👤 <b>Customer</b>
• ชื่อ: ${this.escapeHtml(customerName || 'N/A')}
• อีเมล: ${this.escapeHtml(customerEmail || 'N/A')}
• โทร: ${this.escapeHtml(customerPhone || 'N/A')}

🔗 <a href="${successPageUrl}">ดูรายละเอียด</a>`;
  }

  /**
   * Format booking data for Telegram message (Credit Card payment)
   */
  formatCreditCardMessage(bookingData, stripeInfo = {}) {
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

    const successPageUrl = `${FRONTEND_URL}/success?ref=${referenceNo}`;
    const priceStr = typeof totalPrice === 'number'
      ? totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : totalPrice || '0.00';

    return `💳 <b>ชำระเงินสำเร็จ (Credit Card)</b>
━━━━━━━━━━━━━━━━━━━━
📋 <b>Order Information</b>
• Order: <code>${this.escapeHtml(orderNo || referenceNo || 'N/A')}</code>
• Reference: <code>${this.escapeHtml(referenceNo || 'N/A')}</code>

🎫 <b>Event Details</b>
• สนาม: ${this.escapeHtml(stadiumName || 'N/A')}
• วันที่: ${this.escapeHtml(date || 'N/A')}
• โซน/ตั๋ว: ${this.escapeHtml(ticketName || zoneName || 'N/A')}
• จำนวน: ${quantity || 1} ตั๋ว

💰 <b>ยอดชำระ:</b> ฿${priceStr} (บัตรเครดิต)

👤 <b>Customer</b>
• ชื่อ: ${this.escapeHtml(customerName || 'N/A')}
• อีเมล: ${this.escapeHtml(customerEmail || 'N/A')}
• โทร: ${this.escapeHtml(customerPhone || 'N/A')}

✓ ยืนยันโดย Stripe

🔗 <a href="${successPageUrl}">ดูรายละเอียด</a>`;
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(text) {
    if (!this.isReady()) {
      console.warn('[TelegramService] Skipped - not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('[TelegramService] API error:', data.description);
        return { success: false, error: data.description };
      }

      console.log('[TelegramService] ✅ Notification sent successfully');
      return { success: true, messageId: data.result?.message_id };
    } catch (error) {
      console.error('[TelegramService] ❌ Failed to send:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification for QR Code payment success
   */
  async sendQRCodePaymentNotification(bookingData) {
    const text = this.formatQRCodeMessage(bookingData);
    return this.sendMessage(text);
  }

  /**
   * Send notification for Credit Card payment success
   */
  async sendCreditCardPaymentNotification(bookingData, stripeInfo = {}) {
    const text = this.formatCreditCardMessage(bookingData, stripeInfo);
    return this.sendMessage(text);
  }
}

const telegramService = new TelegramService();
export default telegramService;
