"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import {
  createServiceAction,
  updateServiceAction,
} from "@/server/actions/services";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { formatDuration, formatPrice } from "@/lib/utils";
import type { Service } from "@/lib/types";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

const DURATION_PRESETS = [20, 30, 45, 60, 90];

export function ServiceForm({ service }: { service?: Service }) {
  const editing = Boolean(service);
  const [state, action, pending] = useActionState(
    editing ? updateServiceAction : createServiceAction,
    initialState,
  );

  const [duration, setDuration] = useState(service?.duration_minutes ?? 30);
  const [buffer, setBuffer] = useState(service?.buffer_minutes ?? 0);
  const [price, setPrice] = useState(
    service?.price_minor_units != null
      ? service.price_minor_units % 100 === 0
        ? String(service.price_minor_units / 100)
        : (service.price_minor_units / 100).toFixed(2)
      : "",
  );

  const pricePaise = price.trim() ? Math.round(Number(price) * 100) : null;

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="mb-6">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to services
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-navy">
          {editing ? "Edit service" : "Add a service"}
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-6 text-muted">
          {editing
            ? "Update how this service appears and how long it takes."
            : "A service is what customers choose when they book. You can add more later."}
        </p>
      </div>

      {state.error ? (
        <Alert variant="error" className="mb-5">
          {state.error}
        </Alert>
      ) : null}

      <form action={action} className="space-y-5" noValidate>
        {editing ? (
          <input type="hidden" name="serviceId" value={service?.id} />
        ) : null}

        <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
          <div className="space-y-4">
            <Field
              label="Service name"
              htmlFor="name"
              error={state.fieldErrors?.name}
            >
              <Input
                id="name"
                name="name"
                defaultValue={service?.name ?? ""}
                placeholder="e.g. Mathematics consultation"
                required
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              optional
              hint="Helpful context for the customer before they book."
              error={state.fieldErrors?.description}
            >
              <Textarea
                id="description"
                name="description"
                defaultValue={service?.description ?? ""}
                placeholder="A focused session to work through specific problems."
                maxLength={1000}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-[14.5px] font-semibold text-navy">
            Timing and price
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Slots are generated from your working hours using this duration.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Duration (minutes)"
              htmlFor="durationMinutes"
              error={state.fieldErrors?.durationMinutes}
            >
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                required
                aria-invalid={Boolean(state.fieldErrors?.durationMinutes)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDuration(preset)}
                    className={
                      duration === preset
                        ? "rounded-full border border-accent bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-[#0b6f6b]"
                        : "rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:border-[#cfd8e3]"
                    }
                  >
                    {preset} min
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="Buffer after appointment (minutes)"
              htmlFor="bufferMinutes"
              optional
              hint="Breathing room before the next slot becomes available."
              error={state.fieldErrors?.bufferMinutes}
            >
              <Input
                id="bufferMinutes"
                name="bufferMinutes"
                type="number"
                min={0}
                max={240}
                step={5}
                value={buffer}
                onChange={(event) => setBuffer(Number(event.target.value))}
                aria-invalid={Boolean(state.fieldErrors?.bufferMinutes)}
              />
            </Field>
          </div>

          <div className="mt-4 max-w-xs">
            <Field
              label="Price"
              htmlFor="price"
              optional
              error={state.fieldErrors?.price}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted">
                  ₹
                </span>
                <Input
                  id="price"
                  name="price"
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Leave blank if free"
                  className="pl-7"
                  aria-invalid={Boolean(state.fieldErrors?.price)}
                />
              </div>
            </Field>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-canvas px-3.5 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <p className="text-[12px] font-semibold text-ink">
                Customers will see
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                {formatDuration(duration || 0)}
                {buffer > 0 ? ` + ${buffer} min buffer` : ""}
                {pricePaise !== null && Number.isFinite(pricePaise)
                  ? ` · ${formatPrice(pricePaise)}`
                  : " · No price shown"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              name="isActive"
              defaultChecked={service?.is_active ?? true}
              className="mt-0.5"
            />
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">
                Accept bookings for this service
              </span>
              <span className="mt-0.5 block text-[12px] leading-5 text-muted">
                Turn this off to hide the service from your booking page without
                deleting it.
              </span>
            </span>
          </label>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" asChild>
            <Link href="/services">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" loading={pending} className="sm:min-w-44">
            {editing ? "Save changes" : "Add service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
