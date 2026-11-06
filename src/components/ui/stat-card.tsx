import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  accent: "bg-accent-soft text-[#0b6f6b]",
  warning: "bg-warning-soft text-[#9a6414]",
  success: "bg-success-soft text-success",
  neutral: "bg-[#f1f4f8] text-[#4b5563]",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted">{label}</p>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            TONES[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy tabular">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[11.5px] text-muted">{hint}</p> : null}
    </div>
  );
}
