# 🚀 Performance Optimization Guide

## ภาพรวม

เว็บไซต์นี้ได้รับการเพิ่มประสิทธิภาพด้วยเทคนิคต่างๆ เพื่อให้โหลดเร็วและไหลลื่น

## ✨ การเพิ่มประสิทธิภาพที่ใช้

### 1. Image Optimization (การเพิ่มประสิทธิภาพรูปภาพ)

#### 1.1 Lazy Loading
- รูปภาพจะโหลดเมื่อผู้ใช้เลื่อนมาใกล้เท่านั้น
- ลดเวลาโหลดหน้าเริ่มต้น
- ประหยัด bandwidth

#### 1.2 WebP Format
- แปลงรูปภาพเป็น WebP (ขนาดเล็กกว่า JPEG/PNG 25-35%)
- Fallback อัตโนมัติสำหรับ browser ที่ไม่รองรับ
- คุณภาพคงเดิม แต่ขนาดไฟล์เล็กลง

#### 1.3 Image Compression
- บีบอัดรูปภาพอัตโนมัติขณะ build
- JPEG: quality 80 (ลดขนาด ~40-50%)
- PNG: quality 70-80 (ลดขนาด ~50-60%)

#### 1.4 Progressive Image Loading
- โชว์ภาพความละเอียดต่ำก่อน (blurred placeholder)
- โหลดภาพความละเอียดสูงค่อยๆ ทีหลัง
- ปรับปรุง perceived performance

#### 1.5 Responsive Images
- ใช้รูปขนาดที่เหมาะสมกับหน้าจอ
- Mobile ใช้รูปเล็ก, Desktop ใช้รูปใหญ่
- ประหยัด bandwidth บน mobile

### 2. Code Splitting (แบ่งโค้ด)

#### 2.1 Component-level Splitting
- แยก components ที่ไม่จำเป็นต้องโหลดทันที
- ใช้ `React.lazy()` และ `Suspense`
- ลดขนาด initial bundle ~30-40%

```javascript
// Components ที่ lazy load:
- HighlightsSection
- UpcomingFightsSection
- BookingSection
- PaymentQRPage
- SuccessPage
- AboutSection
- Footer
```

#### 2.2 Vendor Splitting
- แยก libraries ออกเป็น chunk ต่างหาก
- React, React Router, Axios แยกเป็นไฟล์คนละตัว
- Browser สามารถ cache libraries ได้

### 3. Build Optimizations

#### 3.1 Minification
- ลบ whitespace, comments, console.log
- Shorten variable names
- ลดขนาดไฟล์ ~40-50%

#### 3.2 Compression
- Gzip compression (ลดขนาด ~70%)
- Brotli compression (ลดขนาด ~75%, ดีกว่า gzip)
- Server ต้อง config รองรับ

#### 3.3 Tree Shaking
- ลบโค้ดที่ไม่ได้ใช้ออก
- ทำอัตโนมัติโดย Vite
- ลดขนาด bundle ~20-30%

### 4. Performance Monitoring

#### 4.1 Web Vitals
- **LCP** (Largest Contentful Paint): เป้าหมาย < 2.5s
- **FID** (First Input Delay): เป้าหมาย < 100ms
- **CLS** (Cumulative Layout Shift): เป้าหมาย < 0.1

#### 4.2 Resource Timing
- ติดตามเวลาโหลดของแต่ละ resource
- หารูปภาพที่โหลดช้า
- แสดง log ใน console (development mode)

#### 4.3 Memory Monitoring
- ตรวจสอบการใช้ memory
- ป้องกัน memory leak
- แสดง log ทุก 30 วินาที (development mode)

### 5. Network Optimization

#### 5.1 Preload Critical Resources
- โหลดรูป hero และ highlights แรกๆ ล่วงหน้า
- ใช้ `<link rel="preload">`
- ลดเวลารอ LCP

#### 5.2 Prefetch Next Page Resources
- โหลด resources ของหน้าถัดไปล่วงหน้า
- ใช้ `<link rel="prefetch">`
- Faster navigation

