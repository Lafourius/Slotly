import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { CalendarX2, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { BookingFlow } from "@/components/public/booking-flow";
import {
  fetchBookingContext,
  fetchPublicBusinessPage,
  findFirstAvailableDate,
  isDateWithinHorizon,
  slotsForDate,
} from "@/server/booking";
import { BOOKING_HORIZON_DAYS, CATEGORY_LABELS } from "@/lib/constants";
import { todayKey } from "@/lib/booking/time";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPublicBusinessPage(slug);
  if (!page) return { title: "Booking page not found" };
  return {
    title: `Book with ${page.business.name}`,
    description:
      page.business.description ||
      `Choose a service and book an appointment with ${page.business.name}.`,
    robots: { index: false },
  };
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; date?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await fetchPublicBusinessPage(slug);

  if (!page) notFound();

  const { business, services } = page;
  const today = todayKey(business.timezone);
  const categoryLabel =
    CATEGORY_LABELS[business.category] ?? "Independent business";

  if (services.length === 0) {
    return (
      <PublicShell businessName={business.name}>
        <div className="mx-auto max-w-lg rounded-card border border-line bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-canvas text-muted">
            <CalendarX2 className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-[20px] font-semibold text-navy">
            {business.name} isn’t taking bookings online yet
          </h1>
          <p className="mt-2 text-[13.5px] leading-6 text-muted">
            There are no services available right now. Check back later or
            contact {business.name} directly.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block text-[12.5px] font-semibold text-accent-strong hover:underline"
          >
            Powered by Slotly
          </Link>
        </div>
      </PublicShell>
    );
  }

  const selectedService =
    services.find((service) => service.id === query.service) ?? services[0]!;

  const context = await fetchBookingContext(slug, selectedService.id);
  if (!context) notFound();

  const requestedDate =
    query.date && isDateWithinHorizon(query.date, business.timezone)
      ? query.date
      : undefined;
  const firstAvailable = findFirstAvailableDate(context, requestedDate);
  const initialDate = requestedDate ?? firstAvailable ?? today;
  const initialSlots = requestedDate
    ? slotsForDate(context, requestedDate)
    : firstAvailable
      ? slotsForDate(context, firstAvailable)
      : [];

  const start = DateTime.fromISO(today, { zone: business.timezone }).startOf(
    "day",
  );
  const dateOptions = Array.from({ length: 14 }, (_, index) => {
    const date = start.plus({ days: index });
    return {
      key: date.toISODate() ?? "",
      weekday: date.toFormat("ccc"),
      day: date.toFormat("d"),
      month: date.toFormat("LLL"),
    };
  });
  if (!dateOptions.some((option) => option.key === initialDate)) {
    const extra = DateTime.fromISO(initialDate, { zone: business.timezone });
    if (extra.isValid) {
      dateOptions.push({
        key: initialDate,
        weekday: extra.toFormat("ccc"),
        day: extra.toFormat("d"),
        month: extra.toFormat("LLL"),
      });
      dateOptions.sort((a, b) => (a.key < b.key ? -1 : 1));
    }
  }

  const maxDate = start.plus({ days: BOOKING_HORIZON_DAYS }).toISODate() ?? "";

  return (
    <PublicShell businessName={business.name}>
      <div className="mb-5 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-canvas text-[15px] font-bold text-navy">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo_url}
                alt={`${business.name} logo`}
                className="size-full object-cover"
              />
            ) : (
              business.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-navy sm:text-[26px]">
                {business.name}
              </h1>
              <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                {categoryLabel}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">
              {business.city ? `${business.city} · ` : ""}
              {business.timezone.replace("_", " ")}
            </p>
            {business.description ? (
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
                {business.description}
              </p>
            ) : null}
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {business.booking_mode === "auto"
                ? "Instant confirmation"
                : "Requests reviewed by the business"}
            </p>
          </div>
        </div>
      </div>

      <BookingFlow
        slug={business.slug}
        businessName={business.name}
        timezone={business.timezone}
        bookingMode={business.booking_mode}
        services={services}
        initialService={selectedService}
        initialDate={initialDate}
        initialSlots={initialSlots}
        dateOptions={dateOptions}
        today={today}
        maxDate={maxDate}
      />

      <p className="mt-8 flex flex-wrap items-center justify-center gap-1.5 px-2 text-center text-[11.5px] text-muted">
        <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
        Your details are only shared with {business.name}. No account required.
        <span className="text-[#c3cbd6]">·</span>
        Powered by{" "}
        <Link href="/" className="font-semibold text-ink hover:underline">
          Slotly
        </Link>
      </p>
    </PublicShell>
  );
}

function PublicShell({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="page-shell flex h-16 items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2 text-[11.5px] text-muted">
            <span className="hidden sm:inline">Booking with</span>
            <span className="max-w-[150px] truncate font-semibold text-ink sm:max-w-none">
              {businessName}
            </span>
          </div>
        </div>
      </header>
      <main className="page-shell max-w-[1080px] py-6 sm:py-8">{children}</main>
    </div>
  );
}
