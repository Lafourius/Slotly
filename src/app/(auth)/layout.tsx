import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { Brand } from "@/components/layout/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(22,166,160,0.22),transparent_62%)]"
        />
        <Brand variant="light" />

        <div className="relative mt-auto mb-auto max-w-[380px] pt-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Booking, minus the chaos
          </p>
          <h2 className="mt-4 text-[34px] font-semibold leading-[1.12] tracking-[-0.03em]">
            Less time coordinating.
            <br />
            More time doing the work.
          </h2>
          <p className="mt-4 text-[13.5px] leading-7 text-white/60">
            One booking page, one dashboard, and a schedule that stays accurate
            without you checking it twice.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Customers book without an account",
              "No double bookings, ever",
              "Set up in about fifteen minutes",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[13px] text-white/75">
                <span className="grid size-5 place-items-center rounded-full bg-accent/15 text-accent">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[11.5px] text-white/40">
          <span>Made for independent businesses in India</span>
          <span className="tabular">slotly</span>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:h-20">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Back to home
          </Link>
        </div>
        <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:px-8 sm:pt-8">
          <div className="w-full max-w-[404px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
