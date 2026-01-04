import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db, { 
  initDatabase, 
  createBooking, 
  getAllBookings, 
  getBookingById,
  getRegularTickets,
  createRegularTicket,
  updateRegularTicket,
  deleteRegularTicket,
  getSpecialTickets,
  createSpecialTicket,
  updateSpecialTicket,
  deleteSpecialTicket,
  deductTicketQuantity
} from './database.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
let tickets = [
  { id: 'rajadamnern', name: 'Rajadamnern Stadium', location: 'Bangkok' },
  { id: 'lumpinee', name: 'Lumpinee Stadium', location: 'Bangkok' },
  { id: 'bangla', name: 'Bangla Boxing Stadium', location: 'Phuket' },
  { id: 'patong', name: 'Patong Stadium', location: 'Phuket' }
];

const zones = [
  { id: 'vip', name: 'VIP Ringside', price: 2500 },
  { id: 'club', name: 'Club Class', price: 1800 },
  { id: 'standard', name: 'Standard', price: 1200 }
];

// Helper function to get ticket config from database
const getTicketConfig = (stadiumId) => {
  const regularTickets = getRegularTickets(stadiumId);
  const specialTickets = getSpecialTickets(stadiumId);
  return {
    regularTickets: regularTickets || [],
    specialTickets: specialTickets || []
  };
};

// Routes

// Get all stadiums
app.get('/api/stadiums', (req, res) => {
  res.json(tickets);
});

// Get all zones
app.get('/api/zones', (req, res) => {
  res.json(zones);
});

// Create a booking
app.post('/api/bookings', (req, res) => {
  const { 
    stadium, 
    date, 
    zone, 
    ticketId,
    ticketType, // 'regular' or 'special'
    name, 
    email, 
    phone, 
    quantity, 
    totalPrice,
    paymentStartTime,
    paymentTime,
    paymentSlip,
    paymentDateTime,
    timeDiff
  } = req.body;

  // Validation - support both zone (legacy) and ticketId (new)
  if (!stadium || !date || !name || !email || !phone || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!zone && !ticketId) {
    return res.status(400).json({ error: 'Either zone or ticketId is required' });
  }

  let zoneData = null;
  if (zone) {
    zoneData = zones.find(z => z.id === zone);
    if (!zoneData) {
      return res.status(400).json({ error: 'Invalid zone' });
    }
  }

  const stadiumData = tickets.find(t => t.id === stadium);
  if (!stadiumData) {
    return res.status(400).json({ error: 'Invalid stadium' });
  }

  // Payment verification (if payment data is provided)
  let paymentStatus = 'pending';
  let paymentVerification = null;
  
  if (paymentStartTime && paymentTime && paymentSlip) {
    // Verify payment
    const startTime = new Date(paymentStartTime);
    const payTime = new Date(paymentDateTime);
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const paymentDate = new Date(payTime);
    paymentDate.setHours(0, 0, 0, 0);

    const timeDiffMinutes = parseFloat(timeDiff);
    const withinTimeLimit = timeDiffMinutes >= 0 && timeDiffMinutes <= 10;
    const correctDate = paymentDate.getTime() === bookingDate.getTime();
    const hasSlip = !!paymentSlip;

    paymentVerification = {
      withinTimeLimit,
      correctDate,
      hasSlip,
      timeDiff: timeDiffMinutes,
      paymentDateTime: paymentDateTime
    };

    // Payment is valid if all checks pass
    if (withinTimeLimit && correctDate && hasSlip) {
      paymentStatus = 'verified';
    } else {
      paymentStatus = 'failed';
    }
  }

  // Deduct ticket quantity if using ticketId and payment is verified
  if (ticketId && ticketType && paymentStatus === 'verified') {
    const requestedQuantity = parseInt(quantity);
    const success = deductTicketQuantity(stadium, ticketId, ticketType, requestedQuantity);
    
    if (!success) {
      return res.status(400).json({ error: 'Insufficient tickets available' });
    }
  }

  // Create booking
  const booking = {
    id: uuidv4(),
    stadium: stadiumData.name,
    stadiumId: stadium,
    date,
    zone: zoneData ? zoneData.name : null,
    zoneId: zone || null,
    ticketId: ticketId || null,
    ticketType: ticketType || null,
    name,
    email,
    phone,
    quantity: parseInt(quantity),
    totalPrice: parseInt(totalPrice),
    status: paymentStatus === 'verified' ? 'confirmed' : paymentStatus === 'failed' ? 'payment_failed' : 'pending_payment',
    bookingDate: new Date().toISOString(),
    ticketNumber: `MT${Date.now()}${Math.floor(Math.random() * 1000)}`,
    paymentStartTime: paymentStartTime || null,
    paymentTime: paymentTime || null,
    paymentSlip: paymentSlip || null,
    paymentVerification: paymentVerification
  };

  // Save to database
  createBooking(booking);

  // In a real application, you would:
  // - Save to database
  // - Send confirmation email
  // - Process payment
  // - Generate QR code

  res.status(201).json({
    message: paymentStatus === 'verified' 
      ? 'Booking confirmed successfully' 
      : paymentStatus === 'failed'
      ? 'Payment verification failed'
      : 'Booking created, payment pending',
    booking: {
      id: booking.id,
      ticketNumber: booking.ticketNumber,
      stadium: booking.stadium,
      date: booking.date,
      zone: booking.zone,
      quantity: booking.quantity,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentVerification: paymentVerification
    }
  });
});

