# Stadium Logos Folder

## ไฟล์โลโก้ที่ต้องมี

วางไฟล์โลโก้ของแต่ละสนามมวยในโฟลเดอร์นี้ โดยใช้ชื่อไฟล์ตามที่กำหนดไว้ด้านล่าง:

### ชื่อไฟล์ที่ต้องใช้:

1. **`rajadamnern-logo.png`** หรือ **`rajadamnern-logo.jpg`**
   - โลโก้สนามมวยราชดำเนิน (Rajadamnern Stadium)
   - รองรับไฟล์: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`

2. **`lumpinee-logo.png`** หรือ **`lumpinee-logo.jpg`**
   - โลโก้สนามมวยลุมพินี (Lumpinee Stadium)
   - รองรับไฟล์: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`

3. **`bangla-logo.png`** หรือ **`bangla-logo.jpg`**
   - โลโก้สนามมวยบังลา (Bangla Boxing Stadium)
   - รองรับไฟล์: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`

4. **`patong-logo.png`** หรือ **`patong-logo.jpg`**
   - โลโก้สนามมวยป่าตอง (Patong Stadium)
   - รองรับไฟล์: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`

## ข้อกำหนด:

- **ชื่อไฟล์ต้องตรงกันทุกตัวอักษร** (ตัวพิมพ์เล็กทั้งหมด)
- **รูปแบบไฟล์**: PNG, JPG, JPEG, SVG, หรือ WEBP
- **ขนาดแนะนำ**: 
  - ความกว้าง: 200-400px
  - ความสูง: 100-200px
  - อัตราส่วน: 2:1 หรือ 3:1 (กว้าง:สูง)
- **พื้นหลัง**: โปร่งใส (PNG) หรือสีขาว/สีเข้ม ตามที่ต้องการ

## วิธีใช้งาน:

1. วางไฟล์โลโก้ในโฟลเดอร์ `frontend/public/images/stadium-logos/`
2. ใช้ชื่อไฟล์ตามที่กำหนดไว้ด้านบน
3. ระบบจะโหลดโลโก้อัตโนมัติตาม stadiumId ของแต่ละสนาม

## ตัวอย่าง:

```
frontend/public/images/stadium-logos/
  ├── rajadamnern-logo.png
  ├── lumpinee-logo.png
  ├── bangla-logo.png
  └── patong-logo.png
```

## หมายเหตุ:

- ถ้าไม่มีไฟล์โลโก้ ระบบจะแสดงชื่อสนามแบบข้อความแทน
- ระบบจะตรวจสอบไฟล์ตามลำดับ: `.png` → `.jpg` → `.jpeg` → `.svg` → `.webp`

