import { DateTime } from "luxon";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function isValidTimezone(zone: string): boolean {
  return DateTime.now().setZone(zone).isValid;
}

/** Date key (YYYY-MM-DD) for an instant in the business timezone. */
export function dateKeyInZone(iso: string | Date, zone: string): string {
  const dt =
    typeof iso === "string"
      ? DateTime.fromISO(iso, { setZone: true })
      : DateTime.fromJSDate(iso);
  return dt.setZone(zone).toISODate() ?? "";
}

/** Today's date key in a business timezone. */
export function todayKey(zone: string): string {
  return DateTime.now().setZone(zone).toISODate() ?? "";
}

export function addDaysToKey(dateKey: string, days: number): string {
  return (
    DateTime.fromISO(dateKey, { zone: "utc" })
      .plus({ days })
      .toISODate() ?? dateKey
  );
}

/** Human-readable time, e.g. "9:30 am", in the business timezone. */
export function formatTime(iso: string, zone: string): string {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(zone);
  if (!dt.isValid) return "";
  return dt.toFormat("h:mm a").toLowerCase();
}

/** "Sat, 10 Jan" in the business timezone. */
export function formatShortDate(iso: string, zone: string): string {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(zone);
  if (!dt.isValid) return "";
  return dt.toFormat("ccc, d LLL");
}

/** "Saturday, 10 January 2026" */
export function formatLongDate(iso: string, zone: string): string {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(zone);
  if (!dt.isValid) return "";
  return dt.toFormat("cccc, d LLLL yyyy");
}

export function formatDateKeyLong(dateKey: string, zone: string): string {
  const dt = DateTime.fromISO(dateKey, { zone });
  if (!dt.isValid) return dateKey;
  return dt.toFormat("cccc, d LLLL yyyy");
}

export function formatDayNumber(dateKey: string): string {
  return DateTime.fromISO(dateKey).toFormat("d");
}

export function formatMonthShort(dateKey: string): string {
  return DateTime.fromISO(dateKey).toFormat("LLL");
}

export function formatWeekdayShort(dateKey: string): string {
  return DateTime.fromISO(dateKey).toFormat("ccc");
}

/** Minutes from midnight -> "HH:mm" for local wall-clock construction. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = Math.round(minutes % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}

/** "09:30" or "09:30:00" -> minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export function weekdayForDateKey(dateKey: string): number {
  const dt = DateTime.fromISO(dateKey, { zone: "utc" });
  // Luxon: Monday = 1 ... Sunday = 7. Slotly stores Sunday = 0 ... Saturday = 6.
  return dt.weekday % 7;
}

export function formatDateRangeLabel(dateKey: string): string {
  return DateTime.fromISO(dateKey).toFormat("ccc, d LLL");
}
