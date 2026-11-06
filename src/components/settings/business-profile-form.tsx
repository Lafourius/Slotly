"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  checkSlugAction,
  deleteLogoAction,
  updateBusinessProfileAction,
} from "@/server/actions/business";
import { CATEGORIES, TIMEZONES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import type { Business } from "@/lib/types";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function BusinessProfileForm({ business }: { business: Business }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateBusinessProfileAction,
    initialState,
  );
  const [slug, setSlug] = useState(business.slug);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [logoPreview, setLogoPreview] = useState<string | null>(
    business.logo_url,
  );
  const [logoCleared, setLogoCleared] = useState(false);
  const [removing, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slug === business.slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await checkSlugAction(slug);
      if (cancelled) return;
      if (result.error) setSlugStatus("invalid");
      else setSlugStatus(result.available ? "available" : "taken");
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, business.slug]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  function removeLogo() {
    startTransition(async () => {
      const result = await deleteLogoAction();
      if (result.success) {
        setLogoPreview(null);
        setLogoCleared(true);
        toast.success("Logo removed");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not remove the logo");
      }
    });
  }

  const slugError =
    state.fieldErrors?.slug ??
    (slugStatus === "taken" ? "That booking link is already taken" : undefined);

  return (
    <form action={action} className="max-w-[820px] space-y-5" noValidate>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-[15px] font-semibold text-navy">Public details</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          These appear on your booking page.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" htmlFor="name" error={state.fieldErrors?.name}>
              <Input
                id="name"
                name="name"
                defaultValue={business.name}
                required
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
            </Field>
            <Field label="Category" htmlFor="category" error={state.fieldErrors?.category}>
              <Select
                id="category"
                name="category"
                defaultValue={business.category}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Short description"
            htmlFor="description"
            error={state.fieldErrors?.description}
            hint="One or two sentences. What do you offer, and who is it for?"
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={business.description}
              maxLength={500}
            />
          </Field>

          <Field
            label="Booking link"
            htmlFor="slug"
            error={slugError}
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={Boolean(slugError)}
            />
            <div className="mt-2 flex items-center gap-1.5 text-[12px]">
              {slugStatus === "checking" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-muted" aria-hidden="true" />
                  <span className="text-muted">Checking…</span>
                </>
              ) : null}
              {slugStatus === "available" && !slugError ? (
                <>
                  <Check className="size-3.5 text-success" aria-hidden="true" />
                  <span className="text-success">Available</span>
                </>
              ) : null}
              {slugStatus === "taken" ? (
                <>
                  <X className="size-3.5 text-danger" aria-hidden="true" />
                  <span className="text-danger">Not available</span>
                </>
              ) : null}
              {slugStatus === "idle" && slug === business.slug ? (
                <span className="text-muted">
                  Changing this link breaks any copies customers already have.
                </span>
              ) : null}
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-[15px] font-semibold text-navy">Contact &amp; location</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Only the business contact details below are shown publicly — never your
          customers’.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Business email" htmlFor="email" error={state.fieldErrors?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={business.email}
              required
            />
          </Field>
          <Field label="Contact number" htmlFor="phone" optional>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={business.phone ?? ""}
            />
          </Field>
          <Field label="City" htmlFor="city" optional>
            <Input id="city" name="city" defaultValue={business.city ?? ""} />
          </Field>
          <Field
            label="Timezone"
            htmlFor="timezone"
            hint="Appointments are stored in UTC and displayed in this timezone."
          >
            <Select
              id="timezone"
              name="timezone"
              defaultValue={business.timezone}
            >
              {TIMEZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-[15px] font-semibold text-navy">Logo</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          PNG, JPG or WebP, up to 2 MB. A square image works best.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-canvas text-[15px] font-bold text-muted">
            {logoPreview && !logoCleared ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Business logo preview"
                className="size-full object-cover"
              />
            ) : (
              business.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setLogoPreview(URL.createObjectURL(file));
                  setLogoCleared(false);
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" />
              {logoPreview ? "Replace image" : "Upload logo"}
            </Button>
            {business.logo_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeLogo}
                loading={removing}
                className="text-muted hover:text-danger"
              >
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        {state.fieldErrors?.logo ? (
          <p className="mt-2 text-[12px] text-danger" role="alert">
            {state.fieldErrors.logo}
          </p>
        ) : null}
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={pending} className="sm:min-w-40">
          Save changes
        </Button>
      </div>
    </form>
  );
}
