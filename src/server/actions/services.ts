"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/server/auth";
import {
  rupeesToPaise,
  serviceSchema,
} from "@/lib/validation/service";
import {
  getBoolean,
  getString,
  invalid,
  type FormState,
} from "@/server/form";
import { trackEvent } from "@/server/analytics";
import type { ActionResult } from "@/lib/types";

function parseService(formData: FormData) {
  return serviceSchema.safeParse({
    name: getString(formData, "name"),
    description: getString(formData, "description"),
    durationMinutes: getString(formData, "durationMinutes"),
    bufferMinutes: getString(formData, "bufferMinutes"),
    price: getString(formData, "price"),
    isActive: getBoolean(formData, "isActive"),
  });
}

export async function createServiceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseService(formData);
  if (!parsed.success) return invalid(parsed.error);

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name: parsed.data.name,
    description: parsed.data.description,
    duration_minutes: parsed.data.durationMinutes,
    buffer_minutes: parsed.data.bufferMinutes,
    price_minor_units: rupeesToPaise(parsed.data.price),
    is_active: parsed.data.isActive,
  });

  if (error) {
    return { error: "We could not create that service. Please try again." };
  }

  await trackEvent("service_created", business.id);
  revalidatePath("/services");
  revalidatePath("/dashboard");
  redirect("/services?created=1");
}

export async function updateServiceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const serviceId = getString(formData, "serviceId");
  if (!serviceId) return { error: "That service could not be found." };

  const parsed = parseService(formData);
  if (!parsed.success) return invalid(parsed.error);

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      duration_minutes: parsed.data.durationMinutes,
      buffer_minutes: parsed.data.bufferMinutes,
      price_minor_units: rupeesToPaise(parsed.data.price),
      is_active: parsed.data.isActive,
    })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return { error: "We could not save that service. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/dashboard");
  redirect("/services?updated=1");
}

export async function setServiceActiveAction(
  serviceId: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!serviceId) return { ok: false, error: "That service could not be found." };

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return { ok: false, error: "Could not update the service." };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteServiceAction(
  serviceId: string,
): Promise<ActionResult> {
  if (!serviceId) return { ok: false, error: "That service could not be found." };

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "This service has appointment history, so it cannot be deleted. Deactivate it instead to keep your records intact.",
      };
    }
    return { ok: false, error: "Could not delete the service." };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  return { ok: true };
}
