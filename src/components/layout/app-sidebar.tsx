"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Clock3,
  LayoutDashboard,
  Scissors,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/services", label: "Services", icon: Scissors },
  { href: "/availability", label: "Availability", icon: Clock3 },
  { href: "/customers", label: "Customers", icon: Users },
];

export function AppSidebar({
  businessName,
  slug,
  userName,
  email,
}: {
  businessName: string;
  slug: string | null;
  userName: string;
  email: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-white/5 lg:bg-navy">
      <div className="px-5 pb-6 pt-6">
        <Brand variant="light" href="/dashboard" />
      </div>

      <div className="mx-3 mb-6 rounded-xl border border-white/8 bg-white/[0.045] p-3">
        <p className="truncate text-[13px] font-semibold text-white">
          {businessName}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] text-white/45">
          {slug ? `slotly.app/book/${slug}` : "Set up your booking page"}
        </p>
        <Link
          href="/share"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-accent-strong"
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share booking page
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-white/[0.09] text-white"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
              )}
            >
              <item.icon
                className={cn(
                  "size-[17px] shrink-0 transition-colors",
                  active ? "text-accent" : "text-white/45 group-hover:text-white/70",
                )}
                aria-hidden="true"
              />
              {item.label}
              {active ? (
                <span className="ml-auto h-4 w-[3px] rounded-full bg-accent" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-0.5 border-t border-white/8 px-3 py-3">
        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-white/[0.09] text-white"
              : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
          )}
        >
          <Settings className="size-[17px] text-white/45" aria-hidden="true" />
          Settings
        </Link>
        <UserMenu
          userName={userName}
          email={email}
          variant="sidebar"
        />
      </div>
    </aside>
  );
}
