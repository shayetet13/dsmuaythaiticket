# 🖼️ Fight Background Image Structure

## 📋 Overview

UpcomingFightsSection รองรับการแสดงรูปภาพพื้นหลังสำหรับแต่ละการแข่งขันแล้ว

---

## 🎨 Image Handling

### Image Properties:
- **object-fit**: `cover` (ครอบคลุมพื้นที่ทั้งหมด)
- **object-position**: `center` (จัดกึ่งกลาง)
- **aspect-ratio**: รักษาสัดส่วนเดิม ไม่ยืด
- **filter**: `brightness(0.3) contrast(1.1) saturate(1.2)`

### Overlay:
- Dark gradient: `from-black/95 via-black/85 to-black/75`
- เพื่อให้ข้อความอ่านง่าย

---

## 📦 Data Structure (สำหรับ Backend)

### Current Structure (weeklyFights):

```javascript
{
  monday: {
    image: "/path/to/monday-fight.jpg",  // ✅ รองรับแล้ว
    logos: ["logo1.png", "logo2.png"],
    // ... other data
  },
  tuesday: {
    image: "/path/to/tuesday-fight.jpg",  // ✅ รองรับแล้ว
    logos: ["logo1.png"],
    // ... other data
  },
  // ... other days
}
```

### Recommended Backend Response:

```json
{
  "weeklyFights": {
    "monday": {
      "image": "https://api.example.com/images/fight-monday.jpg",
      "imageAlt": "Monday Night Fight",
      "imageThumbnail": "https://api.example.com/images/fight-monday-thumb.jpg",
      "logos": [
        "https://api.example.com/logos/stadium1.png"
      ],
      "stadiumId": "lumpinee",
      "fightDate": "2026-01-05",
      "fightTime": "20:00"
    }
  }
}
```

---

## 🎯 Image Requirements

### Recommended Specifications:

| Property | Value |
|----------|-------|
| Format | JPG, PNG, WebP |
| Min Width | 1200px |
| Min Height | 300px |
| Aspect Ratio | 4:1 or 16:9 |
| Max File Size | 500KB |
| Quality | 80-85% |

### Optimal Dimensions:
- **Desktop**: 1600 x 400px (4:1)
- **Mobile**: 800 x 400px (2:1)
- **Thumbnail**: 400 x 200px

---

## 🔧 Implementation Example

### Frontend (Current):

```jsx
{fight.data.image && (
  <div className="absolute inset-0 z-0">
    <img
      src={fight.data.image}
      alt={`${fight.dayNameFull} Fight`}
      className="w-full h-full object-cover object-center"
      style={{
        filter: 'brightness(0.3) contrast(1.1) saturate(1.2)',
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/75"></div>
  </div>
)}
```

### Backend API Endpoint (Recommended):

```javascript
// GET /api/fights/weekly
router.get('/weekly', async (req, res) => {
  const fights = {
    monday: {
      image: process.env.CDN_URL + '/fights/monday-2026-01-05.jpg',
      imageAlt: 'Monday Night Championship',
      logos: [
        process.env.CDN_URL + '/logos/lumpinee.png'
      ],
      stadiumId: 'lumpinee',
      fightDate: '2026-01-05',
      fightTime: '20:00'
    },
    // ... other days
  };
  
  res.json({ weeklyFights: fights });
});
```

---

## 📸 Image Processing Recommendations

### 1. **Image Optimization:**
```bash
# Using ImageMagick
convert input.jpg \
  -resize 1600x400^ \
  -gravity center \
  -extent 1600x400 \
  -quality 85 \
  output.jpg
```

### 2. **WebP Conversion:**
```bash
# Convert to WebP for better compression
cwebp -q 85 input.jpg -o output.webp
```

### 3. **Responsive Images:**
```html
<picture>
  <source srcset="fight-1600w.webp" type="image/webp" media="(min-width: 1200px)">
  <source srcset="fight-800w.webp" type="image/webp" media="(min-width: 640px)">
  <img src="fight-1600w.jpg" alt="Fight">
</picture>
```

