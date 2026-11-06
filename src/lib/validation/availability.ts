import { z } from "zod";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const timeSchema = z
  .string()
  .regex(TIME_RE, "Choose a valid time");

export const weeklyAvailabilitySchema = z
  .object({
    days: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          enabled: z.boolean(),
          startTime: timeSchema,
          endTime: timeSchema,
        }),
      )
      .length(7, "All seven days are required"),
    breaks: z
      .array(
        z
          .object({
            weekday: z.number().int().min(0).max(6),
            startTime: timeSchema,
            endTime: timeSchema,
            label: z
              .string()
              .trim()
              .max(60, "Keep break labels under 60 characters")
              .optional()
              .default(""),
          })
          .refine(
            (item) => item.endTime > item.startTime,
            "Break end must be after its start",
          ),
      )
      .max(20, "Use 20 breaks or fewer"),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    value.days.forEach((day, index) => {
      if (seen.has(day.weekday)) {
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "weekday"],
          message: "Duplicate weekday",
        });
      }
      seen.add(day.weekday);
      if (day.enabled && day.endTime <= day.startTime) {
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "endTime"],
          message: "Closing time must be after opening time",
        });
      }
    });
  });

export type WeeklyAvailabilityInput = z.infer<typeof weeklyAvailabilitySchema>;

export const exceptionSchema = z
  .object({
    date: z.string().regex(DATE_RE, "Choose a valid date"),
    kind: z.enum(["unavailable", "blocked", "special"]),
    startTime: z.string().optional().default(""),
    endTime: z.string().optional().default(""),
    reason: z
      .string()
      .trim()
      .max(120, "Keep the note under 120 characters")
      .optional()
      .default(""),
  })
  .superRefine((value, ctx) => {
    const hasStart = TIME_RE.test(value.startTime);
    const hasEnd = TIME_RE.test(value.endTime);
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Set both a start and end time, or leave both blank",
      });
    }
    if (hasStart && hasEnd && value.endTime <= value.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      });
    }
    if (value.kind !== "unavailable" && !hasStart) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message:
          value.kind === "special"
            ? "Special hours need a start and end time"
            : "Blocked hours need a start and end time",
      });
    }
  });
