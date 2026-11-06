import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[13px] font-semibold text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? (
          <span className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            Optional
          </span>
        ) : null}
      </div>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-[12.5px] font-medium leading-5 text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
