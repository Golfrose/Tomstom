// utils/date.js
// Date helper functions used by report and compare modules.

/**
 * Determine whether two dates fall on the same calendar day. Accepts
 * either Date objects or parseable date strings. Returns a boolean.
 * @param {Date|string} date1
 * @param {Date|string} date2
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format a date string in Thai locale with full month names. If the
 * provided value is falsy, returns an empty string.
 * @param {string} dateStr
 */
export function formatDateThai(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('th-TH', options);
}
