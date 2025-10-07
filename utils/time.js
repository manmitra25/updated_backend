// src/utils/time.js
export const SESSION_MINUTES = 45;

export function toUtcDateOnly(yyyyMmDd) {
  const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
  if (!y || !m || !d) throw new Error("Invalid date format");
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

// "10:00 AM" -> minutes since midnight
export function parse12hToMinutes(timeLabel) {
  const m = String(timeLabel).trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) throw new Error("Invalid time (expect e.g. 10:00 AM)");
  let [_, hh, mm, ap] = m;
  let h = parseInt(hh, 10);
  const mins = parseInt(mm, 10);
  if (ap.toUpperCase() === "PM" && h !== 12) h += 12;
  if (ap.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + mins;
}

export function sameUtcDay(a, b) {
  const A = new Date(a), B = new Date(b);
  return (
    A.getUTCFullYear() === B.getUTCFullYear() &&
    A.getUTCMonth() === B.getUTCMonth() &&
    A.getUTCDate() === B.getUTCDate()
  );
}
