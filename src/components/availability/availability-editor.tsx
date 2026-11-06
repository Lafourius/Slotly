"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  CalendarOff,
  Check,
  Clock3,
  Coffee,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WEEKDAYS } from "@/lib/constants";
import { formatDateKeyLong } from "@/lib/booking/time";
import type {
  AvailabilityBreak,
  AvailabilityException,
  AvailabilityRule,
} from "@/lib/types";
import {
  addExceptionAction,
  deleteExceptionAction,
  saveAvailabilityAction,
} from "@/server/actions/availability";
import type { FormState } from "@/server/form";

interface DayState {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BreakState {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  label: string;
}

const isoToTime = (value: string | null) =>
  value ? value.slice(0, 5) : "09:00";

const initialState: FormState = {};

function parseDateTime(iso: string, timezone: string) {
  return formatDateKeyLong(iso, timezone);
}

function formatClock(value: string): string {
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minutes} ${suffix}`;
}

export function AvailabilityEditor({
  rules,
  breaks,
  exceptions,
  timezone,
}: {
  rules: AvailabilityRule[];
  breaks: AvailabilityBreak[];
  exceptions: AvailabilityException[];
  timezone: string;
}) {
  const [days, setDays] = useState<DayState[]>(() =>
    WEEKDAYS.map(({ value }) => {
      const rule = rules.find((item) => item.weekday === value);
      return {
        weekday: value,
        enabled: Boolean(rule?.is_active),
        startTime: isoToTime(rule?.start_time ?? null),
        endTime: isoToTime(rule?.end_time ?? null) || "18:00",
      };
    }),
  );

  const [breakItems, setBreakItems] = useState<BreakState[]>(() =>
    breaks.map((item) => ({
      id: item.id,
      weekday: item.weekday,
      startTime: isoToTime(item.start_time),
      endTime: isoToTime(item.end_time),
      label: item.label ?? "",
    })),
  );

  const [state, action, pending] = useActionState(
    saveAvailabilityAction,
    initialState,
  );
  const [exceptionState, exceptionAction, exceptionPending] = useActionState(
    addExceptionAction,
    initialState,
  );

  const exceptionFormRef = useRef<HTMLFormElement>(null);
  const [exceptionKind, setExceptionKind] = useState("unavailable");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (exceptionState.success) {
      exceptionFormRef.current?.reset();
      setExceptionKind("unavailable");
      toast.success("Date saved");
    }
  }, [exceptionState]);

  function updateDay(weekday: number, patch: Partial<DayState>) {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    );
  }

  function addBreak(weekday: number) {
    setBreakItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        weekday,
        startTime: "13:00",
        endTime: "14:00",
        label: "",
      },
    ]);
  }

  function updateBreak(id: string, patch: Partial<BreakState>) {
    setBreakItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeBreak(id: string) {
    setBreakItems((current) => current.filter((item) => item.id !== id));
  }

  function applyFirstDayToAll() {
    const first = days.find((day) => day.enabled) ?? days[0];
    if (!first) return;
    setDays((current) =>
      current.map((day) => ({
        ...day,
        startTime: first.startTime,
        endTime: first.endTime,
      })),
    );
    toast.success("Hours copied to every day");
  }

  function removeException(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteExceptionAction(id);
      setDeletingId(null);
      if (result.ok) toast.success("Date removed");
      else toast.error(result.error);
    });
  }

  const payload = JSON.stringify({
    days: days.map((day) => ({
      weekday: day.weekday,
      enabled: day.enabled,
      startTime: day.startTime,
      endTime: day.endTime,
    })),
    breaks: breakItems.map((item) => ({
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      label: item.label,
    })),
  });

  const enabledCount = days.filter((day) => day.enabled).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-2.5 text-[12.5px] text-muted">
          <Clock3 className="size-4 text-accent-strong" aria-hidden="true" />
          <span>
            Times are in <strong className="font-semibold text-ink">{timezone.replace("_", " ")}</strong>.
            {enabledCount === 0
              ? " No working days yet — customers can’t book."
              : ` You take appointments on ${enabledCount} day${enabledCount === 1 ? "" : "s"} per week.`}
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={applyFirstDayToAll}
        >
          Copy first day to all
        </Button>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <form action={action}>
        <input type="hidden" name="payload" value={payload} />

        <section className="rounded-card border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[15px] font-semibold text-navy">
                Weekly hours
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                Turn a day on, then set your opening and closing times.
              </p>
            </div>
            <CalendarOff className="hidden size-4 text-muted sm:block" aria-hidden="true" />
          </div>

          <ul className="divide-y divide-line">
            {days.map((day) => {
              const dayBreaks = breakItems.filter(
                (item) => item.weekday === day.weekday,
              );
              const dayLabel = WEEKDAYS.find(
                (item) => item.value === day.weekday,
              );
              return (
                <li key={day.weekday} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3 sm:w-[150px]">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={day.enabled}
                        aria-label={`Take bookings on ${dayLabel?.label}`}
                        onClick={() =>
                          updateDay(day.weekday, { enabled: !day.enabled })
                        }
                        className={
                          day.enabled
                            ? "relative h-6 w-10 shrink-0 rounded-full bg-accent transition-colors"
                            : "relative h-6 w-10 shrink-0 rounded-full bg-[#d5dde7] transition-colors"
                        }
                      >
                        <span
                          className={
                            day.enabled
                              ? "absolute left-[18px] top-0.5 size-5 rounded-full bg-white shadow-sm transition-all"
                              : "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-all"
                          }
                        />
                      </button>
                      <span
                        className={
                          day.enabled
                            ? "text-[13px] font-semibold text-ink"
                            : "text-[13px] font-medium text-muted"
                        }
                      >
                        {dayLabel?.label}
                      </span>
                    </div>

                    {day.enabled ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="time"
                          aria-label={`${dayLabel?.label} opening time`}
                          value={day.startTime}
                          onChange={(event) =>
                            updateDay(day.weekday, {
                              startTime: event.target.value,
                            })
                          }
                          className="h-10 w-[112px] px-2.5 text-[12.5px]"
                        />
                        <span className="text-[11px] text-muted">to</span>
                        <Input
                          type="time"
                          aria-label={`${dayLabel?.label} closing time`}
                          value={day.endTime}
                          onChange={(event) =>
                            updateDay(day.weekday, {
                              endTime: event.target.value,
                            })
                          }
                          className="h-10 w-[112px] px-2.5 text-[12.5px]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-muted sm:ml-2"
                          onClick={() => addBreak(day.weekday)}
                        >
                          <Plus aria-hidden="true" />
                          Break
                        </Button>
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted sm:ml-1">Closed</p>
                    )}
                  </div>

                  {day.enabled && dayBreaks.length > 0 ? (
                    <ul className="mt-2 space-y-2 sm:pl-[150px]">
                      {dayBreaks.map((item) => (
                        <li key={item.id} className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
                            <Coffee className="size-3.5" aria-hidden="true" />
                            Break
                          </span>
                          <Input
                            type="time"
                            aria-label={`${dayLabel?.label} break start`}
                            value={item.startTime}
                            onChange={(event) =>
                              updateBreak(item.id, {
                                startTime: event.target.value,
                              })
                            }
                            className="h-9 w-[106px] px-2 text-[12px]"
                          />
                          <span className="text-[11px] text-muted">to</span>
                          <Input
                            type="time"
                            aria-label={`${dayLabel?.label} break end`}
                            value={item.endTime}
                            onChange={(event) =>
                              updateBreak(item.id, {
                                endTime: event.target.value,
                              })
                            }
                            className="h-9 w-[106px] px-2 text-[12px]"
                          />
                          <Input
                            value={item.label}
                            onChange={(event) =>
                              updateBreak(item.id, { label: event.target.value })
                            }
                            placeholder="Label (optional)"
                            aria-label={`${dayLabel?.label} break label`}
                            maxLength={60}
                            className="h-9 w-[150px] px-2 text-[12px]"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted hover:bg-danger-soft hover:text-danger"
                            onClick={() => removeBreak(item.id)}
                            aria-label="Remove break"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3 border-t border-line bg-[#fbfcfe] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[11.5px] text-muted">
              Buffer time after a service is set per service, not here.
            </p>
            <Button type="submit" loading={pending}>
              <Save aria-hidden="true" />
              Save weekly hours
            </Button>
          </div>
        </section>
      </form>

      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-semibold text-navy">
            Time off &amp; special days
          </h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Close a holiday, block a few hours, or open on a normally closed day.
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            {exceptionState.error ? (
              <Alert variant="error" className="mb-3">
                {exceptionState.error}
              </Alert>
            ) : null}

            <form
              ref={exceptionFormRef}
              action={exceptionAction}
              className="space-y-3.5"
            >
              <Field label="Date" htmlFor="exception-date">
                <Input
                  id="exception-date"
                  name="date"
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                />
              </Field>

              <Field label="What happens?" htmlFor="exception-kind">
                <Select
                  id="exception-kind"
                  name="kind"
                  value={exceptionKind}
                  onChange={(event) => setExceptionKind(event.target.value)}
                >
                  <option value="unavailable">Closed all day</option>
                  <option value="blocked">Block a few hours</option>
                  <option value="special">Special working hours</option>
                </Select>
              </Field>

              {exceptionKind !== "unavailable" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="From" htmlFor="exception-start">
                    <Input
                      id="exception-start"
                      name="startTime"
                      type="time"
                      defaultValue="10:00"
                    />
                  </Field>
                  <Field label="To" htmlFor="exception-end">
                    <Input
                      id="exception-end"
                      name="endTime"
                      type="time"
                      defaultValue="12:00"
                    />
                  </Field>
                </div>
              ) : null}

              <Field label="Note" htmlFor="exception-reason" optional>
                <Input
                  id="exception-reason"
                  name="reason"
                  placeholder="e.g. Diwali holiday"
                  maxLength={120}
                />
              </Field>

              <Button
                type="submit"
                variant="secondary"
                loading={exceptionPending}
                className="w-full"
              >
                <Plus aria-hidden="true" />
                Add date
              </Button>
            </form>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Upcoming ({exceptions.length})
            </h3>
            {exceptions.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-line bg-canvas px-4 py-8 text-center">
                <Sparkles className="mx-auto size-4 text-muted" aria-hidden="true" />
                <p className="mt-2 text-[12.5px] font-medium text-ink">
                  No exceptions yet
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted">
                  Your weekly hours apply every week until you add a date here.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {exceptions.map((exception) => {
                  const isSpecial = !exception.is_unavailable;
                  return (
                    <li
                      key={exception.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas/60 px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[12.5px] font-semibold text-ink">
                            {parseDateTime(exception.date, timezone)}
                          </p>
                          {isSpecial ? (
                            <Badge tone="accent">Special hours</Badge>
                          ) : exception.start_time ? (
                            <Badge tone="warning">Blocked hours</Badge>
                          ) : (
                            <Badge tone="danger">Closed</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[11.5px] text-muted">
                          {exception.start_time && exception.end_time
                            ? `${formatClock(exception.start_time)} – ${formatClock(exception.end_time)}`
                            : "All day"}
                          {exception.reason ? ` · ${exception.reason}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted hover:bg-danger-soft hover:text-danger"
                        onClick={() => removeException(exception.id)}
                        loading={deletingId === exception.id}
                        aria-label="Remove date"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-muted">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              Exceptions override your weekly hours for that date only.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