#### 5.3 Adaptive Quality
- ตรวจสอบความเร็วอินเทอร์เน็ต
- ลดคุณภาพรูปถ้าเน็ตช้า (2G, 3G)
- ปรับ UX ตามสภาพเครือข่าย

### 6. CSS Optimization

#### 6.1 GPU Acceleration
- ใช้ `transform: translateZ(0)` สำหรับรูปภาพ
- Enable hardware acceleration
- Animation ไหลลื่นขึ้น

#### 6.2 Prevent Layout Shifts
- กำหนด width/height สำหรับรูป
- ใช้ aspect-ratio CSS
- CLS score ดีขึ้น

#### 6.3 Will-Change Property
- บอก browser ล่วงหน้าว่าอะไรจะ animate
- ใช้เฉพาะกับ elements ที่จำเป็น
- ประหยัด memory

## 📊 ผลลัพธ์ที่คาดหวัง

### Before Optimization
- Initial Load: ~3-5s
- LCP: ~4-6s
- Bundle Size: ~800KB
- Images: ~2-5MB per page

### After Optimization
- Initial Load: ~1-2s (ลด 50-60%)
- LCP: ~2-3s (ลด 40-50%)
- Bundle Size: ~300KB (ลด 60-70%)
- Images: ~500KB-1MB per page (ลด 70-80%)

## 🛠️ การใช้งาน

### Development
```bash
npm run dev
```
- Performance monitoring เปิดอัตโนมัติ
- Console แสดง metrics ต่างๆ
- Hot reload สำหรับแก้ไขโค้ด

### Production Build
```bash
npm run build
```
- Image optimization อัตโนมัติ
- Code splitting และ minification
- Generate WebP images
- Compression (gzip + brotli)

### Preview Production Build
```bash
npm run preview
```
- ทดสอบ production build ใน local
- ตรวจสอบว่า optimization ทำงาน

## 🎯 Best Practices

### 1. Images
- ใช้รูป JPG สำหรับภาพถ่าย
- ใช้รูป PNG สำหรับ graphics/logos
- ใช้รูป SVG สำหรับ icons
- ขนาดต้นฉบับไม่เกิน 2000x2000px
- ใช้ OptimizedImage component ทุกครั้ง

### 2. Components
- แยก components ใหญ่ๆ ออกเป็น lazy load
- ใช้ Suspense กับ fallback UI ที่เหมาะสม
- Avoid inline functions ใน render
- ใช้ React.memo สำหรับ components ที่ render บ่อย

### 3. Performance
- Monitor Web Vitals ใน production
- ทดสอบบนเน็ตช้า (throttle network)
- ทดสอบบน mobile devices
- ใช้ Lighthouse audit เป็นประจำ

## 🔧 การ Config Server

### Nginx (Production)
```nginx
# Enable Gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

# Enable Brotli (if available)
brotli on;
brotli_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

# Cache static assets
location ~* \.(jpg|jpeg|png|webp|gif|ico|svg|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Preload headers
add_header Link "</path/to/hero.webp>; rel=preload; as=image" always;
```

## 📈 Monitoring Tools

1. **Chrome DevTools**
   - Performance tab
   - Network tab
   - Lighthouse audit

2. **Web Vitals Extension**
   - ติดตาม LCP, FID, CLS แบบ real-time

3. **Console Logs**
   - Performance metrics ใน development mode
   - Memory usage monitoring

## 🔄 Continuous Improvement

- Run Lighthouse audit ทุกครั้งก่อน deploy
- Monitor Web Vitals ใน production
- อัพเดท dependencies เป็นประจำ
- ทดสอบบน real devices
- รวบรวม user feedback

## 📚 Resources

- [Web Vitals](https://web.dev/vitals/)
- [Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Code Splitting](https://reactjs.org/docs/code-splitting.html)
- [Vite Optimization](https://vitejs.dev/guide/build.html)

---

**สร้างโดย:** Performance Optimization Team  
**อัพเดทล่าสุด:** January 2026
