import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[15px] text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors placeholder:text-[#9aa3af]",
        "hover:border-[#d3dbe6] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15",
        "disabled:cursor-not-allowed disabled:bg-[#f2f5f9] disabled:text-muted",
        "aria-invalid:border-danger aria-invalid:ring-danger/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[96px] w-full resize-y rounded-control border border-line bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-ink transition-colors placeholder:text-[#9aa3af]",
        "hover:border-[#d3dbe6] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-11 w-full appearance-none rounded-control border border-line bg-surface bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat px-3.5 pr-10 text-[15px] text-ink transition-colors",
        "hover:border-[#d3dbe6] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15",
        "disabled:cursor-not-allowed disabled:bg-[#f2f5f9] disabled:text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4.5 cursor-pointer rounded-[5px] border border-[#c9d2de] bg-surface accent-accent",
        className,
      )}
      {...props}
    />
  );
}
