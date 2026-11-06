import Link from "next/link";
import { ArrowRight, Check, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export function SetupChecklist({
  hasService,
  hasAvailability,
}: {
  hasService: boolean;
  hasAvailability: boolean;
}) {
  if (hasService && hasAvailability) return null;

  const steps = [
    {
      label: "Add your first service",
      description: "Set a duration so Slotly can build time slots.",
      href: "/services/new",
      done: hasService,
    },
    {
      label: "Set your working hours",
      description: "Choose the days and hours you take appointments.",
      href: "/availability",
      done: hasAvailability,
    },
    {
      label: "Share your booking link",
      description: "Send it to one customer to test the flow.",
      href: "/share",
      done: false,
    },
  ];

  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-card border border-[#cfe9e7] bg-gradient-to-br from-accent-soft/80 to-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-accent-strong shadow-sm">
          <ListChecks className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14.5px] font-semibold text-navy">
              Finish setting up your booking page
            </h2>
            <span className="text-[11.5px] font-medium text-muted">
              {completed} of {steps.length} done
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-5 text-muted">
            Customers can’t book until you have a service and working hours.
          </p>

          <ul className="mt-4 space-y-2">
            {steps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 rounded-xl border border-white bg-white/80 px-3.5 py-3 transition-colors hover:bg-white"
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full",
                      step.done
                        ? "bg-success text-white"
                        : "border border-line bg-canvas text-muted",
                    )}
                  >
                    {step.done ? (
                      <Check className="size-3" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-ink">
                      {step.label}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {step.description}
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
