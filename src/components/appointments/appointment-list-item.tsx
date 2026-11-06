import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatTime } from "@/lib/booking/time";
import { formatDuration } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/types";

export function AppointmentListItem({
  appointment,
  timezone,
  showDate = false,
  dateLabel,
}: {
  appointment: AppointmentWithRelations;
  timezone: string;
  showDate?: boolean;
  dateLabel?: string;
}) {
  const customerName = appointment.customer?.name ?? "Customer";
  const serviceName = appointment.service?.name ?? "Appointment";

  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas/70 sm:px-5"
    >
      <div className="w-[64px] shrink-0">
        <p className="text-[12.5px] font-semibold text-navy tabular">
          {formatTime(appointment.start_at, timezone)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
          <Clock3 className="size-2.5" aria-hidden="true" />
          {formatDuration(appointment.service?.duration_minutes ?? 30)}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-ink">
            {customerName}
          </p>
          <StatusBadge status={appointment.status} className="hidden sm:inline-flex" />
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">
          {showDate && dateLabel ? `${dateLabel} · ` : ""}
          {serviceName}
        </p>
        <div className="mt-1 sm:hidden">
          <StatusBadge status={appointment.status} />
        </div>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-[#c3cbd6] transition-transform group-hover:translate-x-0.5 group-hover:text-muted"
        aria-hidden="true"
      />
    </Link>
  );
}
