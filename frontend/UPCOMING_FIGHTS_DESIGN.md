# 🎨 Upcoming Fights Section - Design Documentation

## 📋 Overview

ออกแบบใหม่สำหรับ **Upcoming Fights Section** ให้สวยงาม ทันสมัย และใช้งานง่ายขึ้น

---

## 🎯 Design Goals

1. ✅ **Modern Card-Based Layout** - แต่ละวันเป็น card แยกกัน
2. ✅ **Visual Hierarchy** - แสดงข้อมูลชัดเจน
3. ✅ **Interactive Elements** - Hover effects และ animations
4. ✅ **Responsive Design** - ใช้งานได้ดีทุกขนาดหน้าจอ
5. ✅ **Color-Coded Days** - แต่ละวันมีสีเฉพาะ
6. ✅ **Quick Actions** - คลิกเพื่อจองตั๋วได้ทันที

---

## 🎨 Design Features

### 1. **Card Layout**
- แต่ละวันเป็น card แยกกัน
- Grid layout: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop) → 7 columns (xl)
- Card มี border และ background gradient
- Hover effect: scale up และ lift up

### 2. **Color Scheme**
แต่ละวันมีสีเฉพาะ:

| Day | Color | Icon | Border |
|-----|-------|------|--------|
| Monday | Blue | 🥊 | Blue-500 |
| Tuesday | Purple | 💪 | Purple-500 |
| Wednesday | Yellow | 🔥 | Yellow-500 |
| Thursday | Green | ⚡ | Green-500 |
| Friday | Orange | 👊 | Orange-500 |
| Saturday | Red | 🏆 | Red-500 |
| Sunday | Pink | ⭐ | Pink-500 |

### 3. **Visual Elements**

#### Header:
- Sparkles icons ทั้งสองข้าง
- Gradient text (yellow-400 → yellow-600)
- Subtitle ด้านล่าง

#### Card Content:
- **Day Header**: Icon + Day label + Date
- **Status Indicator**: Green dot (มี fight) / ไม่มี (ไม่มี fight)
- **Time**: Clock icon + "8:00 PM"
- **Stadium Logos**: แสดง logo สนามมวย (max 3)
- **Action Button**: "Book Tickets" พร้อม icons

#### Background:
- Animated pattern overlay
- Image background (ถ้ามี)
- Gradient overlay ตามสีของวัน

### 4. **Interactive Features**

#### Hover Effects:
- Card scale up (105%)
- Lift up (-translate-y-2)
- Border opacity เพิ่มขึ้น
- Background image opacity เพิ่มขึ้น
- Glow effect รอบ card

#### Click Actions:
- คลิก card → Scroll to booking section
- คลิก "Book Tickets" button → Scroll to booking section

### 5. **Info Banner**
- แสดงที่ด้านล่าง
- Calendar icon
- "Book in Advance" message
- "Book Now" button

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
grid-cols-1          /* 1 column */

/* Tablet (md) */
md:grid-cols-2       /* 2 columns */

/* Desktop (lg) */
lg:grid-cols-3       /* 3 columns */

/* XL Desktop */
xl:grid-cols-7       /* 7 columns (1 per day) */
```

---

## 🎭 Animations

### Entrance Animation:
- แต่ละ card มี delay เพิ่มขึ้น (50ms per card)
- ใช้ `AnimatedItem` component

### Hover Animation:
- Scale: `hover:scale-105`
- Translate: `hover:-translate-y-2`
- Duration: `duration-300`
- Transition: `transition-all`

### Glow Effect:
- แสดงเมื่อ hover
- ใช้ blur-xl และ opacity-50
- สีตามวัน

---

## 📊 Component Structure

```jsx
<UpcomingFightsSection>
  ├── Background Pattern (animated)
  ├── Header Section
  │   ├── Sparkles Icons
  │   ├── Title (gradient text)
  │   └── Subtitle
  ├── Weekly Schedule Grid
  │   └── Day Cards (7 cards)
  │       ├── Day Header
  │       │   ├── Icon
  │       │   ├── Day Label
  │       │   ├── Date
  │       │   └── Status Indicator
  │       ├── Time Info
  │       ├── Stadium Logos
  │       └── Action Button
  └── Info Banner
      ├── Calendar Icon
      ├── Message
      └── Book Now Button
