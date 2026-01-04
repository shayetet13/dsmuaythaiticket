# FT Muay Thai Tickets - Online Booking System

เว็บไซต์ขายตั๋วมวยไทยออนไลน์ สำหรับสนามมวยชั้นนำในกรุงเทพและภูเก็ต

## 🚀 Quick Start

### Installation

```bash
# Install all dependencies (root, frontend, and backend)
npm run install:all
```

### Development

```bash
# Run both frontend and backend simultaneously
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Individual Commands

```bash
# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend
```

## 📁 Project Structure

```
mticket/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── App.jsx   # Main application component
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express.js backend API
│   ├── server.js     # Main server file
│   └── package.json
├── package.json       # Root package.json with scripts
└── README.md
```

## 🎯 Features

- ✅ Choose from 4 stadiums (Rajadamnern, Lumpinee, Bangla, Patong)
- ✅ Select date and zone (VIP, Club, Standard)
- ✅ Book multiple tickets
- ✅ Complete booking with customer information
- ✅ Real-time booking confirmation
- ✅ Responsive design (mobile-friendly)
- ✅ RESTful API backend

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- Axios (API calls)

### Backend
- Express.js
- CORS enabled
- UUID for booking IDs
- RESTful API

## 📝 API Endpoints

- `GET /api/health` - Health check
- `GET /api/stadiums` - Get all stadiums
- `GET /api/zones` - Get all zones
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID

## 🔧 Environment Variables

Create a `.env` file in the backend directory (optional):

```
PORT=5000
```

## 📦 Build for Production

```bash
npm run build
```

This will build the frontend for production in `frontend/dist/`

## 📄 License

ISC

