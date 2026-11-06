import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, LogOut } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getAuth, getCurrentBusiness, displayName } from "@/server/auth";
import { logoutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Set up your business" };

const STEPS = [
  { label: "Business details", state: "current" as const },
  { label: "Add a service", state: "upcoming" as const },
  { label: "Set hours & share", state: "upcoming" as const },
];

export default async function OnboardingPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/onboarding");

  const business = await getCurrentBusiness(auth);
  if (business) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="page-shell flex h-16 items-center justify-between">
          <Brand href="/dashboard" />
          <div className="flex items-center gap-3">
            <span className="hidden text-[12.5px] text-muted sm:block">
              {displayName(auth.user)}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="page-shell max-w-[840px] py-8 sm:py-12">
        <div className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
            Step 1 of 3
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-navy sm:text-[32px]">
            Let’s set up your booking page
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-muted">
            Tell customers who you are and what you do. Everything here can be
            changed later from settings.
          </p>

          <ol className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            {STEPS.map((step, index) => (
              <li key={step.label} className="flex items-center gap-2">
                <span
                  className={
                    step.state === "current"
                      ? "grid size-6 place-items-center rounded-full bg-navy text-[11px] font-bold text-white"
                      : "grid size-6 place-items-center rounded-full border border-line bg-surface text-[11px] font-semibold text-muted"
                  }
                >
                  {index + 1}
                </span>
                <span
                  className={
                    step.state === "current"
                      ? "text-[12px] font-semibold text-ink"
                      : "text-[12px] text-muted"
                  }
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 ? (
                  <span className="mx-1 hidden h-px w-6 bg-line sm:block" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <OnboardingForm />

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted">
          <Check className="size-3.5 text-success" aria-hidden="true" />
          Your data is private. Only you can see bookings and customer details.
          <Link href="/" className="ml-1 underline-offset-2 hover:underline">
            Learn more
          </Link>
        </p>
      </main>
    </div>
  );
}
