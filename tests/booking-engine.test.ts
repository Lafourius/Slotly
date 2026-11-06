import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  generateSlots,
  isSlotOffered,
  type GenerateSlotsInput,
} from "@/lib/booking/engine";

const IST = "Asia/Kolkata";
const NOW = new Date("2026-01-01T00:00:00Z");

function build(overrides: Partial<GenerateSlotsInput> = {}): GenerateSlotsInput {
  return {
    date: "2026-01-10",
    timezone: IST,
    durationMinutes: 30,
    bufferMinutes: 0,
    rules: [{ weekday: 6, start_time: "09:00", end_time: "12:00" }],
    now: NOW,
    ...overrides,
  };
}

describe("generateSlots", () => {
  it("generates slots across a working window", () => {
    const slots = generateSlots(build());
    expect(slots.map((slot) => slot.label)).toEqual([
      "9:00 am",
      "9:30 am",
      "10:00 am",
      "10:30 am",
      "11:00 am",
      "11:30 am",
    ]);
    expect(slots[0]?.start).toBe("2026-01-10T03:30:00.000Z");
  });

  it("steps by duration plus buffer so bookings never touch", () => {
    const slots = generateSlots(build({ bufferMinutes: 15 }));
    expect(slots.map((slot) => slot.label)).toEqual([
      "9:00 am",
      "9:45 am",
      "10:30 am",
      "11:15 am",
    ]);
  });

  it("removes recurring break time", () => {
    const slots = generateSlots(
      build({
        breaks: [{ weekday: 6, start_time: "10:00", end_time: "10:30" }],
      }),
    );
    expect(slots.map((slot) => slot.label)).toEqual([
      "9:00 am",
      "9:30 am",
      "10:30 am",
      "11:00 am",
      "11:30 am",
    ]);
  });

  it("returns no slots on a day without availability", () => {
    expect(generateSlots(build({ date: "2026-01-11" }))).toHaveLength(0);
  });

  it("closes the whole day for a full-day exception", () => {
    const slots = generateSlots(
      build({
        exceptions: [
          {
            date: "2026-01-10",
            start_time: null,
            end_time: null,
            is_unavailable: true,
          },
        ],
      }),
    );
    expect(slots).toHaveLength(0);
  });

  it("uses special working hours on a normally closed day", () => {
    const slots = generateSlots(
      build({
        date: "2026-01-11",
        exceptions: [
          {
            date: "2026-01-11",
            start_time: "10:00",
            end_time: "11:00",
            is_unavailable: false,
          },
        ],
      }),
    );
    expect(slots.map((slot) => slot.label)).toEqual(["10:00 am", "10:30 am"]);
  });

  it("removes a partial-day unavailable block", () => {
    const slots = generateSlots(
      build({
        exceptions: [
          {
            date: "2026-01-10",
            start_time: "09:30",
            end_time: "10:00",
            is_unavailable: true,
          },
        ],
      }),
    );
    expect(slots.map((slot) => slot.label)).toEqual([
      "9:00 am",
      "10:00 am",
      "10:30 am",
      "11:00 am",
      "11:30 am",
    ]);
  });

  it("drops slots that overlap an existing booking including its buffer", () => {
    const slots = generateSlots(
      build({
        bufferMinutes: 15,
        busy: [
          {
            start_at: "2026-01-10T04:00:00.000Z", // 9:30 IST
            buffer_end_at: "2026-01-10T04:30:00.000Z", // 10:00 IST + 0 buffer
          },
        ],
      }),
    );
    // 9:00's buffer would run into the 9:30 booking, and 9:45 would too.
    expect(slots.map((slot) => slot.label)).toEqual([
      "10:30 am",
      "11:15 am",
    ]);
  });

  it("filters slots that have already started", () => {
    const slots = generateSlots(
      build({ now: new Date("2026-01-10T04:45:00Z") }), // 10:15 IST
    );
    expect(slots.map((slot) => slot.label)).toEqual([
      "10:30 am",
      "11:00 am",
      "11:30 am",
    ]);
  });

  it("keeps local wall-clock times across a DST spring-forward gap", () => {
    const slots = generateSlots({
      date: "2026-03-08",
      timezone: "America/New_York",
      durationMinutes: 60,
      bufferMinutes: 0,
      rules: [{ weekday: 0, start_time: "01:00", end_time: "04:00" }],
      now: NOW,
    });
    expect(slots.map((slot) => slot.label)).toEqual(["1:00 am", "3:00 am"]);
    expect(slots[0]?.start).toBe("2026-03-08T06:00:00.000Z");
    expect(slots[1]?.start).toBe("2026-03-08T07:00:00.000Z");
  });

  it("rejects a requested start that is not on the slot grid", () => {
    const input = build();
    expect(isSlotOffered(input, "2026-01-10T03:30:00.000Z")).toBe(true);
    expect(isSlotOffered(input, "2026-01-10T03:45:00.000Z")).toBe(false);
    expect(
      isSlotOffered(input, DateTime.fromISO("2026-01-11T03:30:00Z").toISO()!),
    ).toBe(false);
  });
});
