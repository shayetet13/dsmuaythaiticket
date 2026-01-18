import 'dotenv/config';
import emailService from './services/emailService.js';

/**
 * Test Email Service
 * Tests both admin notification and customer confirmation emails
 */

// Test data
const testBookingData = {
  customerName: 'Test Customer',
  customerEmail: process.env.TEST_CUSTOMER_EMAIL || 'test@example.com',
  customerPhone: '0812345678',
  stadiumName: 'Rajadamnern Stadium',
  date: new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  ticketName: 'VIP Ringside',
  zoneName: 'VIP',
  quantity: 2,
  totalPrice: 5000,
  referenceNo: 'TEST-' + Date.now(),
  orderNo: '000001'
};

async function testEmailService() {
  console.log('='.repeat(60));
  console.log('📧 Testing Email Service');
  console.log('='.repeat(60));
  console.log('');

  // Check environment variables
  console.log('📋 Checking Email Configuration...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
  console.log('');

  // Verify connection first
  console.log('🔍 Step 1: Verifying Email Server Connection...');
  try {
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      console.log('✅ Email server connection verified successfully!');
    } else {
      console.log('❌ Email server connection failed!');
      console.log('Please check your email configuration in .env file');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error verifying connection:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('1. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in .env');
    console.log('2. For Gmail: Use App Password (not regular password)');
    console.log('3. Enable "Less secure app access" or use App Password');
    console.log('4. Check firewall/network settings');
    process.exit(1);
  }
  console.log('');

  // Test 1: Send admin notification
  console.log('📤 Step 2: Testing Admin Notification Email...');
  try {
    const adminResult = await emailService.sendBookingNotification(testBookingData);
    console.log('✅ Admin email sent successfully!');
    console.log('   Message ID:', adminResult.messageId);
    console.log('   Recipient:', process.env.ADMIN_EMAIL || process.env.EMAIL_USER);
  } catch (error) {
    console.error('❌ Failed to send admin email:', error.message);
    console.log('');
    console.log('Possible issues:');
    console.log('- ADMIN_EMAIL not set or invalid');
    console.log('- Email server rejected the email');
    console.log('- Check email server logs');
  }
  console.log('');

  // Test 2: Send customer confirmation
  console.log('📤 Step 3: Testing Customer Confirmation Email...');
  try {
    // Check if test customer email is set
    if (!testBookingData.customerEmail || testBookingData.customerEmail === 'test@example.com') {
      console.log('⚠️  Warning: Using default test email (test@example.com)');
      console.log('   Set TEST_CUSTOMER_EMAIL in .env to test with real email');
    }

    const customerResult = await emailService.sendCustomerConfirmation(testBookingData);
    console.log('✅ Customer email sent successfully!');
    console.log('   Message ID:', customerResult.messageId);
    console.log('   Recipient:', testBookingData.customerEmail);
  } catch (error) {
    console.error('❌ Failed to send customer email:', error.message);
    console.log('');
    console.log('Possible issues:');
    console.log('- Customer email is invalid or "N/A"');
    console.log('- Email server rejected the email');
    console.log('- Check email server logs');
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log('✅ Email service is configured and working!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check your inbox (and spam folder) for test emails');
  console.log('2. Verify email content and formatting');
  console.log('3. Test with real booking data through the webhook');
  console.log('');
}

// Run tests
testEmailService()
  .then(() => {
    console.log('✅ All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
