import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import { Mail, Phone, Search, Users } from "lucide-react";
import { requireBusiness } from "@/server/auth";
import { fetchCustomerSummaries } from "@/server/data/customers";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareBookingDialog } from "@/components/share/share-booking";
import { formatShortDate } from "@/lib/booking/time";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase, business } = await requireBusiness();
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();

  const customers = await fetchCustomerSummaries(supabase, business.id);
  const filtered = query
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.includes(query),
      )
    : customers;

  const repeatCustomers = customers.filter(
    (customer) => customer.totalBookings > 1,
  ).length;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="A simple record of everyone who has booked with you — no CRM, no clutter."
        actions={
          <ShareBookingDialog
            slug={business.slug}
            businessName={business.name}
            triggerLabel="Share booking page"
          />
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Summary label="Customers" value={customers.length} />
        <Summary label="Returning" value={repeatCustomers} />
        <Summary
          label="With upcoming visits"
          value={customers.filter((customer) => customer.upcomingBookings > 0).length}
        />
      </div>

      <form method="get" action="/customers" className="mb-4">
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search name, email or phone"
            aria-label="Search customers"
            className="pl-9"
          />
        </div>
      </form>

      {customers.length === 0 ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Once someone books through your link, their name and contact details will appear here with their history."
            action={
              <ShareBookingDialog
                slug={business.slug}
                businessName={business.name}
                triggerLabel="Share booking page"
                size="sm"
              />
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Search}
            title="No matching customers"
            description="Try a different name, email address or phone number."
            action={
              <Button variant="secondary" asChild>
                <Link href="/customers">Clear search</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-line bg-surface shadow-card md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Bookings</th>
                  <th className="px-4 py-3 font-semibold">Next visit</th>
                  <th className="px-4 py-3 font-semibold">Last visit</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-canvas/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-[#0b6f6b]">
                          {initials(customer.name)}
                        </span>
                        <span className="text-[13px] font-semibold text-ink">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5 text-[11.5px] text-muted">
                        {customer.email ? (
                          <p className="flex items-center gap-1.5">
                            <Mail className="size-3" aria-hidden="true" />
                            {customer.email}
                          </p>
                        ) : null}
                        {customer.phone ? (
                          <p className="flex items-center gap-1.5">
                            <Phone className="size-3" aria-hidden="true" />
                            {customer.phone}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={customer.totalBookings > 1 ? "accent" : "neutral"}>
                        {customer.totalBookings}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-muted">
                      {customer.nextVisit
                        ? formatShortDate(customer.nextVisit, business.timezone)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-muted">
                      {customer.lastVisit
                        ? formatShortDate(customer.lastVisit, business.timezone)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/appointments?customer=${customer.id}`}
                        className="text-[11.5px] font-semibold text-accent-strong hover:underline"
                      >
                        History
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2.5 md:hidden">
            {filtered.map((customer) => (
              <li
                key={customer.id}
                className="rounded-card border border-line bg-surface p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[11.5px] font-bold text-[#0b6f6b]">
                      {initials(customer.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-ink">
                        {customer.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {customer.totalBookings}{" "}
                        {customer.totalBookings === 1 ? "booking" : "bookings"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/appointments?customer=${customer.id}`}
                    className="shrink-0 text-[11.5px] font-semibold text-accent-strong hover:underline"
                  >
                    History
                  </Link>
                </div>
                <div className="mt-2.5 space-y-1 text-[11.5px] text-muted">
                  {customer.email ? <p>{customer.email}</p> : null}
                  {customer.phone ? <p>{customer.phone}</p> : null}
                  {customer.nextVisit ? (
                    <p className="font-medium text-ink">
                      Next:{" "}
                      {DateTime.fromISO(customer.nextVisit)
                        .setZone(business.timezone)
                        .toFormat("ccc d LLL, h:mm a")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 max-w-2xl text-[11px] leading-5 text-muted">
            Customer details are only visible to you. They are never shown on
            your public booking page or shared with other businesses. Delete
            bookings you no longer need in line with your local privacy
            obligations.
          </p>
        </>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-semibold text-navy tabular">{value}</p>
    </div>
  );
}
