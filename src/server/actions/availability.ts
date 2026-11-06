"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/server/auth";
import {
  exceptionSchema,
  weeklyAvailabilitySchema,
  type WeeklyAvailabilityInput,
} from "@/lib/validation/availability";
import { getString, invalid, type FormState } from "@/server/form";
import { trackEvent } from "@/server/analytics";
import type { ActionResult } from "@/lib/types";

export async function saveAvailabilityAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let payload: unknown;
  try {
    payload = JSON.parse(getString(formData, "payload"));
  } catch {
    return { error: "The schedule could not be read. Reload and try again." };
  }

  const parsed = weeklyAvailabilitySchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);

  const data = parsed.data as WeeklyAvailabilityInput;
  const days = data.days
    .filter((day) => day.enabled)
    .map((day) => ({
      weekday: day.weekday,
      start_time: day.startTime,
      end_time: day.endTime,
    }));
  const breaks = data.breaks.map((item) => ({
    weekday: item.weekday,
    start_time: item.startTime,
    end_time: item.endTime,
    label: item.label ?? "",
  }));

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.rpc("save_weekly_availability", {
    p_business_id: business.id,
    p_days: days,
    p_breaks: breaks,
  });

  if (error) {
    return { error: "We could not save your weekly schedule. Please try again." };
  }

  await trackEvent("availability_configured", business.id);
  revalidatePath("/availability");
  revalidatePath(`/book/${business.slug}`);
  return { success: true, notice: "Weekly schedule saved." };
}

export async function addExceptionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = exceptionSchema.safeParse({
    date: getString(formData, "date"),
    kind: getString(formData, "kind"),
    startTime: getString(formData, "startTime"),
    endTime: getString(formData, "endTime"),
    reason: getString(formData, "reason"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.from("availability_exceptions").insert({
    business_id: business.id,
    date: parsed.data.date,
    start_time: parsed.data.startTime || null,
    end_time: parsed.data.endTime || null,
    is_unavailable: parsed.data.kind !== "special",
    reason: parsed.data.reason || null,
  });

  if (error) {
    return { error: "We could not save that date. Please try again." };
  }

  revalidatePath("/availability");
  return { success: true, notice: "Date saved." };
}

export async function deleteExceptionAction(
  exceptionId: string,
): Promise<ActionResult> {
  if (!exceptionId) return { ok: false, error: "That date could not be found." };

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", exceptionId)
    .eq("business_id", business.id);

  if (error) return { ok: false, error: "Could not remove that date." };

  revalidatePath("/availability");
  return { ok: true };
}
