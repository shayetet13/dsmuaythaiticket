/**
 * Scheduler for Auto Ticket Generation
 * ตรวจสอบและสร้างตั๋วอัตโนมัติเมื่อเข้าสู่เดือนใหม่
 */

import { checkAndGenerateTickets } from '../services/autoTicketService.js';

// เก็บ timestamp การ generate ครั้งล่าสุด (in-memory)
const lastGeneratedDates = {};

/**
 * เริ่ม scheduled job ที่ตรวจสอบทุกชั่วโมง
 * @param {number} checkHour - Hour to check daily (default: 1 = 1 AM)
 */
export const startScheduler = (checkHour = 1) => {
  console.log(`[Scheduler] Starting auto ticket generation scheduler (check daily at ${checkHour}:00)`);
  
  // ตรวจสอบทุกชั่วโมง
  setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // ถ้าเป็นเวลา checkHour (เช่น 1 AM)
    if (currentHour === checkHour) {
      // ตรวจสอบและ generate สำหรับ RAJADAMNERN
      try {
        const stadiumId = 'rajadamnern';
        const lastGenDate = getLastGeneratedDate(stadiumId);
        const result = checkAndGenerateTickets(stadiumId, lastGenDate);
        
        if (result) {
          // มีการ generate แล้ว อัปเดต timestamp
          setLastGeneratedDate(stadiumId, new Date());
          console.log(`[Scheduler] Generated tickets for ${stadiumId}:`, {
            ticketsCreated: result.ticketsCreated,
            ticketsSkipped: result.ticketsSkipped,
            datesProcessed: result.datesProcessed
          });
        }
      } catch (err) {
        console.error('[Scheduler] Error in scheduled check:', err);
      }
    }
  }, 60 * 60 * 1000); // ตรวจสอบทุก 1 ชั่วโมง
};

/**
 * Manual check and generate tickets (if new month)
 * @param {string} stadiumId - Stadium ID
 * @returns {Object|null} Result object if generated, null otherwise
 */
export const manualCheck = (stadiumId) => {
  if (stadiumId !== 'rajadamnern') {
    return null;
  }
  
  const lastGenDate = getLastGeneratedDate(stadiumId);
  const result = checkAndGenerateTickets(stadiumId, lastGenDate);
  
  if (result) {
    // มีการ generate แล้ว อัปเดต timestamp
    setLastGeneratedDate(stadiumId, new Date());
  }
  
  return result;
};

/**
 * ดึง timestamp การ generate ครั้งล่าสุด
 * @param {string} stadiumId - Stadium ID
 * @returns {Date|null} Last generation date
 */
export const getLastGeneratedDate = (stadiumId) => {
  return lastGeneratedDates[stadiumId] || null;
};

/**
 * ตั้งค่า timestamp การ generate ครั้งล่าสุด
 * @param {string} stadiumId - Stadium ID
 * @param {Date} date - Generation date
 */
export const setLastGeneratedDate = (stadiumId, date) => {
  lastGeneratedDates[stadiumId] = date;
};
