import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  error: {
    wrap: "border-[#f3cdcd] bg-danger-soft text-[#9b2f2f]",
    Icon: AlertCircle,
  },
  success: {
    wrap: "border-[#c9e8da] bg-success-soft text-[#0f6142]",
    Icon: CheckCircle2,
  },
  info: {
    wrap: "border-[#cfe1ec] bg-[#edf5fa] text-[#27536b]",
    Icon: Info,
  },
} as const;

export function Alert({
  variant = "info",
  children,
  className,
  role,
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
  role?: string;
}) {
  const { wrap, Icon } = variants[variant];
  return (
    <div
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={cn(
        "flex items-start gap-2.5 rounded-control border px-3.5 py-3 text-[13px] leading-5",
        wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
