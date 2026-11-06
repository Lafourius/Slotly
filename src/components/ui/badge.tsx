import * as React from "react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";

const tone = {
  neutral: "bg-[#f1f4f8] text-[#4b5563] ring-[#e3e8ef]",
  accent: "bg-accent-soft text-[#0b6f6b] ring-[#c6ecea]",
  success: "bg-success-soft text-success ring-[#c9e8da]",
  warning: "bg-warning-soft text-[#9a6414] ring-[#f2ddb9]",
  danger: "bg-danger-soft text-danger ring-[#f5d0d0]",
} as const;

export function Badge({
  tone: toneName = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none ring-1 ring-inset",
        tone[toneName],
        className,
      )}
      {...props}
    />
  );
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; tone: keyof typeof tone }
> = {
  pending: { label: "Pending approval", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "danger" },
  completed: { label: "Completed", tone: "accent" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <Badge tone={config.tone} className={className}>
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current opacity-80"
      />
      {config.label}
    </Badge>
  );
}

export { statusConfig };
