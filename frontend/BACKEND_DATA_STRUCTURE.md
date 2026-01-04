# 🗄️ Backend Data Structure for Upcoming Fights

## 📋 Overview

โครงสร้างข้อมูลสำหรับ Backend API ที่จะส่งมาให้ Frontend แสดงผล

---

## 📦 Complete Data Structure

### Full Example (weeklyFights):

```javascript
{
  "weeklyFights": {
    "monday": {
      // Basic Info
      "title": "Monday Championship Fight",           // ชื่อการแข่งขัน
      "title_th": "ศึกชิงแชมป์วันจันทร์",            // ชื่อภาษาไทย
      
      // Fighters (Optional)
      "fighters": {
        "red": "Saenchai PKSaenchai",                // นักมวยมุมแดง
        "blue": "Buakaw Banchamek"                   // นักมวยมุมน้ำเงิน
      },
      
      // Images
      "image": "https://cdn.example.com/fights/monday-fight.jpg",  // รูปพื้นหลัง
      "imageAlt": "Monday Championship Fight",
      "imageThumbnail": "https://cdn.example.com/fights/monday-thumb.jpg",
      
      // Stadium
      "logos": [
        "https://cdn.example.com/logos/lumpinee.png"
      ],
      "stadiumId": "lumpinee",
      
      // Time
      "time": "20:00",                                // เวลาเริ่ม (HH:MM)
      "date": "2026-01-05",                           // วันที่
      
      // Pricing
      "price": 1500,                                  // ราคา (บาท)
      
      // Stadium
      "stadium": {
        "name": "ลุมพินี",                            // ชื่อสนามมวย (ไทย)
        "name_en": "Lumpinee"                         // ชื่อสนามมวย (EN)
      },
      
      // Availability
      "soldOut": false,                               // ขายหมดหรือไม่
      "availableSeats": 150,                          // จำนวนที่นั่งที่เหลือ (optional)
      
      // Additional Info (Optional)
      "description": "Championship bout featuring...",
      "mainEvent": true,
      "rounds": 5,
      "weightClass": "Lightweight"
    },
    
    "tuesday": {
      "title": "Tuesday Fight Night",
      "title_th": "ศึกมวยไทยวันอังคาร",
      "time": "19:30",
      "price": 800,
      "soldOut": false,
      "image": "https://cdn.example.com/fights/tuesday.jpg",
      "logos": ["https://cdn.example.com/logos/rajadamnern.png"],
      "stadium": {
        "name": "ราชดำเนิน",
        "name_en": "Rajadamnern"
      }
    },
    
    // ... other days
  }
}
```

---

## 🎯 Required Fields (ต้องมี)

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | ชื่อการแข่งขัน (EN) |
| `time` | String | เวลา (HH:MM) |
| `price` | Number | ราคา (บาท) |
| `stadium` | Object | ข้อมูลสนามมวย |
| `soldOut` | Boolean | ขายหมดหรือไม่ |

---

## ⭐ Optional Fields (ไม่บังคับ)

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `title_th` | String | ชื่อภาษาไทย | use `title` |
| `fighters` | Object | ข้อมูลนักมวย | null |
| `fighters.red` | String | นักมวยมุมแดง | - |
| `fighters.blue` | String | นักมวยมุมน้ำเงิน | - |
| `image` | String | รูปพื้นหลัง URL | null |
| `imageThumbnail` | String | รูป thumbnail | null |
| `logos` | Array | logos URL | [] |
| `availableSeats` | Number | ที่นั่งเหลือ | null |
| `stadium.name` | String | ชื่อสนามมวย (ไทย) | Random |
| `stadium.name_en` | String | ชื่อสนามมวย (EN) | Random |
| `description` | String | รายละเอียด | null |

---

## 🏟️ Stadium Display

### Stadium Options:
```javascript
{
  "stadium": {
    "name": "ลุมพินี",      // Thai name
    "name_en": "Lumpinee"   // English name
  }
}
```

### Available Stadiums:
1. **ภูเก็ต** (Phuket)
2. **ลุมพินี** (Lumpinee)
3. **ราชดำเนิน** (Rajadamnern)
4. **ตะวันนา** (Tawanna)

