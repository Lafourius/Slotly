import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { PageHeader } from "@/components/layout/page-header";
import { BookingPreferencesForm } from "@/components/settings/booking-preferences-form";
import { ShareBookingDialog } from "@/components/share/share-booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Booking preferences" };

export default async function BookingSettingsPage() {
  const { business } = await requireBusiness();

  return (
    <div>
      <PageHeader
        title="Booking preferences"
        description="Decide how bookings land and how customers reach you."
        actions={
          <ShareBookingDialog
            slug={business.slug}
            businessName={business.name}
            triggerLabel="Share booking page"
          />
        }
      />

      <BookingPreferencesForm mode={business.booking_mode} />

      <div className="mt-5 grid max-w-[720px] gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your booking page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-[12.5px] font-semibold text-ink">
              /book/{business.slug}
            </p>
            <Link
              href={`/book/${business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-strong hover:underline"
            >
              Open booking page
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-[12.5px] text-muted">
              <Mail className="size-3.5" aria-hidden="true" />
              {business.email}
            </p>
            <p className="mt-2 text-[11.5px] leading-5 text-muted">
              Slotly does not send automatic emails or WhatsApp messages in this
              version. Reach out to customers directly using the details on each
              appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
