import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchDashboardData } from "@/server/data/appointments";
import { fetchServices } from "@/server/data/services";
import { fetchAvailability } from "@/server/data/availability";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AppointmentListItem } from "@/components/appointments/appointment-list-item";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { ShareBookingDialog } from "@/components/share/share-booking";
import { FlashToast } from "@/components/ui/flash-toast";
import { formatTime } from "@/lib/booking/time";
import { displayName } from "@/server/auth";

export const metadata: Metadata = { title: "Overview" };

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const { user, business, supabase } = await requireBusiness();
  const params = await searchParams;

  const [dashboard, services, availability] = await Promise.all([
    fetchDashboardData(supabase, business.id, business.timezone),
    fetchServices(supabase, business.id, false),
    fetchAvailability(supabase, business.id),
  ]);

  const now = DateTime.now().setZone(business.timezone);
  const firstName = displayName(user).split(" ")[0] ?? "there";
  const hasAvailability = availability.rules.some((rule) => rule.is_active);
  const pendingUpcoming = dashboard.upcoming.filter(
    (appointment) => appointment.status === "pending",
  );
  const comingUp = dashboard.upcoming
    .filter((appointment) => appointment.status !== "pending")
    .slice(0, 4);

  return (
    <div>
      {params.onboarding === "done" ? (
        <FlashToast message="Your business is ready. Add a service to start taking bookings." />
      ) : null}

      <PageHeader
        eyebrow={now.toFormat("cccc, d LLLL")}
        title={`${greeting(now.hour)}, ${firstName}`}
        description="Here’s what your day looks like, and anything waiting on you."
        actions={
          <ShareBookingDialog
            slug={business.slug}
            businessName={business.name}
            triggerLabel="Share booking page"
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today"
          value={dashboard.todayCount}
          hint={dashboard.todayCount === 1 ? "1 appointment" : "appointments"}
          icon={CalendarClock}
          tone="accent"
        />
        <StatCard
          label="Pending requests"
          value={dashboard.pendingCount}
          hint="Waiting for your decision"
          icon={Inbox}
          tone="warning"
        />
        <StatCard
          label="Completed"
          value={dashboard.completedCount}
          hint="All time"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Cancelled"
          value={dashboard.cancelledCount}
          hint="All time"
          icon={CalendarX2}
          tone="neutral"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-4 sm:flex-row">
            <div>
              <CardTitle>Today’s schedule</CardTitle>
              <p className="mt-1 text-[12px] text-muted">
                {now.toFormat("cccc, d LLLL")} · times in {business.timezone.replace("_", " ")}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/appointments">View all</Link>
            </Button>
          </CardHeader>
          {dashboard.today.length === 0 ? (
            <EmptyState
              icon={CalendarCheck2}
              title="Nothing booked today"
              description="When a customer books, their appointment will appear here with the time and service."
              action={
                <ShareBookingDialog
                  slug={business.slug}
                  businessName={business.name}
                  triggerLabel="Share booking page"
                  size="sm"
                />
              }
            />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {dashboard.today.map((appointment) => (
                <li key={appointment.id}>
                  <AppointmentListItem
                    appointment={appointment}
                    timezone={business.timezone}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Needs your approval</CardTitle>
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-[#9a6414]">
                  {dashboard.pendingCount}
                </span>
              </div>
            </CardHeader>
            {pendingUpcoming.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No pending requests"
                description="If you choose manual approval, new bookings will wait here for a yes or no."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {pendingUpcoming.slice(0, 4).map((appointment) => (
                  <li key={appointment.id}>
                    <AppointmentListItem
                      appointment={appointment}
                      timezone={business.timezone}
                      showDate
                      dateLabel={DateTime.fromISO(appointment.start_at)
                        .setZone(business.timezone)
                        .toFormat("ccc d LLL")}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Coming up</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/calendar">
                    Calendar
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            {comingUp.length === 0 ? (
              <EmptyState
                icon={CalendarCheck2}
                title="Your week is clear"
                description="Confirmed appointments in the next two weeks will show up here."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {comingUp.map((appointment) => (
                  <li key={appointment.id}>
                    <AppointmentListItem
                      appointment={appointment}
                      timezone={business.timezone}
                      showDate
                      dateLabel={DateTime.fromISO(appointment.start_at)
                        .setZone(business.timezone)
                        .toFormat("ccc d LLL")}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <SetupChecklist
          hasService={services.some((service) => service.is_active)}
          hasAvailability={hasAvailability}
        />

        <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-strong">
              Your booking page
            </p>
            <p className="mt-1 truncate text-[14px] font-semibold text-navy">
              /book/{business.slug}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {business.booking_mode === "auto"
                ? "New bookings are confirmed automatically."
                : "New bookings wait for your approval."}
              {" "}
              Last appointment today at{" "}
              {dashboard.today.length > 0
                ? formatTime(
                    dashboard.today[dashboard.today.length - 1]?.start_at ?? "",
                    business.timezone,
                  )
                : "—"}
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link href={`/book/${business.slug}`} target="_blank" rel="noreferrer">
                Open page
              </Link>
            </Button>
            <ShareBookingDialog
              slug={business.slug}
              businessName={business.name}
              triggerLabel="Copy link"
              variant="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
