# คู่มือการตั้งค่า SEO และ Social Media Sharing

## 📋 สิ่งที่ตั้งค่าแล้ว

✅ Meta tags สำหรับ SEO (Title, Description)
✅ Open Graph tags สำหรับ Facebook
✅ Twitter Card tags
✅ ภาพสำหรับการแชร์ (1200x630px)

## 🖼️ วิธีเปลี่ยนภาพ Hero สำหรับการแชร์

เมื่อคุณเปลี่ยน Hero Image บนเว็บไซต์ คุณต้องสร้างภาพใหม่สำหรับการแชร์ด้วย:

### วิธีที่ 1: ใช้สคริปต์อัตโนมัติ (แนะนำ)

```bash
cd backend
node scripts/resizeHeroForSocial.js
```

สคริปต์จะ:
- หา Hero Image ที่ใช้จริงบนเว็บไซต์
- สร้างภาพ `hero-social.webp` (1200x630px) สำหรับการแชร์
- บันทึกไว้ที่ `/frontend/public/images/hero/hero-social.webp`

### วิธีที่ 2: สร้างภาพเอง

1. ใช้ภาพ Hero Image ที่ใช้บนเว็บไซต์
2. Resize เป็น **1200x630px** (อัตราส่วน 1.91:1)
3. บันทึกเป็น WebP format
4. ตั้งชื่อว่า `hero-social.webp`
5. วางไว้ที่ `/frontend/public/images/hero/hero-social.webp`

## 🔄 วิธี Clear Facebook Cache

เมื่อเปลี่ยนภาพหรือ description แล้ว Facebook อาจยังแสดงข้อมูลเก่า เพราะมีการ cache ไว้:

### ใช้ Facebook Sharing Debugger

1. ไปที่: https://developers.facebook.com/tools/debug/
2. ใส่ URL ของเว็บไซต์: `https://dsmuaythaiticket.com/`
3. กดปุ่ม **"Scrape Again"** เพื่อ clear cache
4. ตรวจสอบว่า meta tags แสดงถูกต้อง:
   - `og:title` - ควรแสดง "DS MUAY THAI TICKET"
   - `og:description` - ควรแสดง description ที่ตั้งไว้
   - `og:image` - ควรแสดงภาพ hero-social.webp

### ⚠️ ปัญหา Description ไม่แสดง

ถ้า description ไม่แสดงบน Facebook ให้ตรวจสอบ:

1. **Clear Facebook Cache**: ใช้ Facebook Debugger และกด "Scrape Again"
2. **ตรวจสอบ HTML Source**: ดูว่า meta tags อยู่ใน HTML หรือไม่
   - เปิดเว็บไซต์ → Right click → View Page Source
   - ค้นหา `og:description` ควรจะเห็น meta tag
3. **ตรวจสอบความยาว**: Description ควรอยู่ระหว่าง 1-200 ตัวอักษร
4. **ตรวจสอบ Absolute URL**: ต้องใช้ absolute URL (`https://dsmuaythaiticket.com/...`)
5. **Rebuild และ Deploy**: หลังจากแก้ไข meta tags ต้อง rebuild และ deploy ใหม่

## 📝 Meta Tags ที่ใช้

ภาพที่ใช้สำหรับการแชร์จะถูกตั้งค่าใน:
- `frontend/index.html` - Meta tags พื้นฐาน
- `frontend/src/App.jsx` - อัปเดตแบบไดนามิกด้วย absolute URL

## ⚠️ หมายเหตุสำคัญ

1. **ต้องใช้ Absolute URL**: Facebook และ Twitter ต้องการ absolute URL (เช่น `https://dsmuaythaiticket.com/images/hero/hero-social.webp`) ไม่ใช่ relative URL (`/images/hero/hero-social.webp`)
   - โค้ดจะแปลงเป็น absolute URL อัตโนมัติ

2. **ขนาดภาพ**: ภาพต้องเป็น **1200x630px** เพื่อแสดงผลดีบน Facebook

3. **Clear Cache**: หลังจากเปลี่ยนภาพ ต้อง clear Facebook cache เสมอ

4. **ตรวจสอบ**: ใช้ Facebook Debugger เพื่อตรวจสอบว่า meta tags ถูกต้อง

## 🎯 Checklist เมื่อเปลี่ยน Hero Image

- [ ] เปลี่ยน Hero Image ใน Admin Panel
- [ ] รันสคริปต์ `resizeHeroForSocial.js` เพื่อสร้างภาพใหม่
- [ ] ตรวจสอบว่าไฟล์ `hero-social.webp` ถูกสร้างแล้ว
- [ ] Clear Facebook cache ด้วย Facebook Debugger
- [ ] ทดสอบการแชร์ลิงก์บน Facebook/Twitter
