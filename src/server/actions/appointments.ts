"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/server/auth";
import { appointmentActionSchema } from "@/lib/validation/booking";
import type { ActionResult, AppointmentStatus } from "@/lib/types";
import { trackEvent } from "@/server/analytics";

const TRANSITIONS: Record<string, AppointmentStatus[]> = {
  confirmed: ["pending"],
  rejected: ["pending"],
  cancelled: ["pending", "confirmed"],
  completed: ["confirmed"],
};

export async function setAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const parsed = appointmentActionSchema.safeParse({ appointmentId, status });
  if (!parsed.success) {
    return { ok: false, error: "That appointment action is not valid." };
  }

  const allowedFrom = TRANSITIONS[parsed.data.status];
  if (!allowedFrom) {
    return { ok: false, error: "That appointment status cannot be set manually." };
  }

  const { supabase, business } = await requireBusiness();
  const { data: appointment, error: readError } = await supabase
    .from("appointments")
    .select("id, status, start_at")
    .eq("id", parsed.data.appointmentId)
    .eq("business_id", business.id)
    .maybeSingle<{ id: string; status: AppointmentStatus; start_at: string }>();

  if (readError || !appointment) {
    return { ok: false, error: "That appointment could not be found." };
  }

  if (!allowedFrom.includes(appointment.status)) {
    return {
      ok: false,
      error: `This appointment is already ${appointment.status}. Refresh the page to see its current state.`,
    };
  }

  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", appointment.id)
    .eq("business_id", business.id)
    .in("status", allowedFrom)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !updated) {
    return {
      ok: false,
      error: "That update did not go through. Refresh and try again.",
    };
  }

  if (parsed.data.status === "confirmed") {
    await trackEvent("booking_confirmed", business.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  revalidatePath("/calendar");
  revalidatePath(`/appointments/${appointment.id}`);
  return { ok: true };
}