**Display**: Orange badge with stadium name

---

## 💰 Price Display Logic

### Case 1: Normal Price
```javascript
{
  "price": 1500
}
```
**Display**: ฿1,500 (yellow glow)

### Case 2: Sold Out
```javascript
{
  "price": 1500,
  "soldOut": true
}
```
**Display**: SOLD OUT badge over price

---

## 🏆 Fighter Display

### With Fighters:
```javascript
{
  "fighters": {
    "red": "Saenchai PKSaenchai",
    "blue": "Buakaw Banchamek"
  }
}
```
**Display**: 
```
🔴 RED Saenchai PKSaenchai  VS  🔵 BLUE Buakaw Banchamek
```

### Without Fighters:
```javascript
{
  "fighters": null  // or undefined
}
```
**Display**: Stadium name only

---

## 🎨 Price Display Design

### Current Implementation:

```jsx
<div className="text-center">
  {/* Label */}
  <div className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
    STARTING FROM
  </div>
  
  {/* Price - BIG & BOLD with Glow */}
  <div className="relative inline-block">
    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-lg opacity-30"></div>
    <div className="relative text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)]">
      ฿{price.toLocaleString()}
    </div>
  </div>
</div>
```

**Features:**
- ✅ Gradient yellow color (ดูหรู)
- ✅ Text-5xl (ใหญ่มาก)
- ✅ Font-black (หนามาก)
- ✅ Glow effect with blur
- ✅ Number formatting (1,500)
- ✅ Drop shadow
- ❌ No discount (removed)

---

## 🚫 SOLD OUT Badge Design

### Implementation:

```jsx
{soldOut && (
  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20">
    <div className="transform -rotate-12">
      <div className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 border-4 border-red-400 rounded-xl shadow-2xl">
        <div className="text-4xl font-black text-white uppercase">
          SOLD OUT
        </div>
        <div className="text-xs text-red-200 text-center">
          ขายหมดแล้ว
        </div>
      </div>
    </div>
  </div>
)}
```

**Features:**
- ✅ Overlay ทับทั้งพื้นที่
- ✅ Backdrop blur
- ✅ Rotated -12 degrees (ดูเท่)
- ✅ Red gradient background
- ✅ Bold border
- ✅ Shadow effects
- ✅ Bilingual (EN + TH)

---

## 🗓️ Date & Time Format

### Date Format:
```javascript
"date": "2026-01-05"  // YYYY-MM-DD (ISO 8601)
```

### Time Format:
```javascript
"time": "20:00"       // HH:MM (24-hour)
"time": "19:30"       // with minutes
```

Frontend will display:
- `20:00` → "20:00" or "8:00 PM"
- Date: "5 มกราคม 2026" or "5 JAN 2026"

---

## 📊 API Endpoints (Suggested)

### 1. Get Weekly Fights
```
GET /api/fights/weekly

Response:
{
  "success": true,
  "data": {
    "weeklyFights": { ... }
  }
}
```

### 2. Get Single Fight
```
GET /api/fights/:dayOfWeek

Response:
{
  "success": true,
  "data": {
    "title": "...",
    "price": 1500,
    ...
  }
}
```

### 3. Update Fight
```
PATCH /api/fights/:dayOfWeek

Body:
{
  "price": 1200,
  "soldOut": false,
  "fighters": { ... },
  "stadium": {
    "name": "ลุมพินี",
    "name_en": "Lumpinee"
  }
}

Response:
{
  "success": true,
  "data": { ... }
}
```

### 4. Upload Fight Image
```
POST /api/fights/:dayOfWeek/image

Body: FormData with image file

Response:
{
  "success": true,
  "imageUrl": "https://cdn.example.com/..."
}
```

---

## 💾 Database Schema Examples

### MongoDB:

