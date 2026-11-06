import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <div className="page-shell flex h-16 items-center">
        <Brand />
      </div>
      <div className="page-shell flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl border border-line bg-canvas text-muted">
            <CalendarX2 className="size-5" aria-hidden="true" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
            404
          </p>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-navy">
            This page doesn’t exist
          </h1>
          <p className="mt-2 text-[13.5px] leading-6 text-muted">
            The link may be old or mistyped. If you were looking for a business’s
            booking page, check the address with them.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/">Go to Slotly</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/login">Business sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
