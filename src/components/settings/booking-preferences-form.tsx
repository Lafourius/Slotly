"use client";

import { useActionState, useState } from "react";
import { Check, ShieldCheck, Zap } from "lucide-react";
import { updateBookingPreferencesAction } from "@/server/actions/business";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { BookingMode } from "@/lib/types";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

const OPTIONS: {
  value: BookingMode;
  title: string;
  description: string;
  icon: typeof Zap;
}[] = [
  {
    value: "auto",
    title: "Confirm automatically",
    description:
      "Every available slot is confirmed the moment a customer books. Best when your calendar is dependable.",
    icon: Zap,
  },
  {
    value: "manual",
    title: "Review each request",
    description:
      "Bookings wait as pending until you confirm or reject them. Best for trial classes or travel-heavy weeks.",
    icon: ShieldCheck,
  },
];

export function BookingPreferencesForm({ mode }: { mode: BookingMode }) {
  const [selected, setSelected] = useState<BookingMode>(mode);
  const [state, action, pending] = useActionState(
    updateBookingPreferencesAction,
    initialState,
  );

  return (
    <form action={action} className="max-w-[720px] space-y-5">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <fieldset className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <legend className="px-1 text-[15px] font-semibold text-navy">
          When a customer books
        </legend>
        <p className="mt-1 text-[12.5px] text-muted">
          You can change this at any time. Existing appointments keep their
          current status.
        </p>

        <div className="mt-5 space-y-2.5">
          {OPTIONS.map((option) => {
            const active = selected === option.value;
            return (
              <label
                key={option.value}
                className={
                  active
                    ? "flex cursor-pointer items-start gap-3 rounded-xl border border-accent bg-accent-soft/60 p-4"
                    : "flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-[#cfd8e3]"
                }
              >
                <input
                  type="radio"
                  name="bookingMode"
                  value={option.value}
                  checked={active}
                  onChange={() => setSelected(option.value)}
                  className="sr-only"
                />
                <span
                  className={
                    active
                      ? "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-accent-strong shadow-sm"
                      : "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-muted"
                  }
                >
                  <option.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                    {option.title}
                    {active ? (
                      <Check className="size-3.5 text-accent-strong" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-6 text-muted">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={pending}>
          Save preference
        </Button>
      </div>
    </form>
  );
}
