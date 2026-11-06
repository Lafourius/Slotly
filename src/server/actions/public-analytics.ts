"use server";

import { fetchPublicBusinessPage } from "@/server/booking";
import { trackEvent } from "@/server/analytics";
import { allowRequest } from "@/server/rate-limit";

export async function trackBookingStartedAction(slug: string): Promise<void> {
  if (!slug || slug.length > 64) return;
  if (!(await allowRequest("booking-started", 30, 60 * 60))) return;

  const page = await fetchPublicBusinessPage(slug);
  if (page) await trackEvent("public_booking_started", page.business.id);
}
