# Images Folder Structure

## Folder Organization

- **hero/** - Hero section background images
  - `hero-bg.jpg` - Main hero background image (1920x1080 recommended)
  
- **highlights/** - Fight highlights carousel images
  - `highlight-1.jpg` - Fight of the Year 2025
  - `highlight-2.jpg` - Amazing Victory
  - `highlight-3.jpg` - Excellent Fight
  - `highlight-4.jpg` - Intense Battle
  - `highlight-5.jpg` - Knockout Victory
  - `highlight-6.jpg` - Perfect Fight
  - Recommended size: 800x600px
  
- **stadiums/** - Stadium images
  - `rajadamnern.jpg` - Rajadamnern Stadium image (กรุงเทพ - ทุกวัน)
  - `lumpinee.jpg` - Lumpinee Stadium image (กรุงเทพ - ศุกร์/เสาร์)
  - `bangla.jpg` - Bangla Boxing Stadium image (ภูเก็ต - พุธ/ศุกร์/อาทิตย์)
  - `patong.jpg` - Patong Stadium image (ภูเก็ต - จันทร์/พฤหัส/เสาร์)
  - **⚠️ ชื่อไฟล์ต้องตรงกันทุกตัวอักษร (ตัวพิมพ์เล็ก)**
  - Recommended size: 1920x1080px หรือมากกว่า
  - ดูรายละเอียดเพิ่มเติมใน `stadiums/README.md`
  
- **stadium-logos/** - Stadium logo images
  - `rajadamnern-logo.png` - Rajadamnern Stadium logo
  - `lumpinee-logo.png` - Lumpinee Stadium logo
  - `bangla-logo.png` - Bangla Boxing Stadium logo
  - `patong-logo.png` - Patong Stadium logo
  - **⚠️ ชื่อไฟล์ต้องตรงกันทุกตัวอักษร (ตัวพิมพ์เล็ก)**
  - รองรับไฟล์: PNG, JPG, JPEG, SVG, WEBP
  - Recommended size: 200-400px width, 100-200px height
  - ดูรายละเอียดเพิ่มเติมใน `stadium-logos/README.md`
  
- **fights/** - Individual fight event images
  - `fight-1.jpg` - Fight event 1 (Past fight - Rajadamnern)
  - `fight-2.jpg` - Fight event 2 (Past fight - Lumpinee)
  - `fight-3.jpg` - Fight event 3 (Past fight - Bangla)
  - `fight-4.jpg` - Fight event 4 (Upcoming - Rajadamnern)
  - `fight-5.jpg` - Fight event 5 (Upcoming - Lumpinee)
  - `fight-6.jpg` - Fight event 6 (Upcoming - Bangla)
  - `fight-7.jpg` - Fight event 7 (Upcoming - Patong)
  - Recommended size: 800x600px

## Root Level Images

- **`upcoming-fights-bg.jpg`** - Background image for "Upcoming Fights" section
  - วางไฟล์นี้ในโฟลเดอร์ `frontend/public/images/`
  - Recommended size: 1920x1080px หรือมากกว่า
  - ระบบจะใช้ภาพนี้เป็น background สำหรับส่วน "Upcoming Fights"
  - ถ้าไม่มีไฟล์ ระบบจะใช้พื้นหลังสีเทาแทน

## Usage

1. Place your images in the respective folders with the exact filenames listed above
2. Supported formats: JPG, JPEG, PNG, WEBP
3. Images are referenced in the code using the `/images/` path prefix
4. The code will automatically use these local images instead of online URLs

## Example

If you place `hero-bg.jpg` in the `hero/` folder, it will be automatically used as the hero background image on the website.
