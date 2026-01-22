# 📧 Email Service Testing Guide

## ภาพรวมระบบส่งอีเมล

ระบบส่งอีเมลมี 2 ประเภท:

1. **Admin Notification Email** - ส่งให้ admin เมื่อมีการจองใหม่
2. **Customer Confirmation Email** - ส่งให้ลูกค้าเมื่อชำระเงินสำเร็จ

## การตั้งค่า Environment Variables

ตรวจสอบไฟล์ `.env` ใน `mticket/backend/` ว่ามีการตั้งค่าดังนี้:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@example.com

# Optional: สำหรับทดสอบ
TEST_CUSTOMER_EMAIL=test@example.com
```

### สำหรับ Gmail:
1. เปิดใช้งาน 2-Step Verification
2. สร้าง App Password ที่: https://myaccount.google.com/apppasswords
3. ใช้ App Password (16 ตัวอักษร) แทนรหัสผ่านปกติ

## วิธีทดสอบ

### วิธีที่ 1: ใช้ Script ทดสอบ (แนะนำ)

```bash
cd mticket/backend
npm run test-email
```

หรือ

```bash
node test-email.js
```

**ผลลัพธ์:**
- ✅ ตรวจสอบการตั้งค่า email
- ✅ ทดสอบการเชื่อมต่อ SMTP server
- ✅ ส่งอีเมลทดสอบให้ admin
- ✅ ส่งอีเมลทดสอบให้ customer

### วิธีที่ 2: ใช้ API Endpoint

**Endpoint:** `POST /api/email/test`

**Headers:**
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "testType": "both",  // "admin", "customer", หรือ "both"
  "customerEmail": "test@example.com"  // optional
}
```

**ตัวอย่างการใช้ curl:**
```bash
curl -X POST http://localhost:5000/api/email/test \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "both",
    "customerEmail": "test@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email test completed successfully",
  "results": {
    "connection": true,
    "adminEmail": {
      "success": true,
      "messageId": "..."
    },
    "customerEmail": {
      "success": true,
      "messageId": "..."
    }
  }
}
```

### วิธีที่ 3: ทดสอบผ่าน Webhook จริง

เมื่อมีการชำระเงินสำเร็จ ระบบจะส่งอีเมลอัตโนมัติ:
1. **Admin Email** - ส่งไปที่ `ADMIN_EMAIL`
2. **Customer Email** - ส่งไปที่อีเมลของลูกค้า

ตรวจสอบ logs ใน console:
```
[Webhook] ✅ Admin email notification sent
[Webhook] ✅ Customer confirmation email sent to: customer@example.com
```

## การตรวจสอบปัญหา

### ปัญหา: Connection Failed

**สาเหตุที่เป็นไปได้:**
- ❌ `EMAIL_HOST`, `EMAIL_PORT` ไม่ถูกต้อง
- ❌ `EMAIL_USER`, `EMAIL_PASSWORD` ไม่ถูกต้อง
- ❌ Firewall/Network block SMTP port
- ❌ Gmail: ไม่ได้ใช้ App Password

**วิธีแก้:**
1. ตรวจสอบ `.env` file
2. สำหรับ Gmail: ใช้ App Password แทนรหัสผ่านปกติ
3. ตรวจสอบ network/firewall settings

### ปัญหา: Admin Email ไม่ส่ง

**สาเหตุที่เป็นไปได้:**
- ❌ `ADMIN_EMAIL` ไม่ได้ตั้งค่า
- ❌ Email server reject recipient

**วิธีแก้:**
1. ตั้งค่า `ADMIN_EMAIL` ใน `.env`
2. ตรวจสอบว่า email address ถูกต้อง

### ปัญหา: Customer Email ไม่ส่ง

**สาเหตุที่เป็นไปได้:**
- ❌ Customer email เป็น "N/A" หรือ invalid
- ❌ Email server reject recipient

**วิธีแก้:**
1. ตรวจสอบว่า customer email ถูกต้อง
2. ตรวจสอบ logs ใน console

## Email Templates

### Admin Notification Email
- **Subject:** `🎫 New Booking - {Stadium} - {Customer Name}`
- **Content:** รายละเอียดการจองทั้งหมด
- **Recipient:** `ADMIN_EMAIL`

### Customer Confirmation Email
- **Subject:** `✅ Payment Confirmed - Booking Reference: {Reference No}`
- **Content:** รายละเอียดการจอง + ลิงก์ไปยัง success page
- **Recipient:** Customer email

## ตรวจสอบ Email ที่ส่งแล้ว

1. **Admin Email:** ตรวจสอบ inbox ของ `ADMIN_EMAIL` (และ spam folder)
2. **Customer Email:** ตรวจสอบ inbox ของ customer (และ spam folder)

## Logs

ตรวจสอบ logs ใน console เพื่อดูสถานะการส่งอีเมล:

```
[EmailService] Sending booking notification to admin...
[EmailService] Recipient: admin@example.com
[EmailService] Email sent successfully!
[EmailService] Message ID: <message-id>
```

## สรุป

✅ **ระบบส่งอีเมลพร้อมใช้งาน** เมื่อ:
- Environment variables ตั้งค่าถูกต้อง
- SMTP connection สำเร็จ
- Admin และ Customer email ส่งได้

❌ **ต้องแก้ไข** เมื่อ:
- Connection failed
- Email ไม่ส่ง
- Email ไปที่ spam folder (ตรวจสอบ SPF/DKIM records)
