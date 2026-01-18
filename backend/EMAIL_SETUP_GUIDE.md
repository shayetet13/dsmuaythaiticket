# 📧 Email Setup Guide (Non-Gmail)

## ภาพรวม

ระบบส่งอีเมลใช้ Nodemailer และรองรับ SMTP providers หลายตัว ไม่จำกัดเฉพาะ Gmail

## การตั้งค่าใน .env

แก้ไขไฟล์ `.env` ใน `mticket/backend/`:

```env
# Email Configuration
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
ADMIN_EMAIL=admin@yourdomain.com
```

## การตั้งค่าตาม Email Provider

### 1. Outlook / Hotmail / Live.com

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
ADMIN_EMAIL=admin@outlook.com
```

**หมายเหตุ:**
- ใช้พอร์ต 587 (TLS)
- ต้องเปิดใช้งาน "Less secure app access" หรือใช้ App Password

### 2. Yahoo Mail

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yahoo.com
```

**หมายเหตุ:**
- ต้องสร้าง App Password ที่: https://login.yahoo.com/account/security
- ใช้ App Password แทนรหัสผ่านปกติ

### 3. Custom SMTP Server (เช่น cPanel, DirectAdmin)

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
ADMIN_EMAIL=admin@yourdomain.com
```

**หมายเหตุ:**
- ตรวจสอบกับ hosting provider ว่าต้องใช้พอร์ตอะไร
- บาง hosting ใช้พอร์ต 465 (SSL) แทน 587 (TLS)

### 4. SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
ADMIN_EMAIL=admin@yourdomain.com
```

**หมายเหตุ:**
- ใช้ `apikey` เป็น EMAIL_USER
- ใช้ SendGrid API Key เป็น EMAIL_PASSWORD

### 5. Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
ADMIN_EMAIL=admin@yourdomain.com
```

### 6. Amazon SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
ADMIN_EMAIL=admin@yourdomain.com
```

**หมายเหตุ:**
- ใช้ SMTP endpoint ตาม region ของคุณ
- ต้องสร้าง SMTP credentials ใน AWS SES Console

## การตั้งค่า EMAIL_SECURE

- **`false`** (TLS): ใช้กับพอร์ต 587
- **`true`** (SSL): ใช้กับพอร์ต 465

```env
# สำหรับ TLS (พอร์ต 587)
EMAIL_PORT=587
EMAIL_SECURE=false

# สำหรับ SSL (พอร์ต 465)
EMAIL_PORT=465
EMAIL_SECURE=true
```

## การทดสอบการตั้งค่า

### วิธีที่ 1: ใช้ Script ทดสอบ

```bash
cd mticket/backend
npm run test-email
```

### วิธีที่ 2: ใช้ API

```bash
curl -X POST http://localhost:5000/api/email/test \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"testType": "both"}'
```

## ตรวจสอบ Logs

เมื่อรัน server หรือทดสอบ email ตรวจสอบ logs:

### ✅ สำเร็จ
```
[EmailService] ✅ Email configuration validated
[EmailService] ✅ SMTP connection verified
[EmailService] ✅ Email sent successfully!
```

### ❌ มีปัญหา
```
[EmailService] ❌ Email configuration errors:
  - EMAIL_HOST is not set
  - EMAIL_PASSWORD is not set

[EmailService] ❌ SMTP connection failed: ...
[EmailService] Error code: EAUTH
[EmailService] Error message: Invalid login
```

## Error Codes และวิธีแก้ไข

### EAUTH (Authentication Failed)
**สาเหตุ:**
- EMAIL_USER หรือ EMAIL_PASSWORD ไม่ถูกต้อง
- ต้องใช้ App Password แต่ใช้รหัสผ่านปกติ

**วิธีแก้:**
1. ตรวจสอบ EMAIL_USER และ EMAIL_PASSWORD ใน .env
2. สำหรับ Gmail/Yahoo: ใช้ App Password
3. สำหรับ Outlook: เปิดใช้งาน "Less secure app access"

