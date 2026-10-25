import { Language } from "../context/LanguageContext";

/**
 * Returns the user's current local calendar date formatted for the dashboard header.
 * E.g. "Friday, 23 Oct" in English, or "शुक्रवार, 23 अक्तूबर" in Hindi.
 * Uses local client timezone, never UTC offset.
 */
export function getTodayLocalCalendarDate(lang: Language = "en"): string {
  const now = new Date();
  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    return formatter.format(now);
  } catch {
    // Graceful fallback
    const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysHi = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    const monthsHi = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

    const dayName = (lang === "hi" ? daysHi : daysEn)[now.getDay()];
    const monthName = (lang === "hi" ? monthsHi : monthsEn)[now.getMonth()];
    const dateNum = now.getDate();

    return `${dayName}, ${dateNum} ${monthName}`;
  }
}

/**
 * Safely parses a date string without UTC timezone shift.
 * If given "YYYY-MM-DD", it parses the numeric components directly into the local timezone,
 * preventing standard JavaScript new Date("YYYY-MM-DD") from interpreting it as UTC 00:00:00
 * and rolling back to the previous day in negative UTC offset timezones.
 */
export function parseLocalDateSafe(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date();

  // If format is YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1; // 0-based month
    const day = parseInt(match[3], 10);
    return new Date(year, monthIndex, day, 12, 0, 0); // Noon prevents any edge rollover
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a date string or Date object into a readable localized date format.
 * E.g., "14 Oct 2026" or "14 अक्तूबर 2026".
 */
export function formatReportDateSafe(dateInput: string | Date | undefined, lang: Language = "en"): string {
  if (!dateInput) return "";

  const d = typeof dateInput === "string" ? parseLocalDateSafe(dateInput) : dateInput;
  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
