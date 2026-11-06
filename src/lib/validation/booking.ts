import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .max(254, "That email address is too long")
  .refine(
    (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Enter a valid email address",
  )
  .transform((value) => value.toLowerCase());

const optionalPhone = z
  .string()
  .trim()
  .max(24, "That phone number is too long")
  .refine(
    (value) => value === "" || /^[+]?[0-9][0-9\s-]{5,23}$/.test(value),
    "Enter a valid phone number",
  );

export const publicBookingSchema = z
  .object({
    slug: z.string().trim().min(1).max(64),
    serviceId: z.string().uuid("Choose a service"),
    startAt: z.string().datetime({ offset: true, message: "Choose a time slot" }),
    name: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(80, "That name is too long"),
    email: optionalEmail,
    phone: optionalPhone,
    notes: z
      .string()
      .trim()
      .max(1000, "Keep notes under 1000 characters"),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Add an email address or phone number",
      });
    }
  });

export const appointmentActionSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["confirmed", "rejected", "cancelled", "completed"]),
});

export const appointmentIdSchema = z.object({
  appointmentId: z.string().uuid(),
});
