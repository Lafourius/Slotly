export const CATEGORIES = [
  { value: "tutoring", label: "Tutoring & education" },
  { value: "salon", label: "Salon & beauty" },
  { value: "photography", label: "Photography" },
  { value: "fitness", label: "Fitness & wellness" },
  { value: "repairs", label: "Repairs & maintenance" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other service" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.label]),
);

export const WEEKDAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
] as const;

export const WEEKDAY_LABELS: Record<number, string> = Object.fromEntries(
  WEEKDAYS.map((day) => [day.value, day.label]),
);

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
] as const;

export const ACTIVE_APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
] as const;

export const BOOKING_HORIZON_DAYS = 60;

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
