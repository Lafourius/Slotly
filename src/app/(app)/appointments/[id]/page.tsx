import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import {
  ArrowLeft,
  CalendarCheck2,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchAppointmentById } from "@/server/data/appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import { formatDuration } from "@/lib/utils";
import { formatLongDate, formatTime } from "@/lib/booking/time";

export const metadata: Metadata = { title: "Appointment" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, business } = await requireBusiness();
  const appointment = await fetchAppointmentById(supabase, business.id, id);

  if (!appointment) notFound();

  const customer = appointment.customer;
  const start = formatTime(appointment.start_at, business.timezone);
  const end = formatTime(appointment.end_at, business.timezone);
  const date = formatLongDate(appointment.start_at, business.timezone);
  const reference = `SLT-${appointment.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const createdAt = DateTime.fromISO(appointment.created_at)
    .setZone(business.timezone)
    .toFormat("d LLL yyyy, h:mm a");

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to appointments
      </Link>

      <div className="mt-4 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-navy">
              {customer?.name ?? "Appointment"}
            </h1>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {date} · {start} – {end} · {business.timezone.replace("_", " ")} ·
            Reference {reference}
          </p>
        </div>
        <p className="text-[11.5px] text-muted">Requested {createdAt}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <DetailRow
                icon={CalendarCheck2}
                label="Service"
                value={appointment.service?.name ?? "Service removed"}
              />
              <DetailRow
                icon={Clock3}
                label="When"
                value={`${date} · ${start} – ${end}`}
              />
              <DetailRow
                icon={Clock3}
                label="Duration"
                value={formatDuration(
                  appointment.service?.duration_minutes ?? 30,
                )}
              />
              <DetailRow
                icon={UserRound}
                label="Timezone"
                value={business.timezone.replace("_", " ")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer notes</CardTitle>
            </CardHeader>
            <CardContent>
              {appointment.customer_notes ? (
                <p className="whitespace-pre-line rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] leading-6 text-ink">
                  {appointment.customer_notes}
                </p>
              ) : (
                <p className="text-[13px] text-muted">
                  The customer didn’t add any notes.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l border-line pl-5">
                <li>
                  <span className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-accent" />
                  <p className="text-[12.5px] font-semibold text-ink">
                    Booking requested
                  </p>
                  <p className="text-[11.5px] text-muted">{createdAt}</p>
                </li>
                <li>
                  <span className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-[#c9d2de]" />
                  <p className="text-[12.5px] font-semibold text-ink">
                    Current status: {appointment.status}
                  </p>
                  <p className="text-[11.5px] text-muted">
                    Updated{" "}
                    {DateTime.fromISO(appointment.updated_at)
                      .setZone(business.timezone)
                      .toFormat("d LLL yyyy, h:mm a")}
                  </p>
                </li>
                <li>
                  <span className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-[#c9d2de]" />
                  <p className="text-[12.5px] font-semibold text-ink">
                    Scheduled start
                  </p>
                  <p className="text-[11.5px] text-muted">
                    {date} · {start}
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentActions
                appointmentId={appointment.id}
                status={appointment.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[14px] font-semibold text-ink">
                {customer?.name ?? "Customer removed"}
              </p>
              {customer?.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 text-[12.5px] text-muted hover:text-accent-strong"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  <span className="truncate">{customer.email}</span>
                </a>
              ) : null}
              {customer?.phone ? (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-2 text-[12.5px] text-muted hover:text-accent-strong"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {customer.phone}
                </a>
              ) : null}
              {!customer?.email && !customer?.phone ? (
                <p className="flex items-center gap-2 text-[12.5px] text-muted">
                  <MessageSquare className="size-3.5" aria-hidden="true" />
                  No contact details
                </p>
              ) : null}
              <Link
                href={`/appointments?customer=${appointment.customer_id}`}
                className="inline-flex items-center gap-1.5 pt-1 text-[12px] font-semibold text-accent-strong hover:underline"
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                View booking history
              </Link>
            </CardContent>
          </Card>

          <p className="px-1 text-[11.5px] text-muted">
            Payment is handled directly between you and the customer. Slotly
            does not collect payments.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-muted">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
