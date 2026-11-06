"use client";

import Link from "next/link";
import { ChevronUp, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { cn, initials } from "@/lib/utils";

export function UserMenu({
  userName,
  email,
  variant = "topbar",
}: {
  userName: string;
  email: string;
  variant?: "topbar" | "sidebar";
}) {
  const light = variant === "sidebar";

  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors [&::-webkit-details-marker]:hidden",
          light ? "hover:bg-white/[0.06]" : "hover:bg-canvas",
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-[11.5px] font-bold",
            light
              ? "bg-white/10 text-white"
              : "bg-accent-soft text-[#0b6f6b]",
          )}
        >
          {initials(userName) || "S"}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span
            className={cn(
              "block truncate text-[12.5px] font-semibold",
              light ? "text-white/90" : "text-ink",
            )}
          >
            {userName}
          </span>
          <span
            className={cn(
              "block truncate text-[11px]",
              light ? "text-white/40" : "text-muted",
            )}
          >
            {email}
          </span>
        </span>
        <ChevronUp
          className={cn(
            "size-3.5 transition-transform group-open:rotate-180",
            light ? "text-white/40" : "text-muted",
          )}
          aria-hidden="true"
        />
      </summary>

      <div
        className={cn(
          "absolute z-40 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-float",
          light ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2",
        )}
      >
        <Link
          href="/settings/profile"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink hover:bg-canvas"
        >
          <Settings className="size-4 text-muted" aria-hidden="true" />
          Business settings
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
