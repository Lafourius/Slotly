"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/profile", label: "Business profile" },
  { href: "/settings/booking", label: "Booking preferences" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="mb-5 inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-card"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={cn(
            "rounded-[7px] px-3 py-2 text-[12.5px] font-semibold transition-colors",
            pathname === tab.href
              ? "bg-navy text-white"
              : "text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
