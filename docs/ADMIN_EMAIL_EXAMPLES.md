# ตัวอย่างอีเมลแจ้งเตือนไปยัง Admin

ระบบจะส่งอีเมลไปยัง `ADMIN_EMAIL` (ตั้งค่าใน `.env`) เมื่อลูกค้าชำระเงินสำเร็จ โดยแยกตามช่องทางชำระเงิน:

---

## 1. ชำระเงินผ่าน QR / PromptPay (Pay Solutions)

**Subject:** `New Booking - [ชื่อสนาม] - [ชื่อลูกค้า]`

**ส่งเมื่อ:** Webhook จาก Pay Solutions แจ้งว่าชำระเงินสำเร็จ

**ตัวอย่างเนื้อหา:** (รูปแบบ compact - header สีส้ม)

```
┌─────────────────────────────────────────────────────┐
│  New Booking Received                                │
│  ชำระเงินสำเร็จ - DS Muay Thai Stadium                │
├─────────────────────────────────────────────────────┤
│  # Order Information                                 │
│  Order Number      000001                            │
│  Booking Reference ABC123XYZ                         │
│                                                     │
│  Event Details                                       │
│  Stadium           Rajadamnern Stadium               │
│  Date              Saturday, February 15, 2025       │
│  Zone / Ticket     VIP Ringside                      │
│  Quantity          2 tickets                         │
│                                                     │
│  ฿5,000.00 (Total Amount)                           │
│                                                     │
│  Customer Information                                │
│  Name              สมชาย ใจดี                         │
│  Email             somchai@example.com               │
│  Phone             0812345678                        │
│                                                     │
│  ⚠️ Please verify the payment and prepare the      │
│     ticket for the customer.                        │
│                                                     │
│  [ View Full Details ]  ← ลิงก์ไปหน้า success       │
└─────────────────────────────────────────────────────┘
```

---

## 2. ชำระเงินผ่าน Credit Card (Stripe)

**Subject:** `ชำระเงินสำเร็จ (Credit Card) - [ชื่อสนาม] - [ชื่อลูกค้า]`

**ส่งเมื่อ:** ลูกค้าชำระเงินผ่านบัตรเครดิตด้วย Stripe สำเร็จ

**เนื้อหาเฉพาะ:**
- แสดงข้อความ "ลูกค้าชำระเงินเรียบร้อยแล้ว (Credit Card)"
- "ชำระผ่านบัตรเครดิตด้วย Stripe"
- Badge "Payment verified by Stripe" พร้อม Session ID และ Payment Intent ID
- สีธีมสีม่วง (Stripe brand colors)

---

## การตั้งค่า

1. ตั้งค่า `ADMIN_EMAIL` ในไฟล์ `.env`:
   ```
   ADMIN_EMAIL=admin@yourdomain.com
   ```

2. หากไม่ตั้งค่า `ADMIN_EMAIL` ระบบจะใช้ `EMAIL_USER` แทน

3. ทดสอบการส่งอีเมล:
   ```bash
   cd backend && node test-email.js
   ```
