"use server";

import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildSlotInput,
  fetchBookingContext,
} from "@/server/booking";
import { isSlotOffered } from "@/lib/booking/engine";
import { BOOKING_HORIZON_DAYS } from "@/lib/constants";
import { publicBookingSchema } from "@/lib/validation/booking";
import { getString, invalid, type FormState } from "@/server/form";
import { allowRequest } from "@/server/rate-limit";
import type { AppointmentStatus } from "@/lib/types";

export interface BookingSuccess {
  id: string;
  status: AppointmentStatus;
  reference: string;
  startAt: string;
  endAt: string;
  serviceName: string;
  businessName: string;
  timezone: string;
}

export type BookingFormState = FormState & { booking?: BookingSuccess };

const ERROR_COPY: Record<string, string> = {
  SLOT_TAKEN: "That time was just booked. Please choose another slot.",
  SERVICE_UNAVAILABLE: "That service is no longer accepting bookings.",
  BUSINESS_NOT_FOUND: "This booking page is no longer available.",
  INVALID_SLOT: "That time is not available. Please choose another slot.",
  INVALID_EMAIL: "Check the email address and try again.",
  INVALID_PHONE: "Check the phone number and try again.",
  EMAIL_OR_PHONE_REQUIRED: "Add an email address or a phone number.",
};

function mapRpcError(message: string | undefined): string {
  if (!message) return "We could not complete your booking. Please try again.";
  for (const key of Object.keys(ERROR_COPY)) {
    if (message.includes(key)) return ERROR_COPY[key] as string;
  }
  return "We could not complete your booking. Please try again.";
}

export async function createBookingAction(
  _previous: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  // Honeypot: real customers never see or fill this field.
  if (getString(formData, "website")) {
    return { error: "We could not complete your booking. Please try again." };
  }

  const parsed = publicBookingSchema.safeParse({
    slug: getString(formData, "slug"),
    serviceId: getString(formData, "serviceId"),
    startAt: getString(formData, "startAt"),
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    notes: getString(formData, "notes"),
  });
  if (!parsed.success) return invalid(parsed.error);

  if (!(await allowRequest("booking", 8, 10 * 60))) {
    return {
      error:
        "Too many booking attempts from this connection. Please wait a few minutes or contact the business directly.",
    };
  }

  const context = await fetchBookingContext(
    parsed.data.slug,
    parsed.data.serviceId,
  );
  if (!context || !context.service.is_active) {
    return { error: "That service is no longer accepting bookings." };
  }

  const requested = DateTime.fromISO(parsed.data.startAt, { setZone: true });
  if (!requested.isValid) {
    return { fieldErrors: { startAt: "Choose a time slot" } };
  }

  const dateKey = requested.setZone(context.business.timezone).toISODate();
  if (!dateKey) {
    return { fieldErrors: { startAt: "Choose a time slot" } };
  }

  const today = DateTime.now().setZone(context.business.timezone).startOf("day");
  const requestedDay = DateTime.fromISO(dateKey, {
    zone: context.business.timezone,
  }).startOf("day");

  if (
    !requestedDay.isValid ||
    requestedDay < today ||
    requestedDay > today.plus({ days: BOOKING_HORIZON_DAYS })
  ) {
    return { fieldErrors: { startAt: "Choose a date within the booking window" } };
  }

  const offered = isSlotOffered(
    buildSlotInput(context, dateKey),
    parsed.data.startAt,
  );
  if (!offered) {
    return {
      fieldErrors: {
        startAt: "That time is no longer available. Choose another slot.",
      },
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Booking is temporarily unavailable. Please contact the business directly.",
    };
  }

  const { data, error } = await admin.rpc("create_public_booking", {
    p_slug: parsed.data.slug,
    p_service_id: parsed.data.serviceId,
    p_start_at: requested.toUTC().toISO(),
    p_name: parsed.data.name,
    p_email: parsed.data.email || null,
    p_phone: parsed.data.phone || null,
    p_notes: parsed.data.notes || null,
  });

  if (error || !data) {
    return { error: mapRpcError(error?.message) };
  }

  const booking = data as Record<string, unknown>;

  revalidatePath(`/book/${context.business.slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/appointments");

  return {
    success: true,
    booking: {
      id: String(booking.id),
      status: (booking.status === "confirmed"
        ? "confirmed"
        : "pending") as AppointmentStatus,
      reference: String(booking.reference ?? ""),
      startAt: String(booking.start_at),
      endAt: String(booking.end_at),
      serviceName: String(booking.service_name ?? context.service.name),
      businessName: String(booking.business_name ?? context.business.name),
      timezone: String(booking.timezone ?? context.business.timezone),
    },
  };
}
