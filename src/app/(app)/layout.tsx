import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getCurrentBusiness, getAuth, displayName } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Brand } from "@/components/layout/brand";
import { UserMenu } from "@/components/layout/user-menu";
import { ShareBookingDialog } from "@/components/share/share-booking";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const business = await getCurrentBusiness(auth);
  if (!business) redirect("/onboarding");

  const name = displayName(auth.user);

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <AppSidebar
        businessName={business.name}
        slug={business.slug}
        userName={name}
        email={auth.user.email ?? ""}
      />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Brand href="/dashboard" />
            <span className="truncate border-l border-line pl-3 text-[12.5px] font-medium text-muted">
              {business.name}
            </span>
          </div>

          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <span className="text-[12.5px] text-muted">Workspace</span>
            <span className="text-[12.5px] text-[#c3cbd6]">/</span>
            <span className="truncate text-[12.5px] font-semibold text-ink">
              {business.name}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/book/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-control px-3 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:bg-canvas hover:text-ink sm:inline-flex"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              View page
            </Link>
            <ShareBookingDialog
              slug={business.slug}
              businessName={business.name}
              triggerLabel="Share"
              size="sm"
            />
            <div className="lg:hidden">
              <UserMenu
                userName={name}
                email={auth.user.email ?? ""}
              />
            </div>
          </div>
        </header>

        <main className="page-shell flex-1 py-6 pb-28 sm:py-8 lg:pb-12">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