```

---

## 🔧 Props

```typescript
interface UpcomingFightsSectionProps {
  weeklyFights: {
    monday: { image?: string, logos?: string[] },
    tuesday: { image?: string, logos?: string[] },
    // ... rest of days
  },
  language: 'en' | 'th',
  stadiums: Array<{
    id: string,
    name: string,
    logoBase64?: string
  }>,
  t: TranslationObject,
  onBookClick?: () => void
}
```

---

## 🎨 Color Palette

### Day Colors:
```javascript
monday: {
  color: 'from-blue-600 to-blue-800',
  borderColor: 'border-blue-500',
  bgColor: 'bg-blue-600/10',
  textColor: 'text-blue-400'
}
// ... similar for other days
```

### Background:
- Section: `bg-gradient-to-b from-gray-900 via-black to-gray-900`
- Pattern: White SVG pattern with opacity-10
- Cards: Gradient overlay based on day color

---

## 📐 Spacing & Sizing

### Card Dimensions:
- Min Height: `min-h-[280px]` (mobile) → `min-h-[320px]` (desktop)
- Padding: `p-4` (mobile) → `p-6` (desktop)
- Gap: `gap-4` (mobile) → `gap-6` (desktop)

### Typography:
- Title: `text-4xl` → `text-7xl`
- Day Label: `text-xl` → `text-3xl`
- Button: `text-sm` → `text-base`

---

## 🚀 Features

### ✅ Implemented:
1. ✅ Card-based layout
2. ✅ Color-coded days
3. ✅ Hover effects
4. ✅ Stadium logos display
5. ✅ Date calculation (next occurrence)
6. ✅ Status indicators
7. ✅ Action buttons
8. ✅ Info banner
9. ✅ Responsive design
10. ✅ Animations

### 🔮 Future Enhancements:
- [ ] Filter by stadium
- [ ] Sort by date
- [ ] Show fight details modal
- [ ] Add to calendar
- [ ] Share fight schedule
- [ ] Price display
- [ ] Availability status

---

## 📝 Code Example

```jsx
<UpcomingFightsSection
  weeklyFights={weeklyFights}
  language={language}
  stadiums={stadiums}
  t={t}
  onBookClick={() => {
    document.getElementById('booking')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }}
/>
```

---

## 🎯 User Experience

### Mobile:
- Cards stack vertically
- Touch-friendly buttons
- Clear visual hierarchy
- Easy scrolling

### Desktop:
- Cards in grid layout
- Hover effects for interactivity
- Quick access to booking
- Visual feedback on interactions

---

## 🔍 Accessibility

- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ High contrast colors
- ✅ Focus indicators

---

## 📊 Performance

- ✅ Lazy loading images
- ✅ Optimized animations
- ✅ Efficient re-renders
- ✅ CSS transitions (GPU accelerated)

---

## 🎨 Design Inspiration

- **Card Design**: Modern dashboard cards
- **Color Coding**: Calendar applications
- **Hover Effects**: E-commerce product cards
- **Layout**: Weekly calendar views

---

## 📸 Visual Mockup

### Mobile View:
```
┌─────────────────┐
│   MONDAY CARD   │
├─────────────────┤
│   TUESDAY CARD  │
├─────────────────┤
│  WEDNESDAY CARD │
└─────────────────┘
```

### Desktop View (3 columns):
```
┌──────┬──────┬──────┐
│ MON  │ TUE  │ WED  │
├──────┼──────┼──────┤
│ THU  │ FRI  │ SAT  │
├──────┴──────┴──────┤
│      SUN           │
└────────────────────┘
```

### XL Desktop View (7 columns):
```
┌──┬──┬──┬──┬──┬──┬──┐
│M │T │W │T │F │S │S │
│O │U │E │H │R │A │U │
│N │E │D │U │I │T │N │
└──┴──┴──┴──┴──┴──┴──┘
```

---

## ✅ Testing Checklist

- [x] Mobile responsive
- [x] Tablet responsive
- [x] Desktop responsive
- [x] Hover effects work
- [x] Click actions work
- [x] Animations smooth
- [x] Colors correct
- [x] Logos display
- [x] Date calculation correct
- [x] Translations work

---

## 📚 Related Files

- `components/UpcomingFightsSection.jsx` - Main component
- `components/AnimatedItem.jsx` - Animation wrapper
- `components/AnimatedSection.jsx` - Section animation
- `constants/translations.js` - Translations
- `App.jsx` - Parent component

---

**สร้างเมื่อ:** 3 มกราคม 2026  
**Version:** 2.0.0  
**Designer:** AI Assistant  
**Status:** ✅ Complete

