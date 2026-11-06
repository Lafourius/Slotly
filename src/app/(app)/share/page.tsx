import type { Metadata } from "next";
import { Eye, Link2, MessageCircle, Smartphone } from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SharePageActions } from "@/components/share/share-page-actions";
import { ShareBookingDialog } from "@/components/share/share-booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Share booking page" };

export default async function SharePage() {
  const { business } = await requireBusiness();

  return (
    <div>
      <PageHeader
        title="Share your booking page"
        description="One link customers can open in any browser, no account needed."
        actions={
          <ShareBookingDialog
            slug={business.slug}
            businessName={business.name}
            triggerLabel="Quick share"
            variant="secondary"
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Your link</CardTitle>
            </CardHeader>
            <CardContent>
              <SharePageActions
                slug={business.slug}
                businessName={business.name}
              />
              <p className="mt-3 text-[11.5px] leading-5 text-muted">
                Anyone with this link can see your active services and available
                times. Customer details stay private to you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where to use it</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  {
                    icon: MessageCircle,
                    title: "WhatsApp",
                    body: "Pin it in your business profile and send it when someone asks about timings.",
                  },
                  {
                    icon: Smartphone,
                    title: "Instagram bio",
                    body: "Add it as your bio link so new enquiries can book without a back-and-forth.",
                  },
                  {
                    icon: Link2,
                    title: "Google Business Profile",
                    body: "Use it as your appointment link if you have a listing.",
                  },
                  {
                    icon: Eye,
                    title: "Existing customers",
                    body: "Send it once to regulars so they stop asking whether a slot is free.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-accent-strong">
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-ink">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-5 text-muted">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-card border border-line bg-surface p-3 shadow-card sm:p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Live preview
            </p>
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
              Same page customers see
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-canvas">
            <iframe
              src={`/book/${business.slug}`}
              title={`${business.name} public booking page`}
              className="h-[620px] w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
