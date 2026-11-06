"use server";

import { requireBusiness } from "@/server/auth";
import { trackEvent } from "@/server/analytics";

export async function trackShareAction(): Promise<void> {
  const { business } = await requireBusiness();
  await trackEvent("booking_page_shared", business.id);
}
