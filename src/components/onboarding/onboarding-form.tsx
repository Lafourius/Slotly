"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import {
  Check,
  ImagePlus,
  Link2,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { createBusinessAction, checkSlugAction } from "@/server/actions/business";
import { CATEGORIES, TIMEZONES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

type SlugStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; message: string };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    createBusinessAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<SlugStatus>({ state: "idle" });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setStatus({ state: "idle" });
      return;
    }
    setStatus({ state: "checking" });
    const controller = { cancelled: false };
    const timer = window.setTimeout(async () => {
      const result = await checkSlugAction(slug);
      if (controller.cancelled) return;
      if (result.error) {
        setStatus({ state: "taken", message: result.error });
      } else if (result.available) {
        setStatus({ state: "available" });
      } else {
        setStatus({ state: "taken", message: "That link is already taken" });
      }
    }, 450);

    return () => {
      controller.cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const slugMessage =
    state.fieldErrors?.slug ??
    (status.state === "taken" ? status.message : undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-navy">Business details</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            This is what customers see at the top of your booking page.
          </p>
        </div>

        <div className="space-y-4">
          <Field
            label="Business name"
            htmlFor="name"
            error={state.fieldErrors?.name}
          >
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Bright Tuition"
              autoComplete="organization"
              required
              aria-invalid={Boolean(state.fieldErrors?.name)}
            />
          </Field>

          <Field
            label="Category"
            htmlFor="category"
            error={state.fieldErrors?.category}
          >
            <Select
              id="category"
              name="category"
              defaultValue="tutoring"
              required
              aria-invalid={Boolean(state.fieldErrors?.category)}
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Short description"
            htmlFor="description"
            hint="One or two lines. Mention what you teach or do and who it’s for."
            error={state.fieldErrors?.description}
          >
            <Textarea
              id="description"
              name="description"
              placeholder="One-to-one maths tutoring for classes 8–12, online and in Indiranagar."
              maxLength={500}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Business email"
              htmlFor="email"
              error={state.fieldErrors?.email}
            >
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="hello@brighttuition.in"
                required
                aria-invalid={Boolean(state.fieldErrors?.email)}
              />
            </Field>
            <Field
              label="Contact number"
              htmlFor="phone"
              optional
              error={state.fieldErrors?.phone}
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="City"
              htmlFor="city"
              optional
              error={state.fieldErrors?.city}
            >
              <Input
                id="city"
                name="city"
                placeholder="Bengaluru"
                autoComplete="address-level2"
              />
            </Field>
            <Field
              label="Timezone"
              htmlFor="timezone"
              hint="All appointments are shown in this timezone."
              error={state.fieldErrors?.timezone}
            >
              <Select id="timezone" name="timezone" defaultValue="Asia/Kolkata">
                {TIMEZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-navy">
            Your booking link
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Keep it short and easy to say out loud. You can change it later if
            the new one is free.
          </p>
        </div>

        <Field
          label="Booking link"
          htmlFor="slug"
          error={slugMessage}
          hint={undefined}
        >
          <div className="flex items-stretch">
            <span className="hidden items-center rounded-l-control border border-r-0 border-line bg-canvas px-3 text-[12px] text-muted sm:flex">
              {origin ? origin.replace(/^https?:\/\//, "") : "slotly.app"}/book/
            </span>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="bright-tuition"
              className="rounded-l-none sm:rounded-l-none"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              aria-invalid={Boolean(slugMessage)}
            />
          </div>
        </Field>

        <div className="mt-3 flex min-h-5 items-center gap-2 text-[12px]">
          {status.state === "checking" ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-muted" aria-hidden="true" />
              <span className="text-muted">Checking availability…</span>
            </>
          ) : null}
          {status.state === "available" && !state.fieldErrors?.slug ? (
            <>
              <Check className="size-3.5 text-success" aria-hidden="true" />
              <span className="text-success">That link is available</span>
            </>
          ) : null}
          {status.state === "taken" ? (
            <>
              <X className="size-3.5 text-danger" aria-hidden="true" />
              <span className="text-danger">{status.message}</span>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-canvas px-3.5 py-3">
          <Link2 className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Public URL
            </p>
            <p className="truncate text-[12.5px] font-semibold text-ink">
              {origin || "https://slotly.app"}/book/{slug || "your-business"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-[15px] font-semibold text-navy">Logo</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Optional. A square image works best. PNG, JPG or WebP up to 2 MB.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-canvas">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Selected logo preview"
                className="size-full object-cover"
              />
            ) : (
              <MapPin className="size-5 text-muted" aria-hidden="true" />
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setLogoPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" />
              Choose image
            </Button>
            {state.fieldErrors?.logo ? (
              <p className="mt-2 text-[12px] text-danger" role="alert">
                {state.fieldErrors.logo}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted">
          Next you’ll add a service and set your hours.
        </p>
        <Button type="submit" size="lg" loading={pending} className="sm:min-w-52">
          Create business &amp; continue
        </Button>
      </div>
    </form>
  );
}
