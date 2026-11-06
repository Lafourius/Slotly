"use client";

import { useActionState, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createBookingAction } from "@/server/actions/booking";
import { trackBookingStartedAction } from "@/server/actions/public-analytics";
import { formatPrice, formatDuration } from "@/lib/utils";
import {
  formatDateKeyLong,
  formatTime,
} from "@/lib/booking/time";
import type {
  BookingMode,
  PublicService,
  TimeSlot,
} from "@/lib/types";
import type { BookingFormState } from "@/server/actions/booking";

interface DateOption {
  key: string;
  weekday: string;
  day: string;
  month: string;
}

const initialState: BookingFormState = {};

function periodOf(label: string): "Morning" | "Afternoon" | "Evening" {
  const [time, suffix] = label.split(" ");
  let hour = Number(time?.split(":")[0] ?? "0");
  if (suffix === "pm" && hour !== 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function BookingFlow({
  slug,
  businessName,
  timezone,
  bookingMode,
  services,
  initialService,
  initialDate,
  initialSlots,
  dateOptions,
  today,
  maxDate,
}: {
  slug: string;
  businessName: string;
  timezone: string;
  bookingMode: BookingMode;
  services: PublicService[];
  initialService: PublicService;
  initialDate: string;
  initialSlots: TimeSlot[];
  dateOptions: DateOption[];
  today: string;
  maxDate: string;
}) {
  const [state, action, pending] = useActionState(
    createBookingAction,
    initialState,
  );

  const [serviceId, setServiceId] = useState(initialService.id);
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<TimeSlot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const requestRef = useRef(0);
  const trackedRef = useRef(false);

  const service =
    services.find((item) => item.id === serviceId) ?? services[0]!;

  const grouped = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const period = periodOf(slot.label);
    acc[period] = [...(acc[period] ?? []), slot];
    return acc;
  }, {});

  if (state.booking) {
    return <Confirmation state={state} slug={slug} timezone={timezone} />;
  }

  async function fetchSlots(nextServiceId: string, nextDate: string) {
    const requestId = ++requestRef.current;
    setLoading(true);
    setSlotError(null);
    try {
      const response = await fetch(
        `/api/public/slots?${new URLSearchParams({
          slug,
          serviceId: nextServiceId,
          date: nextDate,
        }).toString()}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        slots?: TimeSlot[];
        error?: string;
      };
      if (requestId !== requestRef.current) return;
      if (!response.ok) {
        setSlots([]);
        setSlotError(payload.error ?? "Could not load times. Try again.");
        return;
      }
      const nextSlots = payload.slots ?? [];
      setSlots(nextSlots);
      setSelectedSlot((current) =>
        current && nextSlots.some((slot) => slot.start === current.start)
          ? current
          : null,
      );
    } catch {
      if (requestId === requestRef.current) {
        setSlots([]);
        setSlotError("Could not load times. Check your connection and retry.");
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }

  function chooseService(next: PublicService) {
    if (next.id === serviceId) return;
    setServiceId(next.id);
    setSelectedSlot(null);
    void fetchSlots(next.id, date);
  }

  function chooseDate(next: string) {
    if (!next) return;
    setDate(next);
    setSelectedSlot(null);
    void fetchSlots(serviceId, next);
  }

  async function findNextAvailable() {
    setSearching(true);
    const index = dateOptions.findIndex((option) => option.key === date);
    const ordered = [
      ...dateOptions.slice(index + 1),
      ...dateOptions.slice(0, Math.max(index, 0)),
    ];
    for (const option of ordered) {
      try {
        const response = await fetch(
          `/api/public/slots?${new URLSearchParams({
            slug,
            serviceId,
            date: option.key,
          }).toString()}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as { slots?: TimeSlot[] };
        if (response.ok && (payload.slots?.length ?? 0) > 0) {
          setDate(option.key);
          setSlots(payload.slots ?? []);
          setSelectedSlot(null);
          setSlotError(null);
          setSearching(false);
          return;
        }
      } catch {
        // Try the next date.
      }
    }
    setSearching(false);
    toast.error("No open times in the next two weeks. Try a later date.");
  }

  function chooseSlot(slot: TimeSlot) {
    setSelectedSlot(slot);
    if (!trackedRef.current) {
      trackedRef.current = true;
      void trackBookingStartedAction(slug);
    }
  }

  const dateLabel = formatDateKeyLong(date, timezone);
  const priceLabel = formatPrice(service.price_minor_units);
  const ready = Boolean(selectedSlot);
  const ctaLabel = bookingMode === "auto" ? "Confirm booking" : "Request booking";

  return (
    <form action={action} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="startAt" value={selectedSlot?.start ?? ""} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      <div className="order-1 min-w-0 space-y-4">
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
              1. Choose a service
            </h2>
            <span className="text-[11px] text-muted">
              {services.length} available
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {services.map((item) => {
              const active = item.id === serviceId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseService(item)}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex items-start gap-3 rounded-xl border border-accent bg-accent-soft/60 p-3.5 text-left"
                      : "flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-[#cfd8e3]"
                  }
                >
                  <span
                    className={
                      active
                        ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-white"
                        : "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-[#cfd8e3] bg-surface"
                    }
                  >
                    {active ? (
                      <Check className="size-3" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-[13.5px] font-semibold text-ink">
                        {item.name}
                      </span>
                      <span className="text-[12.5px] font-semibold text-navy">
                        {formatPrice(item.price_minor_units) ?? "Free"}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">
                      {formatDuration(item.duration_minutes)}
                    </span>
                    {item.description ? (
                      <span className="mt-1 block text-[11.5px] leading-5 text-muted">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
            2. Pick a date and time
          </h2>

          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {dateOptions.map((option) => {
              const active = option.key === date;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => chooseDate(option.key)}
                  aria-pressed={active}
                  aria-label={formatDateKeyLong(option.key, timezone)}
                  className={
                    active
                      ? "flex w-[58px] shrink-0 flex-col items-center rounded-xl border border-navy bg-navy px-1 py-2 text-white"
                      : "flex w-[58px] shrink-0 flex-col items-center rounded-xl border border-line bg-surface px-1 py-2 text-muted transition-colors hover:border-accent hover:text-ink"
                  }
                >
                  <span className="text-[10px] font-medium uppercase">
                    {option.weekday}
                  </span>
                  <span className="text-[16px] font-semibold leading-tight">
                    {option.day}
                  </span>
                  <span className="text-[9.5px] uppercase">{option.month}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-ink">{dateLabel}</p>
            <label className="flex items-center gap-1.5 text-[11px] text-muted">
              Another date
              <input
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(event) => chooseDate(event.target.value)}
                className="h-8 rounded-md border border-line bg-surface px-2 text-[11.5px] text-ink"
                aria-label="Choose another date"
              />
            </label>
          </div>

          <div className="mt-4" aria-live="polite">
            {loading || searching ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-canvas px-4 py-6 text-center">
                <CalendarDays className="mx-auto size-4 text-muted" aria-hidden="true" />
                <p className="mt-2 text-[12.5px] font-semibold text-ink">
                  No times left on this day
                </p>
                <p className="mt-1 text-[11.5px] text-muted">
                  Every slot is booked or outside working hours.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={findNextAvailable}
                  loading={searching}
                >
                  Find the next available day
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(["Morning", "Afternoon", "Evening"] as const).map((period) =>
                  grouped[period]?.length ? (
                    <div key={period}>
                      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {period}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                        {grouped[period]?.map((slot) => {
                          const active = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => chooseSlot(slot)}
                              aria-pressed={active}
                              className={
                                active
                                  ? "rounded-lg border border-accent bg-accent py-2.5 text-[12px] font-semibold text-white"
                                  : "rounded-lg border border-line bg-surface py-2.5 text-[12px] font-medium text-ink transition-colors hover:border-accent hover:bg-accent-soft/40"
                              }
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>

          {slotError ? (
            <Alert variant="error" className="mt-3">
              {slotError}
              <button
                type="button"
                onClick={() => void fetchSlots(serviceId, date)}
                className="ml-1 font-semibold underline"
              >
                Retry
              </button>
            </Alert>
          ) : null}
          {state.fieldErrors?.startAt ? (
            <Alert variant="error" className="mt-3">
              {state.fieldErrors.startAt}
            </Alert>
          ) : null}
        </section>

        <div className="lg:hidden">
          <SummaryCard
            businessName={businessName}
            service={service}
            dateLabel={dateLabel}
            timeLabel={selectedSlot ? formatTime(selectedSlot.start, timezone) : null}
            timezone={timezone}
            ctaLabel={ctaLabel}
            ready={ready}
            pending={pending}
            bookingMode={bookingMode}
            priceLabel={priceLabel}
          />
        </div>

        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
            3. Your details
          </h2>

          {state.error ? (
            <Alert variant="error" className="mt-3">
              {state.error}
            </Alert>
          ) : null}

          <div className="mt-3 space-y-3.5">
            <Field
              label="Full name"
              htmlFor="customer-name"
              error={state.fieldErrors?.name}
            >
              <Input
                id="customer-name"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                required
                maxLength={80}
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field
                label="Email"
                htmlFor="customer-email"
                error={state.fieldErrors?.email}
                hint="We’ll only use this for your booking."
              >
                <Input
                  id="customer-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  maxLength={254}
                  aria-invalid={Boolean(state.fieldErrors?.email)}
                />
              </Field>
              <Field
                label="Phone"
                htmlFor="customer-phone"
                error={state.fieldErrors?.phone}
                hint="Add at least one contact method."
              >
                <Input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  maxLength={24}
                  aria-invalid={Boolean(state.fieldErrors?.phone)}
                />
              </Field>
            </div>

            <Field
              label="Anything to add?"
              htmlFor="customer-notes"
              optional
              error={state.fieldErrors?.notes}
            >
              <Textarea
                id="customer-notes"
                name="notes"
                placeholder="Topic you need help with, or anything the business should know."
                maxLength={1000}
                className="min-h-[84px]"
              />
            </Field>
          </div>

          <div className="mt-4 lg:hidden">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={pending}
              disabled={!ready}
            >
              {ready ? ctaLabel : "Choose a time to continue"}
            </Button>
            <p className="mt-2 text-center text-[10.5px] leading-4 text-muted">
              No payment is collected online. You’ll receive a reference after
              booking.
            </p>
          </div>
        </section>
      </div>

      <aside className="order-2 hidden lg:block lg:sticky lg:top-6">
        <SummaryCard
          businessName={businessName}
          service={service}
          dateLabel={dateLabel}
          timeLabel={selectedSlot ? formatTime(selectedSlot.start, timezone) : null}
          timezone={timezone}
          ctaLabel={ctaLabel}
          ready={ready}
          pending={pending}
          bookingMode={bookingMode}
          priceLabel={priceLabel}
        />
        <p className="mt-3 px-2 text-[10.5px] leading-5 text-muted">
          By requesting an appointment you agree to share your name and contact
          details with {businessName}. Slotly does not use them for marketing.
        </p>
      </aside>
    </form>
  );
}

function SummaryCard({
  businessName,
  service,
  dateLabel,
  timeLabel,
  timezone,
  ctaLabel,
  ready,
  pending,
  bookingMode,
  priceLabel,
}: {
  businessName: string;
  service: PublicService;
  dateLabel: string;
  timeLabel: string | null;
  timezone: string;
  ctaLabel: string;
  ready: boolean;
  pending: boolean;
  bookingMode: BookingMode;
  priceLabel: string | null;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
        {businessName}
      </p>
      <h3 className="mt-1.5 text-[15px] font-semibold text-navy">
        {service.name}
      </h3>
      <p className="mt-0.5 text-[11.5px] text-muted">
        {formatDuration(service.duration_minutes)} · {timezone.replace("_", " ")}
      </p>

      <div className="mt-4 space-y-2.5 border-t border-line pt-3.5 text-[12px]">
        <div className="flex items-start gap-2 text-muted">
          <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-ink">{dateLabel}</span>
        </div>
        <div className="flex items-start gap-2 text-muted">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className={timeLabel ? "font-medium text-ink" : ""}>
            {timeLabel ?? "No time selected"}
          </span>
        </div>
        <div className="flex items-start gap-2 text-muted">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>Details confirmed by {businessName}</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
        <span className="text-[12px] text-muted">Total</span>
        <span className="text-[16px] font-semibold text-navy">
          {priceLabel ?? "No charge"}
        </span>
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-4 w-full"
        loading={pending}
        disabled={!ready}
      >
        {ready ? ctaLabel : "Choose a time"}
      </Button>

      <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-5 text-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
        {bookingMode === "auto"
          ? "You’ll be booked instantly. No payment is collected online."
          : `${businessName} will review your request before confirming.`}
      </p>
    </div>
  );
}

function Confirmation({
  state,
  slug,
  timezone,
}: {
  state: BookingFormState;
  slug: string;
  timezone: string;
}) {
  const booking = state.booking!;
  const confirmed = booking.status === "confirmed";

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-card border border-line bg-surface p-6 text-center shadow-card sm:p-8">
        <div
          className={
            confirmed
              ? "mx-auto mb-4 grid size-14 place-items-center rounded-full bg-success-soft text-success"
              : "mx-auto mb-4 grid size-14 place-items-center rounded-full bg-warning-soft text-[#9a6414]"
          }
        >
          {confirmed ? (
            <Check className="size-6" aria-hidden="true" />
          ) : (
            <Clock3 className="size-6" aria-hidden="true" />
          )}
        </div>

        <Badge tone={confirmed ? "success" : "warning"}>
          {confirmed ? "Booking confirmed" : "Awaiting approval"}
        </Badge>

        <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-navy">
          {confirmed ? "You’re booked" : "Request sent"}
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          {confirmed
            ? `Your appointment with ${booking.businessName} is confirmed.`
            : `${booking.businessName} will review your request and confirm it. You don’t need to do anything else.`}
        </p>

        <div className="mt-6 rounded-xl border border-line bg-canvas p-4 text-left">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Reference
            </span>
            <span className="text-[12.5px] font-semibold text-ink">
              {booking.reference}
            </span>
          </div>
          <dl className="mt-3 space-y-2.5 text-[12.5px]">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Service</dt>
              <dd className="text-right font-medium text-ink">
                {booking.serviceName}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Date</dt>
              <dd className="text-right font-medium text-ink">
                {formatDateKeyLong(
                  new Intl.DateTimeFormat("en-CA", {
                    timeZone: booking.timezone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date(booking.startAt)),
                  booking.timezone,
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Time</dt>
              <dd className="text-right font-medium text-ink">
                {formatTime(booking.startAt, booking.timezone)} –{" "}
                {formatTime(booking.endAt, booking.timezone)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Timezone</dt>
              <dd className="text-right font-medium text-ink">
                {timezone.replace("_", " ")}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-4 text-[11.5px] leading-5 text-muted">
          Need to change or cancel? Contact {booking.businessName} directly and
          mention your reference.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.location.assign(`/book/${slug}`)}
          >
            Book another appointment
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted">
            <Sparkles className="size-3 text-accent" aria-hidden="true" />
            No account was created and no payment was taken.
          </p>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <AlertCircle className="size-3.5" aria-hidden="true" />
        Keep your reference handy for any changes.
      </p>
    </div>
  );
}
