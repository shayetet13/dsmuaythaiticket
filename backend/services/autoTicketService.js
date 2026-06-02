/**
 * Auto Ticket Generation Service for RAJADAMNERN STADIUM
 * สร้าง special tickets อัตโนมัติสำหรับทุกวันในเดือนถัดไป
 */

import { v4 as uuidv4 } from 'uuid';
import { getTicketsForDate, createSpecialTicket, updateTicketForDate } from '../database.js';

/**
 * Template ตั๋วสำหรับ RAJADAMNERN STADIUM (เรียงจากแพงสุดไปต่ำสุด)
 */
export const RAJADAMNERN_TICKET_TEMPLATES = [
  { name: 'FAMILY SUITE', price: 22500, quantity: 1 },
  { name: 'VIP LOUNGE - PANORAMIC BALCONY', price: 10000, quantity: 1 },
  { name: 'VIP LOUNGE - COUPLE SUITE', price: 9000, quantity: 1 },
  { name: 'PRESIDENTIAL BOX SEAT', price: 3500, quantity: 1 },
  { name: 'RINGSIDE', price: 2500, quantity: 2 },
  { name: 'CLUB CLASS', price: 1800, quantity: 20 },
  { name: 'LEO SECTION', price: 1500, quantity: 20 },
  { name: '3RD CLASS', price: 1000, quantity: 50 }
];

/**
 * คำนวณวันที่ทั้งหมดในเดือนถัดไป
 * @returns {Array<string>} Array ของวันที่ในรูปแบบ YYYY-MM-DD
 */
export const getNextMonthDates = () => {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth();
  
  // คำนวณจำนวนวันในเดือนถัดไป
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dates.push(dateStr);
  }
  
  return dates;
};

/**
 * ดึงรายชื่อตั๋วที่มีอยู่แล้วสำหรับวันที่ระบุ
 * @param {string} stadiumId - Stadium ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Object with names Set, ticketIds Set, and total count (unique by ID)
 */
export const getExistingTicketNames = (stadiumId, date) => {
  try {
    const tickets = getTicketsForDate(stadiumId, date);
    const names = new Set();
    const ticketIds = new Set(); // Track ticket IDs to prevent duplicates
    let totalCount = 0;
    
    // รวมชื่อจาก regular tickets (ตรวจสอบ ID เพื่อป้องกันซ้ำ)
    if (tickets.regularTickets) {
      tickets.regularTickets.forEach(ticket => {
        if (ticket.id && !ticketIds.has(ticket.id)) {
          ticketIds.add(ticket.id);
          if (ticket.name) {
            names.add(ticket.name.trim());
          }
          totalCount++;
        }
      });
    }
    
    // รวมชื่อจาก special tickets (ตรวจสอบ ID เพื่อป้องกันซ้ำ)
    if (tickets.specialTickets) {
      tickets.specialTickets.forEach(ticket => {
        if (ticket.id && !ticketIds.has(ticket.id)) {
          ticketIds.add(ticket.id);
          if (ticket.name) {
            names.add(ticket.name.trim());
          }
          totalCount++;
        }
      });
    }
    
    return { names, ticketIds, totalCount };
  } catch (err) {
    console.error(`[getExistingTicketNames] Error getting tickets for ${stadiumId} on ${date}:`, err);
    return { names: new Set(), ticketIds: new Set(), totalCount: 0 };
  }
};

/**
 * สร้าง special tickets สำหรับทุกวันในเดือนถัดไป
 * จำกัดการ gen แค่ 8 tickets ต่อวัน และป้องกันการ gen ซ้ำ
 * @param {string} stadiumId - Stadium ID (must be 'rajadamnern')
 * @returns {Object} Result object with details of generated tickets
 */