---

## 🎨 Filter Effects Explained

### Current Filters:

1. **brightness(0.3)**: ลดความสว่างลง 70% เพื่อให้ข้อความเด่นชัด
2. **contrast(1.1)**: เพิ่ม contrast 10% เพื่อความคมชัด
3. **saturate(1.2)**: เพิ่มความสดของสี 20%

### Overlay Gradient:
- `from-black/95`: ซ้ายสุดมืดที่สุด (95% opacity)
- `via-black/85`: กลางมืดปานกลาง (85% opacity)
- `to-black/75`: ขวาสุดมืดน้อยที่สุด (75% opacity)

---

## 🔄 Fallback Behavior

### If No Image:
- แสดง grid pattern แทน
- ใช้ gradient background
- ไม่มี error แสดง

### If Image Load Failed:
- `onError` handler ซ่อนรูป
- แสดง fallback pattern
- User experience ไม่เสีย

---

## 📱 Responsive Behavior

### Desktop (lg:):
- Full image visible
- 3-column layout
- Image prominent

### Tablet (md:):
- 2-column layout
- Image partially visible
- Text overlay clear

### Mobile (sm:):
- Stacked layout
- Image background
- Date badge on top

---

## 🚀 Future Enhancements (Optional)

### 1. **Lazy Loading:**
```jsx
<img
  src={fight.data.image}
  loading="lazy"
  decoding="async"
/>
```

### 2. **Blur Placeholder:**
```jsx
<img
  src={fight.data.image}
  style={{
    backgroundImage: `url(${fight.data.imageThumbnail})`,
    backgroundSize: 'cover',
    filter: 'blur(10px)',
  }}
/>
```

### 3. **Progressive Loading:**
```jsx
const [imageLoaded, setImageLoaded] = useState(false);

<img
  src={fight.data.image}
  onLoad={() => setImageLoaded(true)}
  className={imageLoaded ? 'opacity-100' : 'opacity-0'}
  style={{ transition: 'opacity 0.5s' }}
/>
```

---

## 💾 Database Schema (Recommended)

### MongoDB Example:

```javascript
const FightSchema = new Schema({
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  image: {
    url: String,
    alt: String,
    thumbnail: String,
    width: Number,
    height: Number
  },
  stadium: {
    id: String,
    name: String,
    logo: String
  },
  date: Date,
  time: String,
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  }
});
```

### PostgreSQL Example:

```sql
CREATE TABLE fights (
  id SERIAL PRIMARY KEY,
  day_of_week VARCHAR(10) NOT NULL,
  image_url TEXT,
  image_alt VARCHAR(255),
  image_thumbnail TEXT,
  stadium_id VARCHAR(50),
  fight_date DATE NOT NULL,
  fight_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Checklist for Backend Implementation

- [ ] Image upload endpoint
- [ ] Image processing (resize, optimize)
- [ ] CDN integration
- [ ] Database schema
- [ ] API endpoint for weekly fights
- [ ] Image validation (format, size)
- [ ] Error handling
- [ ] Thumbnail generation
- [ ] WebP conversion
- [ ] Cache headers

---

## 📞 API Endpoints (Suggested)

### 1. Get Weekly Fights:
```
GET /api/fights/weekly
Response: { weeklyFights: { monday: {...}, ... } }
```

### 2. Upload Fight Image:
```
POST /api/fights/:day/image
Body: FormData with image file
Response: { imageUrl: "...", thumbnail: "..." }
```

### 3. Update Fight Data:
```
PATCH /api/fights/:day
Body: { image: "url", logos: [...], ... }
Response: { success: true, data: {...} }
```

---

## 🎯 Current Status

### ✅ Completed (Frontend):
- Image display with proper aspect ratio
- Dark overlay for readability
- Filter effects
- Error handling
- Fallback pattern
- Responsive design

### 🔄 Pending (Backend):
- Image upload API
- Database integration
- CDN setup
- Image optimization pipeline

---

**Created**: 2026-01-03  
**Version**: 1.0.0  
**Status**: Ready for Backend Integration

