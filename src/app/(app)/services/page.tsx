import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Plus, Scissors } from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchServices } from "@/server/data/services";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashToast } from "@/components/ui/flash-toast";
import { ServiceActions } from "@/components/services/service-actions";
import { formatDuration, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { supabase, business } = await requireBusiness();
  const services = await fetchServices(supabase, business.id);
  const params = await searchParams;

  const active = services.filter((service) => service.is_active).length;

  return (
    <div>
      {params.created === "created" || params.created === "1" ? (
        <FlashToast message="Service added to your booking page." />
      ) : null}
      {params.updated === "1" ? (
        <FlashToast message="Service updated." />
      ) : null}

      <PageHeader
        title="Services"
        description="What customers can book. Each service has its own duration, price and buffer."
        actions={
          <Button asChild>
            <Link href="/services/new">
              <Plus aria-hidden="true" />
              Add service
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <Badge tone="accent">{active} active</Badge>
        {services.length - active > 0 ? (
          <Badge tone="neutral">{services.length - active} hidden</Badge>
        ) : null}
        <span className="hidden sm:inline">
          Active services appear on your public booking page.
        </span>
      </div>

      {services.length === 0 ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Scissors}
            title="No services yet"
            description="Add your first service — for example a 30-minute consultation — so customers have something to book."
            action={
              <Button asChild>
                <Link href="/services/new">
                  <Plus aria-hidden="true" />
                  Add your first service
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {services.map((service) => (
            <li
              key={service.id}
              className={
                service.is_active
                  ? "rounded-card border border-line bg-surface p-5 shadow-card"
                  : "rounded-card border border-line bg-[#fafbfd] p-5"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14.5px] font-semibold text-navy">
                      {service.name}
                    </h2>
                    {service.is_active ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Hidden</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-[18px] text-[12.5px] leading-5 text-muted">
                    {service.description || "No description provided."}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-semibold text-navy tabular">
                  {formatPrice(service.price_minor_units) ?? "—"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {formatDuration(service.duration_minutes)}
                </span>
                {service.buffer_minutes > 0 ? (
                  <span>{service.buffer_minutes} min buffer</span>
                ) : (
                  <span>No buffer</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <ServiceActions
                  serviceId={service.id}
                  serviceName={service.name}
                  isActive={service.is_active}
                />
                <Link
                  href={`/book/${business.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11.5px] font-medium text-muted hover:text-ink"
                >
                  Preview page
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
