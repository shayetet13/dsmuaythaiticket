/**
 * Ticket Service
 * Business logic for ticket management and availability
 */

import { getRegularTickets, getSpecialTickets, getTicketQuantityByDate, isTicketEnabledForDate, getTicketPriceForDate, getTicketNameForDate, getDiscountInfoForDate } from '../database.js';
import { parseDateString, getDayOfWeek, canPurchaseTicketsForDate } from '../utils/dateHelpers.js';
import { isValidDateFormat, isValidStadiumId } from '../utils/validators.js';

/**
 * Check if a date has available tickets
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} stadiumId - Stadium ID
 * @param {Object} ticketConfig - Ticket configuration
 * @returns {boolean} - True if tickets are available
 */
export const hasAvailableTickets = (dateString, stadiumId, ticketConfig) => {
  // Validate inputs
  if (!isValidDateFormat(dateString) || !isValidStadiumId(stadiumId)) {
    return false;
  }
  
  // Check if tickets can be purchased for this date (time restriction: 20:30 cutoff for today)
  if (!canPurchaseTicketsForDate(dateString)) {
    return false; // Cannot purchase tickets for today after 20:30 Thailand time
  }
  
  const date = parseDateString(dateString);
  const dayOfWeek = getDayOfWeek(dateString);
  
  // If ticket config doesn't exist yet (not loaded), assume tickets are available
  if (!ticketConfig) {
    return true;
  }
  
  // If ticket config exists but is empty, no tickets configured
  const hasNoTickets = (!ticketConfig.regularTickets || ticketConfig.regularTickets.length === 0) &&
                       (!ticketConfig.specialTickets || ticketConfig.specialTickets.length === 0);
  
  if (hasNoTickets) {
    return false; // No tickets configured = sold out
  }
  
  // Check regular tickets - must have days that include this day of week and quantity > 0
  const hasRegularTickets = ticketConfig.regularTickets && ticketConfig.regularTickets.length > 0
    && ticketConfig.regularTickets.some(ticket => {
      // Parse days if it's a string (JSON)
      let ticketDays = ticket.days;
      if (typeof ticketDays === 'string') {
        try {
          ticketDays = ticketDays ? JSON.parse(ticketDays) : null;
        } catch (e) {
          ticketDays = null;
        }
      }
      
      // If days is null or undefined, skip this ticket
      if (!ticketDays || !Array.isArray(ticketDays) || ticketDays.length === 0) {
        return false;
      }
      
      // Check if ticket has days array and it includes the selected day
      const hasMatchingDay = ticketDays.includes(dayOfWeek);
      // Check if ticket is enabled for this date
      const isEnabled = isTicketEnabledForDate(stadiumId, ticket.id, 'regular', dateString);
      // ใช้จำนวนตั๋วตามวัน (ถ้ามี) หรือใช้จำนวนจากตารางหลัก
      const quantityForDate = getTicketQuantityByDate(stadiumId, ticket.id, 'regular', dateString);
      const hasQuantity = quantityForDate > 0;
      
      return hasMatchingDay && hasQuantity && isEnabled;
    });
  
  // Check special tickets for this date - at least one must have quantity > 0
  const specialTicketsForDate = ticketConfig.specialTickets && ticketConfig.specialTickets.filter(ticket => {
    // Use parseDateString to ensure consistent date parsing (uses noon to avoid timezone issues)
    const ticketDate = parseDateString(ticket.date);
    return ticketDate.getTime() === date.getTime();
  }) || [];
  
  const hasSpecialTickets = specialTicketsForDate.length > 0
    && specialTicketsForDate.some(ticket => {
      const isEnabled = isTicketEnabledForDate(stadiumId, ticket.id, 'special', dateString);
      const quantityForDate = getTicketQuantityByDate(stadiumId, ticket.id, 'special', dateString);
      return quantityForDate > 0 && isEnabled;
    });
  
  // Return true if either regular or special tickets are available
  return hasRegularTickets || hasSpecialTickets;
};

/**
 * Get available tickets for a specific date
 * @param {string} stadiumId - Stadium ID
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Object} - Available regular and special tickets
 */