export const generateNextMonthTickets = (stadiumId) => {
  if (stadiumId !== 'rajadamnern') {
    throw new Error('Auto ticket generation is only supported for RAJADAMNERN STADIUM');
  }
  
  const MAX_TICKETS_PER_DAY = 8; // จำกัด 8 tickets ต่อวัน
  
  const results = {
    ticketsCreated: 0,
    ticketsSkipped: 0,
    datesProcessed: 0,
    datesSkipped: 0,
    errors: [],
    dateDetails: []
  };
  
  try {
    // คำนวณวันที่ทั้งหมดในเดือนถัดไป
    const nextMonthDates = getNextMonthDates();
    
    // สำหรับแต่ละวันในเดือนถัดไป
    for (const date of nextMonthDates) {
      const dateResult = {
        date,
        ticketsCreated: 0,
        ticketsSkipped: 0,
        createdTicketNames: [],
        skippedTicketNames: [],
        reason: ''
      };
      
      try {
        // ดึงรายชื่อตั๋วที่มีอยู่แล้วสำหรับวันนี้
        const { names: existingNames, totalCount: existingCount } = getExistingTicketNames(stadiumId, date);
        
        // ตรวจสอบว่ามี tickets ครบ 8 ตัวแล้วหรือยัง
        if (existingCount >= MAX_TICKETS_PER_DAY) {
          // มีครบ 8 ตัวแล้ว ข้ามวันนี้
          results.datesSkipped++;
          dateResult.reason = `Already has ${existingCount} tickets (max: ${MAX_TICKETS_PER_DAY})`;
          results.dateDetails.push(dateResult);
          continue;
        }
        
        // คำนวณจำนวน tickets ที่ต้อง gen เพิ่ม
        const ticketsNeeded = MAX_TICKETS_PER_DAY - existingCount;
        
        // สำหรับแต่ละ template ticket (เรียงตามลำดับใน template)
        for (const template of RAJADAMNERN_TICKET_TEMPLATES) {
          // ถ้า gen ครบจำนวนที่ต้องการแล้ว ให้หยุด
          if (dateResult.ticketsCreated >= ticketsNeeded) {
            break;
          }
          
          const ticketName = template.name.trim();
          
          // ตรวจสอบว่ามีตั๋วชื่อเดียวกันอยู่แล้วหรือไม่ (ป้องกันการ gen ซ้ำ)
          if (existingNames.has(ticketName)) {
            // มีอยู่แล้ว ข้าม
            results.ticketsSkipped++;
            dateResult.ticketsSkipped++;
            dateResult.skippedTicketNames.push(ticketName);
            continue;
          }
          
          // ยังไม่มี สร้าง special ticket
          try {
            const ticketId = uuidv4();
            
            // สร้าง special ticket
            createSpecialTicket(stadiumId, {
              id: ticketId,
              name: template.name,
              price: template.price,
              quantity: template.quantity,
              date: date,
              image: null
            });
            
            // ตั้งค่า enabled = false ใน ticket_quantities_by_date
            // หมายเหตุ: special tickets ที่สร้างจะมีสถานะ disabled ตามค่าเริ่มต้น
            // (ไม่แสดงในหน้าขายตั๋วปกติ) แต่ admin สามารถเปิดได้ในหน้า "การปรับตั๋วรายวัน"
            updateTicketForDate(stadiumId, ticketId, 'special', date, {
              enabled: false
            });
            
            results.ticketsCreated++;
            dateResult.ticketsCreated++;
            dateResult.createdTicketNames.push(ticketName);
            
            // เพิ่มชื่อลงใน existing names เพื่อไม่ให้สร้างซ้ำในวันเดียวกัน
            existingNames.add(ticketName);
          } catch (err) {
            console.error(`[generateNextMonthTickets] Error creating ticket ${template.name} for ${date}:`, err);
            results.errors.push({
              date,
              ticketName: template.name,
              error: err.message
            });
          }
        }
        
        results.datesProcessed++;
        if (dateResult.ticketsCreated > 0 || dateResult.reason) {
          results.dateDetails.push(dateResult);
        }
      } catch (err) {
        console.error(`[generateNextMonthTickets] Error processing date ${date}:`, err);
        results.errors.push({
          date,
          error: err.message
        });
      }
    }
    
  } catch (err) {
    console.error(`[generateNextMonthTickets] Error generating tickets:`, err);
    results.errors.push({
      error: err.message
    });
  }
  
  return results;
};

/**
 * ตรวจสอบว่าเป็นเดือนใหม่หรือยัง และ generate ถ้าจำเป็น
 * @param {string} stadiumId - Stadium ID
 * @param {Date} lastGeneratedDate - Last generation date
 * @returns {Object|null} Result object if generated, null otherwise
 */
export const checkAndGenerateTickets = (stadiumId, lastGeneratedDate) => {
  if (stadiumId !== 'rajadamnern') {
    return null;
  }
  
  // ตรวจสอบว่าเป็นเดือนใหม่หรือยัง
  if (!isNewMonth(lastGeneratedDate)) {
    return null;
  }
  
  // เป็นเดือนใหม่ generate tickets
  return generateNextMonthTickets(stadiumId);
};

/**
 * ตรวจสอบว่าเป็นเดือนใหม่หรือยัง
 * @param {Date} lastGeneratedDate - Last generation date
 * @returns {boolean} True if new month
 */
function isNewMonth(lastGeneratedDate) {
  if (!lastGeneratedDate) return true;
  
  const today = new Date();
  const lastGen = new Date(lastGeneratedDate);
  
  return today.getMonth() !== lastGen.getMonth() || 
         today.getFullYear() !== lastGen.getFullYear();
}

/**
 * Get ticket templates
 * @returns {Array} Array of ticket templates
 */
export const getTicketTemplates = () => {
  return RAJADAMNERN_TICKET_TEMPLATES.map(t => ({ ...t }));
};