```javascript
const FightSchema = new Schema({
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  title_th: String,
  fighters: {
    red: String,
    blue: String
  },
  image: {
    url: String,
    thumbnail: String,
    alt: String
  },
  logos: [String],
  stadiumId: String,
  time: {
    type: String,
    required: true,
    default: '20:00'
  },
  date: Date,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stadium: {
    name: String,        // Thai name
    name_en: String      // English name
  },
  soldOut: {
    type: Boolean,
    default: false
  },
  availableSeats: Number,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

### PostgreSQL:

```sql
CREATE TABLE fights (
  id SERIAL PRIMARY KEY,
  day_of_week VARCHAR(10) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  title_th VARCHAR(255),
  fighter_red VARCHAR(100),
  fighter_blue VARCHAR(100),
  image_url TEXT,
  image_thumbnail TEXT,
  image_alt VARCHAR(255),
  logos TEXT[], -- Array of URLs
  stadium_id VARCHAR(50),
  stadium_name VARCHAR(100),
  stadium_name_en VARCHAR(100),
  fight_time TIME NOT NULL DEFAULT '20:00',
  fight_date DATE,
  price INTEGER NOT NULL CHECK (price >= 0),
  stadium_name VARCHAR(100),
  stadium_name_en VARCHAR(100),
  sold_out BOOLEAN DEFAULT FALSE,
  available_seats INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_day_of_week ON fights(day_of_week);
CREATE INDEX idx_fight_date ON fights(fight_date);
```

---

## 🎯 Frontend Mock Data (Current)

Frontend กำลังใช้ mock data:

```javascript
{
  title: weeklyFight.title || (language === 'th' ? 'มวยไทยประจำวัน' : 'DAILY MUAY THAI'),
  fighters: weeklyFight.fighters || null,
  time: weeklyFight.time || '20:00',
  price: weeklyFight.price || (800 + Math.floor(Math.random() * 1700)), // Random 800-2500
  soldOut: weeklyFight.soldOut || false,
  availableSeats: weeklyFight.availableSeats || null,
  stadium: weeklyFight.stadium || {
    name: 'ลุมพินี',        // Random from: ภูเก็ต, ลุมพินี, ราชดำเนิน, ตะวันนา
    name_en: 'Lumpinee'     // Random from: Phuket, Lumpinee, Rajadamnern, Tawanna
  }
}
```

**Backend ควรส่งข้อมูลจริงมาแทนค่า default เหล่านี้**

---

## ✅ Integration Checklist

### Backend Tasks:
- [ ] Create database schema
- [ ] Implement CRUD API endpoints
- [ ] Image upload & processing
- [ ] Data validation
- [ ] Error handling
- [ ] API documentation

### Frontend (Already Done):
- [x] Price display with gradient
- [x] SOLD OUT badge
- [x] Fighter display
- [x] Original price strikethrough
- [x] Savings badge
- [x] Number formatting
- [x] Responsive design
- [x] Backend data structure support

---

## 📝 Example API Response

### Complete Response:

```json
{
  "success": true,
  "data": {
    "weeklyFights": {
      "monday": {
        "title": "Championship Night",
        "title_th": "ศึกชิงแชมป์",
        "fighters": {
          "red": "Saenchai PKSaenchai",
          "blue": "Buakaw Banchamek"
        },
        "image": "https://cdn.example.com/fights/mon.jpg",
        "logos": ["https://cdn.example.com/logos/lumpinee.png"],
        "time": "20:00",
        "price": 1500,
        "soldOut": false,
        "availableSeats": 150,
        "stadium": {
          "name": "ลุมพินี",
          "name_en": "Lumpinee"
        }
      },
      "tuesday": {
        "title": "Fight Night",
        "time": "19:30",
        "price": 800,
        "soldOut": false,
        "stadium": {
          "name": "ราชดำเนิน",
          "name_en": "Rajadamnern"
        }
      },
      "wednesday": {
        "title": "Special Event",
        "time": "20:00",
        "price": 1200,
        "soldOut": true,
        "stadium": {
          "name": "ภูเก็ต",
          "name_en": "Phuket"
        }
      }
    }
  },
  "timestamp": "2026-01-03T10:30:00Z"
}
```

---

**Created**: 2026-01-03  
**Version**: 2.0.0  
**Status**: Ready for Backend Implementation 🚀