export const getAvailableTicketsForDate = (stadiumId, dateString) => {
  // Validate inputs
  if (!isValidDateFormat(dateString) || !isValidStadiumId(stadiumId)) {
    return {
      regularTickets: [],
      specialTickets: []
    };
  }
  
  // Check if tickets can be purchased for this date (time restriction: 20:30 cutoff for today)
  if (!canPurchaseTicketsForDate(dateString)) {
    return {
      regularTickets: [],
      specialTickets: []
    }; // Cannot purchase tickets for today after 20:30 Thailand time
  }
  
  const selectedDateObj = parseDateString(dateString);
  const dayOfWeek = getDayOfWeek(dateString);
  
  // Get all tickets
  const regularTickets = getRegularTickets(stadiumId) || [];
  const specialTickets = getSpecialTickets(stadiumId) || [];
  
  // Filter regular tickets by day of week and get quantity for this date
  const availableRegularTickets = regularTickets.map(ticket => {
    let ticketDays = ticket.days;
    if (typeof ticketDays === 'string') {
      try {
        ticketDays = ticketDays ? JSON.parse(ticketDays) : null;
      } catch (e) {
        ticketDays = null;
      }
    }
    
    if (!ticketDays || !Array.isArray(ticketDays) || ticketDays.length === 0) {
      return null;
    }
    
    if (!ticketDays.includes(dayOfWeek)) {
      return null;
    }
    
    // Check if ticket is enabled for this date
    const isEnabled = isTicketEnabledForDate(stadiumId, ticket.id, 'regular', dateString);
    if (!isEnabled) {
      return null;
    }
    
    // ใช้จำนวนตั๋วตามวัน (ถ้ามี) หรือใช้จำนวนจากตารางหลัก
    const quantityForDate = getTicketQuantityByDate(stadiumId, ticket.id, 'regular', dateString);
    
    if (quantityForDate <= 0) {
      return null;
    }
    
    // ใช้ราคาและชื่อที่ override สำหรับวันนี้ (ถ้ามี)
    const priceForDate = getTicketPriceForDate(stadiumId, ticket.id, 'regular', dateString, ticket.price);
    const nameForDate = getTicketNameForDate(stadiumId, ticket.id, 'regular', dateString, ticket.name);
    
    // Get discount info if available
    const discountInfo = getDiscountInfoForDate(stadiumId, ticket.id, 'regular', dateString, ticket.price);
    
    return {
      ...ticket,
      name: nameForDate, // ใช้ชื่อที่ override สำหรับวันนี้
      price: priceForDate, // ใช้ราคาที่ override สำหรับวันนี้
      quantity: quantityForDate, // ใช้จำนวนตั๋วตามวัน
      discountInfo: discountInfo.hasDiscount ? {
        hasDiscount: true,
        originalPrice: discountInfo.originalPrice,
        discountPrice: discountInfo.discountPrice,
        discountAmount: discountInfo.discountAmount
      } : null
    };
  }).filter(ticket => ticket !== null);

  // Filter special tickets for this date and get quantity for this date
  const availableSpecialTickets = specialTickets.map(ticket => {
    // Use parseDateString to ensure consistent date parsing (uses noon to avoid timezone issues)
    const ticketDate = parseDateString(ticket.date);
    
    if (ticketDate.getTime() !== selectedDateObj.getTime()) {
      return null;
    }
    
    // Check if ticket is enabled for this date
    const isEnabled = isTicketEnabledForDate(stadiumId, ticket.id, 'special', dateString);
    if (!isEnabled) {
      return null;
    }
    
    // ใช้จำนวนตั๋วตามวัน (ถ้ามี) หรือใช้จำนวนจากตารางหลัก
    const quantityForDate = getTicketQuantityByDate(stadiumId, ticket.id, 'special', dateString);
    
    if (quantityForDate <= 0) {
      return null;
    }
    
    // ใช้ราคาและชื่อที่ override สำหรับวันนี้ (ถ้ามี)
    const priceForDate = getTicketPriceForDate(stadiumId, ticket.id, 'special', dateString, ticket.price);
    const nameForDate = getTicketNameForDate(stadiumId, ticket.id, 'special', dateString, ticket.name);
    
    // Get discount info if available
    const discountInfo = getDiscountInfoForDate(stadiumId, ticket.id, 'special', dateString, ticket.price);
    
    return {
      ...ticket,
      name: nameForDate, // ใช้ชื่อที่ override สำหรับวันนี้
      price: priceForDate, // ใช้ราคาที่ override สำหรับวันนี้
      quantity: quantityForDate, // ใช้จำนวนตั๋วตามวัน
      discountInfo: discountInfo.hasDiscount ? {
        hasDiscount: true,
        originalPrice: discountInfo.originalPrice,
        discountPrice: discountInfo.discountPrice,
        discountAmount: discountInfo.discountAmount
      } : null
    };
  }).filter(ticket => ticket !== null);

  return {
    regularTickets: availableRegularTickets,
    specialTickets: availableSpecialTickets
  };
};

/**
 * Get ticket configuration for a stadium
 * @param {string} stadiumId - Stadium ID
 * @returns {Object} - Ticket configuration
 */
export const getTicketConfig = (stadiumId) => {
  const regularTickets = getRegularTickets(stadiumId);
  const specialTickets = getSpecialTickets(stadiumId);
  return {
    regularTickets: regularTickets || [],
    specialTickets: specialTickets || []
  };
};

