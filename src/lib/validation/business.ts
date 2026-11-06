import { z } from "zod";
import { CATEGORIES, TIMEZONES } from "@/lib/constants";
import { emailSchema } from "@/lib/validation/auth";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters")
  .max(48, "Use 48 characters or fewer")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens",
  );

const categoryValues = CATEGORIES.map((category) => category.value);
const timezoneValues = TIMEZONES.map((zone) => zone.value);

export const businessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your business name")
    .max(80, "Use 80 characters or fewer"),
  slug: slugSchema,
  category: z.enum(categoryValues as [string, ...string[]], {
    message: "Choose a business category",
  }),
  description: z
    .string()
    .trim()
    .max(500, "Keep the description under 500 characters"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(24, "That phone number is too long")
    .regex(
      /^$|^[+]?[0-9][0-9\s-]{5,23}$/,
      "Enter a valid phone number, including country code",
    )
    .optional()
    .default(""),
  city: z
    .string()
    .trim()
    .max(80, "Use 80 characters or fewer")
    .optional()
    .default(""),
  timezone: z.enum(timezoneValues as [string, ...string[]], {
    message: "Choose a timezone",
  }),
});

export const onboardingSchema = businessProfileSchema;

export const bookingPreferencesSchema = z.object({
  bookingMode: z.enum(["auto", "manual"]),
});
