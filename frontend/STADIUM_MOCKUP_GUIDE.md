# 🏟️ Stadium Display Guide

## 📋 Overview

คู่มือการแสดงผลสนามมวยในการ์ดแต่ละใบ

---

## 🏟️ Available Stadiums

### รายชื่อสนาม:

| Thai Name | English Name | Location |
|-----------|--------------|----------|
| ภูเก็ต | Phuket | Phuket Province |
| ลุมพินี | Lumpinee | Bangkok |
| ราชดำเนิน | Rajadamnern | Bangkok |
| ตะวันนา | Tawanna | Pattaya |

---

## 🎨 Display Design

### Stadium Badge:

```jsx
<div className="inline-flex items-center gap-2 px-4 py-2 
                bg-gradient-to-r from-orange-500/20 to-red-500/20 
                border border-orange-500/40 rounded-lg mb-3">
  <MapPin className="w-5 h-5 text-orange-400" />
  <span className="text-base md:text-lg font-black text-orange-300 uppercase tracking-wide">
    {language === 'th' ? fight.stadium.name : fight.stadium.name_en}
  </span>
</div>
```

### Visual Features:
- ✅ Orange/Red gradient background
- ✅ MapPin icon
- ✅ Bold uppercase text
- ✅ Bilingual support (TH/EN)
- ✅ Responsive sizing

---

## 📦 Data Structure

### Backend Format:

```json
{
  "stadium": {
    "name": "ลุมพินี",      // Thai name
    "name_en": "Lumpinee"   // English name
  }
}
```

### Extended Format (Optional):

```json
{
  "stadium": {
    "id": "lumpinee",
    "name": "ลุมพินี",
    "name_en": "Lumpinee",
    "location": "Bangkok",
    "capacity": 2000,
    "address": "6 Rama 4 Road, Bangkok",
    "phone": "+66 2 251 4303",
    "website": "https://lumpineestadium.com"
  }
}
```

---

## 🔧 Mock Data Implementation

### Current Implementation:

```javascript
stadium: weeklyFight.stadium || (() => {
  const stadiums = ['ภูเก็ต', 'ลุมพินี', 'ราชดำเนิน', 'ตะวันนา'];
  const stadiums_en = ['Phuket', 'Lumpinee', 'Rajadamnern', 'Tawanna'];
  const index = Math.floor(Math.random() * stadiums.length);
  
  return {
    name: stadiums[index],
    name_en: stadiums_en[index]
  };
})()
```

**Features:**
- Random stadium selection
- Synchronized Thai/English names
- Falls back to mock if no backend data

---

## 🎯 Display Examples

### Thai Language:

```
┌──────────────────────────┐
│ 📍 ลุมพินี              │
└──────────────────────────┘
```

### English Language:

```
┌──────────────────────────┐
│ 📍 LUMPINEE             │
└──────────────────────────┘
```

---

## 🌈 Color Scheme

### Badge Colors:
- **Background**: `from-orange-500/20 to-red-500/20`
- **Border**: `border-orange-500/40`
- **Icon**: `text-orange-400`
- **Text**: `text-orange-300`

### Hover Effects:
```jsx
hover:bg-orange-500/30
hover:border-orange-500/60
transition-all duration-300
```

---

## 📱 Responsive Design

### Mobile (< 640px):
```jsx
text-base       // 16px
px-3 py-1.5     // Smaller padding
```

### Desktop (≥ 768px):
```jsx
text-lg         // 18px
px-4 py-2       // Larger padding
```

---

## 🔄 Backend Integration

### API Response Example:

```json
{
  "weeklyFights": {
    "monday": {
      "title": "Championship Fight",
      "price": 1500,
      "time": "20:00",
      "stadium": {
        "name": "ลุมพินี",
        "name_en": "Lumpinee"
      }
    },
    "tuesday": {
      "title": "Fight Night",
      "price": 800,
      "time": "19:30",
      "stadium": {
        "name": "ราชดำเนิน",
        "name_en": "Rajadamnern"
      }
    }
  }
}
```

---

## ✅ Validation Rules

### Required Fields:
```javascript
{
  "stadium": {
    "name": "ลุมพินี",      // Required (Thai)
    "name_en": "Lumpinee"   // Required (English)
  }
}
```

### Validation:
```javascript
if (!stadium || !stadium.name || !stadium.name_en) {
  // Use default/mock stadium
  stadium = {
    name: 'ลุมพินี',
    name_en: 'Lumpinee'
  };
}
```

---

## 🎨 Full Card Layout

```
┌─────────────────────────────────────────────────┐
│ [DATE] │ [FIGHT INFO]            │ [PRICE]     │
│        │                         │             │
│  MON   │ Championship Fight      │ STARTING    │
│ 5 JAN  │                         │  FROM       │
│        │ 📍 ลุมพินี              │  ฿1,500     │
│        │                         │             │
│        │ 🔴 RED Fighter 1  VS    │ [BOOK NOW]  │
│        │ 🔵 BLUE Fighter 2       │             │
│        │                         │             │
│        │ 🕐 20:00  👥 150 SEATS  │             │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Future Enhancements

### Possible Features:
- [ ] Stadium logos/images
- [ ] Stadium capacity indicator
- [ ] Distance from user
- [ ] Weather forecast
- [ ] Parking availability
- [ ] Seat map preview
- [ ] Virtual tour link
- [ ] Reviews/ratings

---

## 💡 Usage Tips

### For Backend Developers:

1. **Always provide both names:**
   ```json
   {
     "name": "ลุมพินี",
     "name_en": "Lumpinee"
   }
   ```

2. **Consistent naming:**
   - Use standard stadium names
   - Keep English names capitalized
   - Thai names use proper Thai script

3. **Validation:**
   - Check stadium exists in list
   - Verify name_en matches name
   - Default to first stadium if invalid

### For Frontend:

1. **Language switching:**
   - Use `language === 'th'` to toggle
   - Show `stadium.name` for Thai
   - Show `stadium.name_en` for English

2. **Fallback:**
   ```javascript
   const stadiumName = language === 'th' 
     ? (fight.stadium?.name || 'ลุมพินี')
     : (fight.stadium?.name_en || 'Lumpinee');
   ```

---

**Created**: 2026-01-03  
**Version**: 1.0.0  
**Status**: Ready for Backend Implementation 🏟️

