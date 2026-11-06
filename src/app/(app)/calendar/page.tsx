import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchAppointmentsInRange } from "@/server/data/appointments";
import { PageHeader } from "@/components/layout/page-header";
import { AppointmentListItem } from "@/components/appointments/appointment-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ShareBookingDialog } from "@/components/share/share-booking";
import { dateKeyInZone, formatLongDate } from "@/lib/booking/time";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/types";

export const metadata: Metadata = { title: "Calendar" };

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_DOT: Record<string, string> = {
  pending: "bg-warning",
  confirmed: "bg-success",
  completed: "bg-accent",
  cancelled: "bg-danger/60",
  rejected: "bg-danger/40",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const { supabase, business } = await requireBusiness();
  const params = await searchParams;
  const timezone = business.timezone;
  const today = DateTime.now().setZone(timezone).startOf("day");
  const monthKey =
    params.month && MONTH_RE.test(params.month)
      ? params.month
      : today.toFormat("yyyy-MM");

  const monthStart = DateTime.fromISO(`${monthKey}-01`, { zone: timezone })
    .startOf("month")
    .startOf("day");
  const gridStart = monthStart.startOf("week");
  const gridEnd = gridStart.plus({ days: 42 });

  const appointments = await fetchAppointmentsInRange(
    supabase,
    business.id,
    gridStart.toUTC().toISO() ?? "",
    gridEnd.toUTC().toISO() ?? "",
  );

  const byDate = new Map<string, AppointmentWithRelations[]>();
  for (const appointment of appointments) {
    const key = dateKeyInZone(appointment.start_at, timezone);
    const list = byDate.get(key) ?? [];
    list.push(appointment);
    byDate.set(key, list);
  }

  const selectedKey =
    params.date && DATE_RE.test(params.date)
      ? params.date
      : monthStart.hasSame(today, "month")
        ? today.toISODate() ?? ""
        : monthStart.toISODate() ?? "";

  const selectedAppointments = (byDate.get(selectedKey) ?? []).filter(
    (appointment) =>
      appointment.status !== "cancelled" && appointment.status !== "rejected",
  );

  const cells = Array.from({ length: 42 }, (_, index) =>
    gridStart.plus({ days: index }),
  );

  const monthLabel = monthStart.toFormat("LLLL yyyy");
  const prevMonth = monthStart.minus({ months: 1 }).toFormat("yyyy-MM");
  const nextMonth = monthStart.plus({ months: 1 }).toFormat("yyyy-MM");

  const monthAppointments = appointments.filter((appointment) => {
    const date = DateTime.fromISO(appointment.start_at).setZone(timezone);
    return date.hasSame(monthStart, "month");
  });

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="See the shape of your month, then open any day to manage it."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/appointments">List view</Link>
            </Button>
            <ShareBookingDialog
              slug={business.slug}
              businessName={business.name}
              triggerLabel="Share booking page"
            />
          </>
        }
      />

      <div className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              asChild
              aria-label="Previous month"
            >
              <Link href={`/calendar?month=${prevMonth}`}>
                <ChevronLeft aria-hidden="true" />
              </Link>
            </Button>
            <h2 className="min-w-[150px] text-center text-[14px] font-semibold text-navy sm:min-w-[180px]">
              {monthLabel}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              asChild
              aria-label="Next month"
            >
              <Link href={`/calendar?month=${nextMonth}`}>
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">Today</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-warning" />
              Pending
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              Confirmed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" />
              Completed
            </span>
            <span className="ml-1 font-medium text-ink">
              {monthAppointments.length} this month
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-line bg-canvas/60">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const key = cell.toISODate() ?? "";
            const items = (byDate.get(key) ?? []).filter(
              (appointment) =>
                appointment.status !== "cancelled" &&
                appointment.status !== "rejected",
            );
            const inMonth = cell.hasSame(monthStart, "month");
            const isToday = cell.hasSame(today, "day");
            const selected = key === selectedKey;
            const pending = items.some((item) => item.status === "pending");
            const confirmed = items.some((item) => item.status === "confirmed");

            return (
              <Link
                key={key}
                href={`/calendar?month=${monthKey}&date=${key}`}
                aria-current={selected ? "date" : undefined}
                aria-label={`${cell.toFormat("cccc d LLLL")}, ${items.length} appointments`}
                className={cn(
                  "relative min-h-[58px] border-b border-r border-line p-1.5 transition-colors last:border-r-0 sm:min-h-[86px] sm:p-2",
                  selected ? "bg-accent-soft/70" : "hover:bg-canvas",
                  !inMonth && "bg-[#fbfcfe]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold sm:text-[12px]",
                    isToday
                      ? "bg-navy text-white"
                      : selected
                        ? "bg-accent text-white"
                        : inMonth
                          ? "text-ink"
                          : "text-[#b3bcc7]",
                  )}
                >
                  {cell.day}
                </span>

                {items.length > 0 ? (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {pending ? (
                      <span className="size-1.5 rounded-full bg-warning sm:size-2" />
                    ) : null}
                    {confirmed ? (
                      <span className="size-1.5 rounded-full bg-success sm:size-2" />
                    ) : null}
                    {!pending && !confirmed ? (
                      <span className="size-1.5 rounded-full bg-accent sm:size-2" />
                    ) : null}
                    <span className="text-[9.5px] font-semibold text-muted sm:hidden">
                      {items.length}
                    </span>
                  </div>
                ) : null}

                <div className="mt-1 hidden space-y-0.5 sm:block">
                  {items.slice(0, 2).map((appointment) => (
                    <p
                      key={appointment.id}
                      className="truncate rounded bg-surface/80 px-1 py-0.5 text-[9.5px] text-muted"
                    >
                      {DateTime.fromISO(appointment.start_at)
                        .setZone(timezone)
                        .toFormat("h:mm a")
                        .toLowerCase()}{" "}
                      {appointment.customer?.name?.split(" ")[0] ?? ""}
                    </p>
                  ))}
                  {items.length > 2 ? (
                    <p className="px-1 text-[9.5px] font-medium text-muted">
                      +{items.length - 2} more
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-[13px] font-semibold text-navy">
            {formatLongDate(
              `${selectedKey}T12:00:00`,
              timezone,
            )}
          </h2>
          <Link
            href={`/appointments?view=day&date=${selectedKey}`}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-accent-strong hover:underline"
          >
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Open day view
          </Link>
        </div>

        {selectedAppointments.length === 0 ? (
          <div className="rounded-card border border-line bg-surface shadow-card">
            <EmptyState
              icon={CalendarDays}
              title="A clear day"
              description="No active appointments on this date. Tap another day or share your booking link."
              className="py-10"
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <ul className="divide-y divide-line">
              {selectedAppointments.map((appointment) => (
                <li key={appointment.id}>
                  <AppointmentListItem
                    appointment={appointment}
                    timezone={timezone}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
