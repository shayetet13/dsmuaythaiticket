import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminPage from './components/AdminPage.jsx'
import SuccessPageStandalone from './components/SuccessPageStandalone.jsx'
import BookingPage from './components/BookingPage.jsx'
import EmailVerificationHandler from './components/EmailVerificationHandler.jsx'

// Defer CSS loading to avoid blocking FCP
// Load CSS after initial render for better performance
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    import('./index.css');
  });
} else {
  // If DOM is already loaded, defer CSS slightly
  requestAnimationFrame(() => {
    import('./index.css');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/success" element={<SuccessPageStandalone />} />
        <Route path="/admindashboard" element={<AdminPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/verify-email" element={<EmailVerificationHandler />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