### ECONNECTION (Connection Failed)
**สาเหตุ:**
- EMAIL_HOST หรือ EMAIL_PORT ไม่ถูกต้อง
- Firewall block SMTP port
- Network connection issues

**วิธีแก้:**
1. ตรวจสอบ EMAIL_HOST และ EMAIL_PORT
2. ตรวจสอบ firewall settings
3. ทดสอบ connection ด้วย telnet: `telnet EMAIL_HOST EMAIL_PORT`

### ETIMEDOUT (Connection Timeout)
**สาเหตุ:**
- Network latency สูง
- Firewall block
- SMTP server ไม่ตอบสนอง

**วิธีแก้:**
1. ตรวจสอบ network connection
2. ตรวจสอบ firewall settings
3. ลองเปลี่ยน EMAIL_PORT (587 → 465 หรือกลับกัน)

## ตรวจสอบว่า Email ถูกส่งหรือไม่

### 1. ตรวจสอบ Logs
```
[Webhook] ✅ Admin email notification sent successfully
[Webhook] ✅ Customer confirmation email sent successfully to: customer@example.com
```

### 2. ตรวจสอบ Inbox
- Admin: ตรวจสอบ inbox ของ `ADMIN_EMAIL`
- Customer: ตรวจสอบ inbox ของ customer (และ spam folder)

### 3. ตรวจสอบ Spam Folder
บางครั้ง email อาจไปที่ spam folder:
- ตรวจสอบ SPF/DKIM records
- ใช้ email service ที่มี reputation ดี (SendGrid, Mailgun, Amazon SES)

## Troubleshooting

### ปัญหา: Email ไม่ส่งเมื่อ payment สำเร็จ

1. **ตรวจสอบ Logs:**
   ```bash
   # ดู logs ใน console เมื่อ webhook ถูกเรียก
   [Webhook] Error sending email notification: ...
   ```

2. **ทดสอบ Email Service:**
   ```bash
   npm run test-email
   ```

3. **ตรวจสอบ Environment Variables:**
   ```bash
   # ตรวจสอบว่า .env มีการตั้งค่าถูกต้อง
   cat .env | grep EMAIL
   ```

4. **ตรวจสอบ Email Configuration:**
   - EMAIL_HOST ถูกต้องหรือไม่
   - EMAIL_PORT ถูกต้องหรือไม่
   - EMAIL_USER และ EMAIL_PASSWORD ถูกต้องหรือไม่
   - ADMIN_EMAIL ถูกต้องหรือไม่

### ปัญหา: Email ไปที่ Spam

1. **ใช้ Email Service ที่มี Reputation ดี:**
   - SendGrid
   - Mailgun
   - Amazon SES

2. **ตั้งค่า SPF/DKIM Records:**
   - เพิ่ม SPF record ใน DNS
   - เพิ่ม DKIM record ใน DNS

3. **ใช้ Custom Domain:**
   - ใช้ email จาก domain ของคุณเอง
   - ตั้งค่า SPF/DKIM สำหรับ domain

## สรุป

✅ **ระบบส่งอีเมลพร้อมใช้งาน** เมื่อ:
- Environment variables ตั้งค่าถูกต้อง
- SMTP connection สำเร็จ
- Email ส่งได้ทั้ง admin และ customer

❌ **ต้องแก้ไข** เมื่อ:
- Connection failed
- Authentication failed
- Email ไม่ส่ง
- Email ไปที่ spam folder

## ตัวอย่างการตั้งค่าที่สมบูรณ์

```env
# Email Configuration (ตัวอย่างสำหรับ Custom SMTP)
EMAIL_HOST=mail.dsmuaythaiticket.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@dsmuaythaiticket.com
EMAIL_PASSWORD=your-secure-password
ADMIN_EMAIL=admin@dsmuaythaiticket.com
```
