"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-[#f3cdcd] bg-danger-soft text-danger">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-[18px] font-semibold text-navy">
        Something went wrong
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-muted">
        We could not load this page. Your data is safe. Try again, and if it
        keeps happening, sign out and back in.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <a href="/dashboard">Back to overview</a>
        </Button>
      </div>
    </div>
  );
}
