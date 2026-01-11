# WebP Image Conversion Guide

ระบบนี้ได้ถูกปรับให้รองรับการแปลงรูปภาพเป็น WebP format เพื่อเพิ่มประสิทธิภาพในการโหลดรูปภาพใน production

## สิ่งที่ได้ทำแล้ว

### 1. Backend Image Conversion Service
- ✅ สร้าง `backend/services/imageService.js` สำหรับแปลงรูปเป็น WebP
- ✅ รองรับการแปลง base64 images และไฟล์รูปภาพ
- ✅ ปรับ image upload endpoints ทั้งหมดให้แปลงรูปเป็น WebP ก่อนบันทึก

### 2. Frontend Updates
- ✅ อัพเดท `frontend/src/utils/imageHelpers.js` ให้แปลงรูปเป็น WebP (ถ้า browser รองรับ)
- ✅ มี fallback เป็น JPEG สำหรับ browser ที่ไม่รองรับ WebP

### 3. Event Service
- ✅ อัพเดท `backend/services/eventService.js` ให้แปลง image paths เป็น WebP format

## วิธีใช้งาน

### แปลงรูปที่มีอยู่เป็น WebP

รันคำสั่งต่อไปนี้เพื่อแปลงรูปภาพทั้งหมดใน `frontend/public/images` เป็น WebP:

```bash
cd backend
npm run convert-images
```

สคริปต์จะ:
- ค้นหารูปภาพทั้งหมด (JPG, JPEG, PNG) ใน `frontend/public/images` และ subdirectories
- แปลงเป็น WebP format (quality: 85%, max: 1920x1080)
- สร้างไฟล์ `.webp` ใหม่ข้างๆ ไฟล์เดิม (ไม่ลบไฟล์เดิม)

### ตัวอย่างผลลัพธ์

```
frontend/public/images/highlights/image.jpg  →  frontend/public/images/highlights/image.webp
```

## Endpoints ที่รองรับ WebP

ทุก image upload endpoints จะแปลงรูปเป็น WebP อัตโนมัติ:

- `PUT /api/images/hero` - Hero image
- `POST /api/images/highlights` - Create highlight
- `PUT /api/images/highlights/:id` - Update highlight
- `POST /api/images/stadiums` - Create stadium
- `PUT /api/images/stadiums/:id` - Update stadium
- `PUT /api/images/stadium-schedules/:stadiumId` - Update stadium schedules
- `POST /api/images/special-matches` - Create special match
- `PUT /api/images/special-matches/:id` - Update special match
- `PUT /api/images/upcoming-fights-background` - Update background
- `PUT /api/images/promptpay-qr` - Update QR code

## Image Quality Settings

- **General images**: Quality 85%, Max 1920x1080px
- **Logos**: Quality 90%, Max 500x500px
- **QR codes**: Quality 90%, Max 1000x1000px

## หมายเหตุ

1. **ไฟล์เดิมจะไม่ถูกลบ**: หลังจากแปลงรูปแล้ว ไฟล์เดิมจะยังอยู่ คุณสามารถลบด้วยตนเองหลังจากตรวจสอบว่า WebP files ทำงานถูกต้องแล้ว

2. **Base64 images**: รูปที่อัพโหลดเป็น base64 จะถูกแปลงเป็น WebP base64 อัตโนมัติ

3. **File paths**: Path references จะถูกแปลงเป็น `.webp` extension อัตโนมัติเมื่อใช้ใน eventService

4. **Browser support**: Frontend จะตรวจสอบว่า browser รองรับ WebP หรือไม่ และ fallback เป็น JPEG ถ้าไม่รองรับ

## การตรวจสอบ

หลังจากแปลงรูปแล้ว:
1. ตรวจสอบว่าไฟล์ `.webp` ถูกสร้างขึ้นแล้ว
2. ทดสอบว่าเว็บไซต์โหลดรูปได้ปกติ
3. ตรวจสอบ performance ว่าดีขึ้นหรือไม่
4. ลบไฟล์เดิม (JPG/PNG) ถ้าต้องการ

## Troubleshooting

### Error: "Directory not found"
- ตรวจสอบว่า `frontend/public/images` directory มีอยู่จริง

### Error: "Failed to convert image to WebP"
- ตรวจสอบว่าไฟล์รูปภาพไม่เสียหาย
- ตรวจสอบว่า sharp library ติดตั้งแล้ว (`npm install sharp`)

### รูปไม่แสดงใน browser
- ตรวจสอบว่าไฟล์ `.webp` ถูกสร้างแล้ว
- ตรวจสอบว่า path ใน database ชี้ไปที่ไฟล์ที่ถูกต้อง
- ลองใช้ browser ที่รองรับ WebP (Chrome, Firefox, Edge, Safari 14+)
