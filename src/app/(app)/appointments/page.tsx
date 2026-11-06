import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserRoundX,
} from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchAppointmentsInRange } from "@/server/data/appointments";
import { fetchCustomer } from "@/server/data/customers";
import { PageHeader } from "@/components/layout/page-header";
import { AppointmentListItem } from "@/components/appointments/appointment-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ShareBookingDialog } from "@/components/share/share-booking";
import { cn } from "@/lib/utils";
import { dateKeyInZone, formatLongDate } from "@/lib/booking/time";
import type { AppointmentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Appointments" };

const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

type View = "list" | "day" | "week";

function isView(value: string | undefined): value is View {
  return value === "list" || value === "day" || value === "week";
}

function isStatus(value: string | undefined): value is AppointmentStatus {
  return STATUSES.some((item) => item.value === value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    date?: string;
    status?: string;
    customer?: string;
  }>;
}) {
  const { supabase, business } = await requireBusiness();
  const params = await searchParams;
  const timezone = business.timezone;

  const view: View = isView(params.view) ? params.view : "list";
  const today = DateTime.now().setZone(timezone).startOf("day");
  const todayKey = today.toISODate() ?? "";
  const dateKey =
    params.date && DATE_RE.test(params.date) ? params.date : todayKey;
  const anchor = DateTime.fromISO(dateKey, { zone: timezone }).startOf("day");
  const safeAnchor = anchor.isValid ? anchor : today;

  const status = isStatus(params.status) ? params.status : undefined;
  const customerId = params.customer;
  const customer = customerId
    ? await fetchCustomer(supabase, business.id, customerId)
    : null;

  let rangeStart: DateTime;
  let rangeEnd: DateTime;
  let label: string;
  let prevDate: string | null = null;
  let nextDate: string | null = null;

  if (view === "day") {
    rangeStart = safeAnchor;
    rangeEnd = safeAnchor.plus({ days: 1 });
    label = formatLongDate(safeAnchor.toISO() ?? "", timezone);
    prevDate = safeAnchor.minus({ days: 1 }).toISODate();
    nextDate = safeAnchor.plus({ days: 1 }).toISODate();
  } else if (view === "week") {
    rangeStart = safeAnchor.startOf("week");
    rangeEnd = rangeStart.plus({ days: 7 });
    label = `${rangeStart.toFormat("d LLL")} – ${rangeEnd
      .minus({ days: 1 })
      .toFormat("d LLL yyyy")}`;
    prevDate = rangeStart.minus({ days: 7 }).toISODate();
    nextDate = rangeStart.plus({ days: 7 }).toISODate();
  } else {
    rangeStart = today.minus({ days: 30 });
    rangeEnd = today.plus({ days: 90 });
    label = "All appointments";
  }

  const appointments = await fetchAppointmentsInRange(
    supabase,
    business.id,
    rangeStart.toUTC().toISO() ?? "",
    rangeEnd.toUTC().toISO() ?? "",
    {
      statuses: status ? [status] : undefined,
      customerId: customerId || undefined,
    },
  );

  const grouped = new Map<string, typeof appointments>();
  for (const appointment of appointments) {
    const key = dateKeyInZone(appointment.start_at, timezone);
    const list = grouped.get(key) ?? [];
    list.push(appointment);
    grouped.set(key, list);
  }

  function href(overrides: {
    view?: View;
    date?: string;
    status?: AppointmentStatus | "all";
    customer?: string | null;
  }) {
    const next = new URLSearchParams();
    const nextView = overrides.view ?? view;
    if (nextView !== "list") next.set("view", nextView);
    const nextDate = overrides.date ?? dateKey;
    if (nextView !== "list") next.set("date", nextDate);
    if (overrides.status && overrides.status !== "all") {
      next.set("status", overrides.status);
    } else if (!overrides.status && status) {
      next.set("status", status);
    }
    const nextCustomer =
      overrides.customer === null ? null : (overrides.customer ?? customerId);
    if (nextCustomer) next.set("customer", nextCustomer);
    return `/appointments${next.size ? `?${next.toString()}` : ""}`;
  }

  const dateLabel = (key: string) => {
    const date = DateTime.fromISO(key, { zone: timezone });
    const relative =
      key === todayKey
        ? "Today"
        : key === today.plus({ days: 1 }).toISODate()
          ? "Tomorrow"
          : key === today.minus({ days: 1 }).toISODate()
            ? "Yesterday"
            : null;
    return relative
      ? `${relative} · ${date.toFormat("ccc, d LLL")}`
      : date.toFormat("cccc, d LLLL");
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Review requests, confirm bookings and keep the day moving."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/calendar">
                <CalendarDays aria-hidden="true" />
                Calendar
              </Link>
            </Button>
            <ShareBookingDialog
              slug={business.slug}
              businessName={business.name}
              triggerLabel="Share booking page"
            />
          </>
        }
      />

      <div className="rounded-card border border-line bg-surface p-3 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Appointment view"
              className="inline-flex rounded-lg border border-line bg-canvas p-0.5"
            >
              {(["list", "day", "week"] as const).map((item) => (
                <Link
                  key={item}
                  href={href({ view: item })}
                  aria-current={view === item ? "page" : undefined}
                  className={cn(
                    "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors",
                    view === item
                      ? "bg-surface text-ink shadow-sm"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {item}
                </Link>
              ))}
            </div>

            {view !== "list" ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  asChild
                  aria-label="Previous period"
                >
                  <Link href={href({ date: prevDate ?? dateKey })}>
                    <ChevronLeft aria-hidden="true" />
                  </Link>
                </Button>
                <p className="min-w-[150px] text-center text-[12.5px] font-semibold text-ink sm:min-w-[190px]">
                  {label}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  asChild
                  aria-label="Next period"
                >
                  <Link href={href({ date: nextDate ?? dateKey })}>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </Button>
                {view === "week" || dateKey !== todayKey ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={href({ date: todayKey })}>Today</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <form
            method="get"
            action="/appointments"
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="view" value={view} />
            {customer ? (
              <input type="hidden" name="customer" value={customer.id} />
            ) : null}
            {view !== "list" ? (
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="date-filter"
                  className="text-[11.5px] font-medium text-muted"
                >
                  Date
                </label>
                <Input
                  id="date-filter"
                  name="date"
                  type="date"
                  defaultValue={dateKey}
                  className="h-9 w-[150px] text-[12px]"
                />
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted" aria-hidden="true" />
              <Select
                name="status"
                defaultValue={status ?? "all"}
                aria-label="Filter by status"
                className="h-9 w-[132px] text-[12px]"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Apply
            </Button>
          </form>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <Link
            href={href({ status: "all" })}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
              !status
                ? "bg-navy text-white"
                : "border border-line bg-surface text-muted hover:text-ink",
            )}
          >
            All
          </Link>
          {STATUSES.map((item) => (
            <Link
              key={item.value}
              href={href({ status: item.value })}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                status === item.value
                  ? "bg-navy text-white"
                  : "border border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-auto text-[11.5px] text-muted">
            {appointments.length}{" "}
            {appointments.length === 1 ? "appointment" : "appointments"}
          </span>
        </div>
      </div>

      {customer ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-control border border-accent/25 bg-accent-soft px-3.5 py-2.5">
          <p className="text-[12px] font-medium text-[#0b6f6b]">
            Showing appointments for{" "}
            <strong className="font-semibold">{customer.name}</strong>
          </p>
          <Link
            href={href({ customer: null })}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0b6f6b] hover:underline"
          >
            <UserRoundX className="size-3.5" aria-hidden="true" />
            Clear
          </Link>
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {appointments.length === 0 ? (
          <div className="rounded-card border border-line bg-surface shadow-card">
            <EmptyState
              icon={CalendarPlus}
              title="No appointments here"
              description={
                status
                  ? `There are no ${status} appointments in this range. Try another status or date.`
                  : view === "list"
                    ? "New bookings will appear here. Share your link to start taking appointments."
                    : "There are no appointments in this period. Try another date."
              }
              action={
                <ShareBookingDialog
                  slug={business.slug}
                  businessName={business.name}
                  triggerLabel="Share booking page"
                  size="sm"
                />
              }
            />
          </div>
        ) : (
          Array.from(grouped.entries()).map(([key, items]) => (
            <section key={key}>
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {dateLabel(key)}
                </h2>
                <div className="flex items-center gap-1.5">
                  <Badge tone="neutral">{items.length}</Badge>
                  {items.some((item) => item.status === "pending") ? (
                    <Badge tone="warning">
                      {items.filter((item) => item.status === "pending").length}{" "}
                      pending
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
                <ul className="divide-y divide-line">
                  {items.map((appointment) => (
                    <li key={appointment.id}>
                      <AppointmentListItem
                        appointment={appointment}
                        timezone={timezone}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))
        )}
      </div>

      {status ? (
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted">
          <StatusBadge status={status} />
          Filtering by this status.
        </p>
      ) : null}
    </div>
  );
}
