"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SETUP_MESSAGE, isSupabaseConfigured } from "@/lib/env";
import {
  bookingPreferencesSchema,
  businessProfileSchema,
  slugSchema,
} from "@/lib/validation/business";
import { getString, invalid, type FormState } from "@/server/form";
import { requireBusiness, requireUser } from "@/server/auth";
import { trackEvent } from "@/server/analytics";
import { uploadBusinessLogo } from "@/server/logo";
import { allowRequest } from "@/server/rate-limit";

export async function checkSlugAction(
  slug: string,
): Promise<{ available: boolean; error?: string }> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return {
      available: false,
      error: parsed.error.issues[0]?.message ?? "That link is not valid",
    };
  }

  if (!(await allowRequest("slug-check", 60, 10 * 60))) {
    return { available: false, error: "Too many checks. Wait a moment." };
  }

  const auth = await requireUser();
  const { data, error } = await auth.supabase.rpc("slug_available", {
    p_slug: parsed.data,
  });

  if (error) {
    return { available: false, error: "Could not check that link right now." };
  }
  return { available: data === true };
}

function readProfile(formData: FormData) {
  return {
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    category: getString(formData, "category"),
    description: getString(formData, "description"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    city: getString(formData, "city"),
    timezone: getString(formData, "timezone"),
  };
}

export async function createBusinessAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = businessProfileSchema.safeParse(readProfile(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (!isSupabaseConfigured()) return { error: SETUP_MESSAGE };

  const auth = await requireUser();

  const existing = await auth.supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (existing.data) redirect("/dashboard");

  const { data: slugFree, error: slugError } = await auth.supabase.rpc(
    "slug_available",
    { p_slug: parsed.data.slug },
  );
  if (slugError) return { error: "Could not check that booking link. Try again." };
  if (!slugFree) {
    return {
      error: "That booking link is already taken.",
      fieldErrors: { slug: "Choose a different booking link" },
    };
  }

  const { data: business, error } = await auth.supabase
    .from("businesses")
    .insert({
      owner_id: auth.user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      category: parsed.data.category,
      description: parsed.data.description,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      timezone: parsed.data.timezone,
      booking_mode: "manual",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !business) {
    if (error?.code === "23505") {
      return {
        error: "That booking link was just taken.",
        fieldErrors: { slug: "Choose a different booking link" },
      };
    }
    return { error: "We could not save your business. Please try again." };
  }

  const logo = await uploadBusinessLogo(
    formData.get("logo") instanceof File ? (formData.get("logo") as File) : null,
    business.id,
  );
  if (logo.url) {
    await auth.supabase
      .from("businesses")
      .update({ logo_url: logo.url })
      .eq("id", business.id);
  }

  // A sensible starting week: Monday to Saturday, 9am to 6pm. Owners adjust
  // this immediately after onboarding; without rules the page would be empty.
  await auth.supabase.from("availability_rules").insert(
    [1, 2, 3, 4, 5, 6].map((weekday) => ({
      business_id: business.id,
      weekday,
      start_time: "09:00",
      end_time: "18:00",
      is_active: true,
    })),
  );

  await trackEvent("onboarding_completed", business.id);
  revalidatePath("/dashboard");
  redirect("/dashboard?onboarding=done");
}

export async function updateBusinessProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = businessProfileSchema.safeParse(readProfile(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { supabase, business } = await requireBusiness();

  if (parsed.data.slug !== business.slug) {
    const { data: slugFree, error: slugError } = await supabase.rpc(
      "slug_available",
      { p_slug: parsed.data.slug },
    );
    if (slugError) return { error: "Could not check that booking link. Try again." };
    if (!slugFree) {
      return {
        error: "That booking link is already taken.",
        fieldErrors: { slug: "Choose a different booking link" },
      };
    }
  }

  const upload = await uploadBusinessLogo(
    formData.get("logo") instanceof File ? (formData.get("logo") as File) : null,
    business.id,
  );
  if (upload.error) {
    return { fieldErrors: { logo: upload.error } };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      category: parsed.data.category,
      description: parsed.data.description,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      timezone: parsed.data.timezone,
      ...(upload.url ? { logo_url: upload.url } : {}),
    })
    .eq("id", business.id);

  if (error) {
    return { error: "We could not save those changes. Please try again." };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath(`/book/${parsed.data.slug}`);
  return { success: true, notice: "Business profile saved." };
}

export async function updateBookingPreferencesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = bookingPreferencesSchema.safeParse({
    bookingMode: getString(formData, "bookingMode"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("businesses")
    .update({ booking_mode: parsed.data.bookingMode })
    .eq("id", business.id);

  if (error) return { error: "We could not save that preference. Try again." };

  revalidatePath("/settings/booking");
  revalidatePath(`/book/${business.slug}`);
  return { success: true, notice: "Booking preferences saved." };
}

export async function deleteLogoAction(): Promise<FormState> {
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("businesses")
    .update({ logo_url: null })
    .eq("id", business.id);
  if (error) return { error: "Could not remove the logo." };
  revalidatePath("/settings/profile");
  return { success: true, notice: "Logo removed." };
}

export async function getBookingUrlAction(): Promise<string> {
  const { business } = await requireBusiness();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/book/${business.slug}`;
}

