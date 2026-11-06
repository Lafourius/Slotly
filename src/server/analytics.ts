import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsEventName =
  | "owner_registered"
  | "onboarding_completed"
  | "service_created"
  | "availability_configured"
  | "booking_page_shared"
  | "public_booking_started"
  | "booking_submitted"
  | "booking_confirmed";

/**
 * Records a product event. Never pass customer names, emails, phones or notes.
 * Analytics failures are swallowed: they must not break a user's action.
 */
export async function trackEvent(
  name: AnalyticsEventName,
  businessId: string | null,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  try {
    const { error } = await admin
      .from("analytics_events")
      .insert({ name, business_id: businessId });
    if (error) {
      console.warn("analytics event could not be recorded");
    }
  } catch {
    console.warn("analytics event could not be recorded");
  }
}
