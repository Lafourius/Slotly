import { z } from "zod";

export const priceInputSchema = z
  .string()
  .trim()
  .max(12, "That price is too large")
  .regex(
    /^\d{0,7}(\.\d{1,2})?$/,
    "Enter a price in rupees, for example 499 or 499.50",
  );

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a service name")
    .max(80, "Use 80 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(1000, "Keep the description under 1000 characters"),
  durationMinutes: z.coerce
    .number()
    .int("Use whole minutes")
    .min(5, "Use at least 5 minutes")
    .max(480, "Use 480 minutes or less"),
  bufferMinutes: z.coerce
    .number()
    .int("Use whole minutes")
    .min(0, "Buffer cannot be negative")
    .max(240, "Use 240 minutes or less"),
  price: priceInputSchema,
  isActive: z.boolean(),
});

export function rupeesToPaise(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function paiseToRupeesInput(paise: number | null): string {
  if (paise === null) return "";
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}
