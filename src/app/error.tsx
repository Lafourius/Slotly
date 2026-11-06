"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-[#f3cdcd] bg-danger-soft text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-[18px] font-semibold text-navy">
          Something went wrong
        </h1>
        <p className="mt-2 text-[13.5px] leading-6 text-muted">
          Please try again. If the problem continues, come back in a moment.
        </p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
