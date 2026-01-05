/**
 * Convert a Date object to ISO date string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} ISO date string in format YYYY-MM-DD
 */
export const toISODate = (date) => {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

/**
 * Convert a Date object to local date string (YYYY-MM-DD)
 * Accounts for local timezone without UTC conversion
 * @param {Date} date - Date object
 * @returns {string} Local date string in format YYYY-MM-DD
 */
export const toDateOnlyLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Add days to a date string
 * @param {string} dateOnlyString - Date string in format YYYY-MM-DD
 * @param {number} days - Number of days to add
 * @returns {string} New date string in format YYYY-MM-DD
 */
export const addDaysLocal = (dateOnlyString, days) => {
  const [y, m, d] = dateOnlyString.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateOnlyLocal(dt);
};

/**
 * Add days to a Date object and return as ISO date string
 * @param {Date} date - Date object
 * @param {number} days - Number of days to add
 * @returns {string} ISO date string in format YYYY-MM-DD
 */
export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return toISODate(newDate);
};

/**
 * Get today's date as ISO date string
 * @returns {string} Today's date in format YYYY-MM-DD
 */
export const getTodayISODate = () => {
  return toISODate(new Date());
};

/**
 * Get yesterday's date as ISO date string
 * @returns {string} Yesterday's date in format YYYY-MM-DD
 */
export const getYesterdayISODate = () => {
  return addDays(new Date(), -1);
};
