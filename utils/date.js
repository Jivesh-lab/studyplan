export const toDateOnlyLocal = (date) => {
const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, '0');
const d = String(date.getDate()).padStart(2, '0');
return `${y}-${m}-${d}`;
};
export const addDaysLocal = (dateOnlyString, days) => {
const [y, m, d] = dateOnlyString.split('-').map(Number);
const dt = new Date(y, m - 1, d); // local midnight
dt.setDate(dt.getDate() + days);
return toDateOnlyLocal(dt);
};

// Add missing addDays function - works with Date objects or ISO strings
export const addDays = (date, days) => {
  if (typeof date === 'string') {
    // If it's an ISO date string, convert to Date object
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } else if (date instanceof Date) {
    // If it's a Date object, return ISO string
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  return date;
};

export const toISODate = (date) => {
  return date.toISOString().split('T')[0];
};

export const getTodayISODate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getYesterdayISODate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};