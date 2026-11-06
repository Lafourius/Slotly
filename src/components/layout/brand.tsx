import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  variant = "dark",
  className,
}: {
  href?: string;
  variant?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Slotly home"
    >
      <span className="grid size-8 place-items-center rounded-[10px] bg-accent text-white shadow-[0_2px_6px_rgba(22,166,160,0.32)]">
        <CalendarCheck2 className="size-[17px]" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span
        className={cn(
          "text-[15px] font-bold tracking-[0.16em]",
          variant === "light" ? "text-white" : "text-navy",
        )}
      >
        SLOTLY
      </span>
    </Link>
  );
}
