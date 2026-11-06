import { DateTime } from "luxon";
import type { BusyInterval, TimeSlot } from "@/lib/types";
import {
  minutesToTime,
  timeToMinutes,
  weekdayForDateKey,
} from "@/lib/booking/time";

export interface AvailabilityRuleInput {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface BreakInput {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface ExceptionInput {
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_unavailable: boolean;
}

export interface GenerateSlotsInput {
  date: string;
  timezone: string;
  durationMinutes: number;
  bufferMinutes: number;
  rules: AvailabilityRuleInput[];
  breaks?: BreakInput[];
  exceptions?: ExceptionInput[];
  busy?: BusyInterval[];
  /** Defaults to the current instant. Slots starting in the past are removed. */
  now?: Date;
}

interface MinuteRange {
  start: number;
  end: number;
}

/**
 * Build one-time luxon value from a local date and wall-clock time.
 * Returns null for times that do not exist (DST spring-forward gap).
 */
function zonedAt(dateKey: string, time: string, zone: string): DateTime | null {
  const dt = DateTime.fromISO(`${dateKey}T${time}`, { zone, setZone: true });
  if (!dt.isValid) return null;
  // Luxon normalises nonexistent wall times forward; detect and drop them.
  if (dt.hour !== Number(time.slice(0, 2)) || dt.minute !== Number(time.slice(3, 5))) {
    return null;
  }
  return dt;
}

function sortRanges(ranges: MinuteRange[]): MinuteRange[] {
  return [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
}

function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
  const sorted = sortRanges(ranges);
  const merged: MinuteRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

function subtractRanges(
  base: MinuteRange[],
  blocks: MinuteRange[],
): MinuteRange[] {
  let result = sortRanges(base).map((range) => ({ ...range }));
  for (const block of mergeRanges(blocks)) {
    const next: MinuteRange[] = [];
    for (const range of result) {
      if (block.end <= range.start || block.start >= range.end) {
        next.push(range);
        continue;
      }
      if (block.start > range.start) {
        next.push({ start: range.start, end: Math.min(block.start, range.end) });
      }
      if (block.end < range.end) {
        next.push({ start: Math.max(block.end, range.start), end: range.end });
      }
    }
    result = next;
  }
  return result.filter((range) => range.end > range.start);
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function generateSlots(input: GenerateSlotsInput): TimeSlot[] {
  const {
    date,
    timezone,
    durationMinutes,
    bufferMinutes,
    rules,
    breaks = [],
    exceptions = [],
    busy = [],
    now = new Date(),
  } = input;

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return [];
  if (!DateTime.fromISO(date, { zone: "utc" }).isValid) return [];

  const nowMs = now.getTime();
  const dayExceptions = exceptions.filter((item) => item.date === date);
  const weekday = weekdayForDateKey(date);

  const closedAllDay = dayExceptions.some(
    (item) => item.is_unavailable && !item.start_time && !item.end_time,
  );
  if (closedAllDay) return [];

  const specialWindows = dayExceptions.filter(
    (item) => !item.is_unavailable && item.start_time && item.end_time,
  );
  const blockedWindows = dayExceptions
    .filter((item) => item.is_unavailable && item.start_time && item.end_time)
    .map((item) => ({
      start: timeToMinutes(item.start_time as string),
      end: timeToMinutes(item.end_time as string),
    }));

  const weeklyWindows = rules
    .filter((rule) => rule.weekday === weekday && rule.is_active !== false)
    .map((rule) => ({
      start: timeToMinutes(rule.start_time),
      end: timeToMinutes(rule.end_time),
    }));

  const baseWindows =
    specialWindows.length > 0
      ? specialWindows.map((item) => ({
          start: timeToMinutes(item.start_time as string),
          end: timeToMinutes(item.end_time as string),
        }))
      : weeklyWindows;

  const recurringBreaks = breaks
    .filter((item) => item.weekday === weekday)
    .map((item) => ({
      start: timeToMinutes(item.start_time),
      end: timeToMinutes(item.end_time),
    }));

  const windows = mergeRanges(
    subtractRanges(baseWindows, [...recurringBreaks, ...blockedWindows]),
  );

  const busyIntervals = busy
    .map((item) => {
      const start = DateTime.fromISO(item.start_at, { setZone: true });
      const end = DateTime.fromISO(item.buffer_end_at, { setZone: true });
      if (!start.isValid || !end.isValid) return null;
      return { start: start.toMillis(), end: end.toMillis() };
    })
    .filter((item): item is { start: number; end: number } => item !== null);

  const step = durationMinutes + Math.max(0, bufferMinutes);
  const occupiedMinutes = durationMinutes + Math.max(0, bufferMinutes);
  const slots: TimeSlot[] = [];

  for (const window of windows) {
    for (
      let startMinute = window.start;
      startMinute + durationMinutes <= window.end;
      startMinute += step
    ) {
      const startLocal = zonedAt(
        date,
        minutesToTime(startMinute),
        timezone,
      );
      if (!startLocal) continue;

      const endLocal = startLocal.plus({ minutes: durationMinutes });
      const startMs = startLocal.toMillis();
      const endMs = endLocal.toMillis();
      const blockEndMs = startMs + occupiedMinutes * 60_000;

      if (startMs < nowMs) continue;

      const conflict = busyIntervals.some((interval) =>
        overlaps(startMs, blockEndMs, interval.start, interval.end),
      );
      if (conflict) continue;

      slots.push({
        start: startLocal.toUTC().toISO() ?? "",
        end: endLocal.toUTC().toISO() ?? "",
        label: startLocal.toFormat("h:mm a").toLowerCase(),
      });
    }
  }

  const seen = new Set<string>();
  return slots.filter((slot) => {
    if (!slot.start || seen.has(slot.start)) return false;
    seen.add(slot.start);
    return true;
  });
}

/**
 * Server-side re-validation used before creating a booking. A requested start
 * is only accepted if it is exactly one of the slots the engine would offer.
 */
export function isSlotOffered(
  input: GenerateSlotsInput,
  requestedStartIso: string,
): boolean {
  const requested = DateTime.fromISO(requestedStartIso, { setZone: true });
  if (!requested.isValid) return false;
  return generateSlots(input).some(
    (slot) => DateTime.fromISO(slot.start).toMillis() === requested.toMillis(),
  );
}

export const __testing = { subtractRanges, mergeRanges, zonedAt };
