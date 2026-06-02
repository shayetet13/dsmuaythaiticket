/**
 * Price Calculation Service
 * Business logic for calculating ticket prices
 * CRITICAL: Price calculation MUST be done server-side to prevent tampering
 */

import { getRegularTickets, getSpecialTickets, getTicketPriceForDate, getTicketQuantityByDate } from '../database.js';

/**
 * Calculate total price for a booking
 * @param {Object} bookingData - { stadiumId, ticketId, ticketType, quantity, date? }
 * @returns {Object} - { success: boolean, totalPrice: number, ticket: Object, error?: string }
 */
export const calculateBookingPrice = (bookingData) => {
  try {
    const { stadiumId, ticketId, ticketType, quantity, date } = bookingData;

    // Validate inputs
    if (!stadiumId || !ticketId || !ticketType || !quantity) {
      return {
        success: false,
        error: 'Missing required fields: stadiumId, ticketId, ticketType, quantity'
      };
    }

    if (quantity <= 0 || !Number.isInteger(Number(quantity))) {
      return {
        success: false,
        error: 'Quantity must be a positive integer'
      };
    }

    // Get ticket from database
    let ticket = null;
    
    if (ticketType === 'regular') {
      const regularTickets = getRegularTickets(stadiumId);
      ticket = regularTickets?.find(t => t.id === ticketId);
    } else if (ticketType === 'special') {
      const specialTickets = getSpecialTickets(stadiumId);
      ticket = specialTickets?.find(t => t.id === ticketId);
    } else {
      return {
        success: false,
        error: 'Invalid ticket type. Must be "regular" or "special"'
      };
    }

    // Validate ticket exists
    if (!ticket) {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }

    // ✅ Get price for specific date if date is provided (for daily ticket adjustments)
    let unitPrice = parseFloat(ticket.price);
    if (date) {
      // Clean date string (remove any trailing characters)
      const cleanDate = date.split(':')[0].trim();
      // Validate date format
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        const priceForDate = getTicketPriceForDate(stadiumId, ticketId, ticketType, cleanDate, ticket.price);
        unitPrice = parseFloat(priceForDate);
        console.log('[PriceCalculation] Using date-specific price:', {
          date: cleanDate,
          originalPrice: ticket.price,
          datePrice: priceForDate,
          ticketId: ticketId
        });
      }
    }

    // Check availability - use date-specific quantity if date is provided
    let availableQuantity = ticket.quantity;
    if (date) {
      const cleanDate = date.split(':')[0].trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        const quantityForDate = getTicketQuantityByDate(stadiumId, ticketId, ticketType, cleanDate);
        availableQuantity = quantityForDate;
        console.log('[PriceCalculation] Using date-specific quantity:', {
          date: cleanDate,
          originalQuantity: ticket.quantity,
          dateQuantity: quantityForDate,
          ticketId: ticketId
        });
      }
    }

    if (!availableQuantity || availableQuantity < quantity) {
      return {
        success: false,
        error: 'Insufficient ticket quantity available'
      };
    }

    // Calculate total price
    const totalPrice = unitPrice * parseInt(quantity);

    return {
      success: true,
      totalPrice: totalPrice,
      unitPrice: unitPrice,
      quantity: parseInt(quantity),
      ticket: {
        id: ticket.id,
        name: ticket.name,
        price: unitPrice,
        type: ticketType,
        stadiumId: stadiumId
      }
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    return {
      success: false,
      error: 'Failed to calculate price: ' + error.message
    };
  }
};

/**
 * Legacy support: Calculate price from selectedZone
 * @deprecated Use calculateBookingPrice instead
 */
export const calculateLegacyPrice = (selectedZone, quantity, zones) => {
  try {
    const selectedZoneData = zones.find(z => z.id === selectedZone);
    if (!selectedZoneData) {
      return {
        success: false,
        error: 'Zone not found'
      };
    }

    const totalPrice = selectedZoneData.price * quantity;
    
    return {
      success: true,
      totalPrice: totalPrice,
      unitPrice: selectedZoneData.price,
      quantity: quantity
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate legacy price: ' + error.message
    };
  }
};

