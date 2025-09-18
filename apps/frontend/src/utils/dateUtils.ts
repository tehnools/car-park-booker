// Utility functions for NZ date/time and slot logic

// Get NZ date string (YYYY-MM-DD) from UTC date string
export function getNZDateString(date: string) {
  if (!date) return "";
  const d = new Date(date + "T00:00:00+13:00");
  return d.toISOString().slice(0, 10);
}

// Get all 1-hour slots from 8am to 6pm
export function getDefaultTimeSlots() {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    slots.push(h.toString().padStart(2, "0") + ":00");
  }
  return slots;
}

// Get booked slots for a given date
export function getBookedSlots(date: string, bookings: { booking_date: string }[]) {
  if (!date) return [];
  const day = getNZDateString(date);
  return bookings
    .filter((b) => b.booking_date.startsWith(day))
    .map((b) => b.booking_date.slice(11, 16));
}

// Is today in NZ?
export function isNZToday(date: string) {
  if (!date) return false;
  const now = new Date();
  const nzOffset = 13 * 60; // NZDT
  const nowNZ = new Date(now.getTime() + (nzOffset - now.getTimezoneOffset()) * 60000);
  return nowNZ.toISOString().slice(0, 10) === date;
}

// Get current hour in NZ
export function getNZCurrentHour() {
  const now = new Date();
  const nzOffset = 13 * 60; // NZDT
  const nowNZ = new Date(now.getTime() + (nzOffset - now.getTimezoneOffset()) * 60000);
  return nowNZ.getHours();
}