// Get all bookings (for admin purposes)
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (err) {
    console.error('Error getting bookings:', err);
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', (req, res) => {
  try {
    const booking = getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error('Error getting booking:', err);
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

// Stadium Ticket Configuration Routes

// Get ticket configuration for a stadium
app.get('/api/stadiums/:stadiumId/tickets', (req, res) => {
  const { stadiumId } = req.params;
  console.log(`Getting ticket config for stadium: ${stadiumId}`);
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    console.error(`Stadium not found: ${stadiumId}`);
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  try {
    const config = getTicketConfig(stadiumId);
    console.log(`Returning config for ${stadiumId}:`, {
      regularTickets: config.regularTickets?.length || 0,
      specialTickets: config.specialTickets?.length || 0
    });
    res.json(config);
  } catch (err) {
    console.error('Error getting ticket config:', err);
    res.status(500).json({ error: 'Failed to retrieve ticket configuration' });
  }
});

// Add regular ticket to a stadium
app.post('/api/stadiums/:stadiumId/tickets/regular', (req, res) => {
  const { stadiumId } = req.params;
  const { name, price, quantity } = req.body;
  
  console.log(`Adding regular ticket to ${stadiumId}:`, { name, price, quantity });
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    console.error(`Stadium not found: ${stadiumId}`);
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  if (!name || !price) {
    console.error('Missing required fields:', { name, price });
    return res.status(400).json({ error: 'Name and price are required' });
  }
  
  try {
    const ticket = {
      id: uuidv4(),
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0
    };
    
    createRegularTicket(stadiumId, ticket);
    console.log(`Ticket added successfully to database for ${stadiumId}`);
    res.status(201).json({ message: 'Regular ticket added', ticket });
  } catch (err) {
    console.error('Error adding regular ticket:', err);
    res.status(500).json({ error: 'Failed to add regular ticket' });
  }
});

// Update regular ticket
app.put('/api/stadiums/:stadiumId/tickets/regular/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  const { name, price, quantity } = req.body;
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    
    const ticket = updateRegularTicket(stadiumId, ticketId, updates);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket updated', ticket });
  } catch (err) {
    console.error('Error updating regular ticket:', err);
    res.status(500).json({ error: 'Failed to update regular ticket' });
  }
});

// Delete regular ticket
app.delete('/api/stadiums/:stadiumId/tickets/regular/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  try {
    const result = deleteRegularTicket(stadiumId, ticketId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error('Error deleting regular ticket:', err);
    res.status(500).json({ error: 'Failed to delete regular ticket' });
  }
});

// Add special ticket to a stadium
app.post('/api/stadiums/:stadiumId/tickets/special', (req, res) => {
  const { stadiumId } = req.params;
  const { name, price, date, scheduleDays, quantity } = req.body;
  
  console.log(`Adding special ticket to ${stadiumId}:`, { name, price, date, quantity });
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    console.error(`Stadium not found: ${stadiumId}`);
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  if (!name || !price || !date) {
    console.error('Missing required fields:', { name, price, date });
    return res.status(400).json({ error: 'Name, price, and date are required' });
  }
  
  // Validate that the date matches the stadium's schedule days
  if (scheduleDays && Array.isArray(scheduleDays) && scheduleDays.length > 0) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    if (!scheduleDays.includes(dayOfWeek)) {
      console.error('Date does not match schedule days:', { date, dayOfWeek, scheduleDays });
      return res.status(400).json({ error: 'Special ticket date must match the stadium\'s fight schedule days' });
    }
  }
  
  try {
    const ticket = {
      id: uuidv4(),
      name,
      price: parseFloat(price),
      date,
      quantity: parseInt(quantity) || 0
    };
    
    createSpecialTicket(stadiumId, ticket);
    console.log(`Special ticket added successfully to database for ${stadiumId}`);
    res.status(201).json({ message: 'Special ticket added', ticket });
  } catch (err) {
    console.error('Error adding special ticket:', err);
    res.status(500).json({ error: 'Failed to add special ticket' });
  }
});

// Update special ticket
app.put('/api/stadiums/:stadiumId/tickets/special/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  const { name, price, date, scheduleDays, quantity } = req.body;
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  // Validate date if provided
  if (date && scheduleDays && Array.isArray(scheduleDays) && scheduleDays.length > 0) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    if (!scheduleDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: 'Special ticket date must match the stadium\'s fight schedule days' });
    }
  }
  
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (date !== undefined) updates.date = date;
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    
    const ticket = updateSpecialTicket(stadiumId, ticketId, updates);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Special ticket updated', ticket });
  } catch (err) {
    console.error('Error updating special ticket:', err);
    res.status(500).json({ error: 'Failed to update special ticket' });
  }
});

// Delete special ticket
app.delete('/api/stadiums/:stadiumId/tickets/special/:ticketId', (req, res) => {
  const { stadiumId, ticketId } = req.params;
  
  // Validate stadium exists
  const stadiumExists = tickets.find(t => t.id === stadiumId);
  if (!stadiumExists) {
    return res.status(404).json({ error: 'Stadium not found' });
  }
  
  try {
    const result = deleteSpecialTicket(stadiumId, ticketId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ message: 'Special ticket deleted' });
  } catch (err) {
    console.error('Error deleting special ticket:', err);
    res.status(500).json({ error: 'Failed to delete special ticket' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Muay Thai Ticket API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

