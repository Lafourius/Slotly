import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchAvailability } from "@/server/data/availability";
import { PageHeader } from "@/components/layout/page-header";
import { AvailabilityEditor } from "@/components/availability/availability-editor";

export const metadata: Metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const { supabase, business } = await requireBusiness();
  const availability = await fetchAvailability(supabase, business.id);

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Define when customers can book. Slotly builds slots from these hours, the service duration and any existing appointments."
        actions={
          <Link
            href={`/book/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-ink"
          >
            View booking page
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <AvailabilityEditor
        rules={availability.rules}
        breaks={availability.breaks}
        exceptions={availability.exceptions}
        timezone={business.timezone}
      />
    </div>
  );
}
