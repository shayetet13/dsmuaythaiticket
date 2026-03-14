import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'

// Route-level code splitting - load only when user navigates (reduces initial bundle ~200KB+)
const AdminPage = lazy(() => import('./components/AdminPage.jsx'))
const SuccessPageStandalone = lazy(() => import('./components/SuccessPageStandalone.jsx'))
const BookingRedirect = lazy(() => import('./components/BookingRedirect.jsx'))
const StadiumSlugHandler = lazy(() => import('./components/StadiumSlugHandler.jsx'))
const EmailVerificationHandler = lazy(() => import('./components/EmailVerificationHandler.jsx'))
const MuayThaiTicketPage = lazy(() => import('./components/MuayThaiTicketPage.jsx'))
const ProvinceTicketPage = lazy(() => import('./components/ProvinceTicketPage.jsx'))

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
  </div>
)

// Defer CSS loading to avoid blocking FCP
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    import('./index.css');
  });
} else {
  requestAnimationFrame(() => {
    import('./index.css');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/success" element={<SuccessPageStandalone />} />
          <Route path="/admindashboard" element={<AdminPage />} />
          <Route path="/booking" element={<BookingRedirect />} />
          <Route path="/verify-email" element={<EmailVerificationHandler />} />
          <Route path="/muay-thai-ticket" element={<MuayThaiTicketPage />} />
          <Route path="/muaythai-ticket-bangkok" element={<ProvinceTicketPage province="bangkok" />} />
          <Route path="/muaythai-ticket-phuket" element={<ProvinceTicketPage province="phuket" />} />
          <Route path="/" element={<App />} />
          <Route path="/:stadiumSlug" element={<StadiumSlugHandler />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)

