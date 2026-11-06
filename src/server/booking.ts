import { DateTime } from "luxon";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  BookingContext,
  PublicBusiness,
  PublicService,
  TimeSlot,
} from "@/lib/types";
import { generateSlots, type GenerateSlotsInput } from "@/lib/booking/engine";
import { BOOKING_HORIZON_DAYS } from "@/lib/constants";
import { todayKey } from "@/lib/booking/time";

export interface PublicBusinessPage {
  business: PublicBusiness;
  services: PublicService[];
}

type RawBusinessPage = {
  business?: unknown;
  services?: unknown;
};

function readBusiness(value: unknown): PublicBusiness | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.name !== "string") return null;
  const mode = item.booking_mode === "auto" ? "auto" : "manual";
  return {
    id: item.id,
    name: item.name,
    slug: String(item.slug ?? ""),
    description: String(item.description ?? ""),
    category: String(item.category ?? ""),
    city: typeof item.city === "string" ? item.city : null,
    timezone: String(item.timezone ?? "Asia/Kolkata"),
    logo_url: typeof item.logo_url === "string" ? item.logo_url : null,
    booking_mode: mode,
  };
}

export async function fetchPublicBusinessPage(
  slug: string,
): Promise<PublicBusinessPage | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_public_business", {
    p_slug: slug,
  });
  if (error || !data) return null;

  const raw = data as RawBusinessPage;
  const business = readBusiness(raw.business);
  if (!business) return null;

  const services = Array.isArray(raw.services)
    ? (raw.services as PublicService[])
    : [];

  return { business, services };
}

export async function fetchBookingContext(
  slug: string,
  serviceId: string,
): Promise<BookingContext | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_public_booking_context", {
    p_slug: slug,
    p_service_id: serviceId,
  });
  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  const business = readBusiness(raw.business);
  if (!business) return null;

  const rawService = raw.service as Record<string, unknown> | undefined;
  if (!rawService || typeof rawService.id !== "string") return null;

  return {
    business,
    service: {
      id: rawService.id,
      name: String(rawService.name ?? ""),
      description: String(rawService.description ?? ""),
      duration_minutes: Number(rawService.duration_minutes ?? 0),
      buffer_minutes: Number(rawService.buffer_minutes ?? 0),
      price_minor_units:
        rawService.price_minor_units === null
          ? null
          : Number(rawService.price_minor_units),
      is_active: Boolean(rawService.is_active),
    },
    services: Array.isArray(raw.services)
      ? (raw.services as PublicService[])
      : [],
    rules: Array.isArray(raw.rules)
      ? (raw.rules as BookingContext["rules"])
      : [],
    breaks: Array.isArray(raw.breaks)
      ? (raw.breaks as BookingContext["breaks"])
      : [],
    exceptions: Array.isArray(raw.exceptions)
      ? (raw.exceptions as BookingContext["exceptions"])
      : [],
    busy: Array.isArray(raw.busy)
      ? (raw.busy as BookingContext["busy"])
      : [],
  };
}

export function buildSlotInput(
  context: BookingContext,
  date: string,
  now: Date = new Date(),
): GenerateSlotsInput {
  return {
    date,
    timezone: context.business.timezone,
    durationMinutes: context.service.duration_minutes,
    bufferMinutes: context.service.buffer_minutes,
    rules: context.rules.map((rule) => ({ ...rule, is_active: true })),
    breaks: context.breaks,
    exceptions: context.exceptions,
    busy: context.busy,
    now,
  };
}

export function slotsForDate(
  context: BookingContext,
  date: string,
): TimeSlot[] {
  return generateSlots(buildSlotInput(context, date));
}

/** The first date with availability, starting today, within the horizon. */
export function findFirstAvailableDate(
  context: BookingContext,
  fromDate?: string,
): string | null {
  const start = fromDate ?? todayKey(context.business.timezone);
  for (let index = 0; index <= BOOKING_HORIZON_DAYS; index += 1) {
    const date = DateTime.fromISO(start, { zone: context.business.timezone })
      .plus({ days: index })
      .toISODate();
    if (!date) continue;
    if (slotsForDate(context, date).length > 0) return date;
  }
  return null;
}

export function isDateWithinHorizon(date: string, timezone: string): boolean {
  const start = DateTime.fromISO(todayKey(timezone), { zone: timezone });
  const target = DateTime.fromISO(date, { zone: timezone });
  if (!target.isValid) return false;
  return (
    target.startOf("day") >= start.startOf("day") &&
    target.startOf("day") <= start.startOf("day").plus({ days: BOOKING_HORIZON_DAYS })
  );
}
