"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackShareAction } from "@/server/actions/analytics";

export function ShareBookingDialog({
  slug,
  businessName,
  triggerLabel = "Share booking page",
  variant = "primary",
  size = "md",
  trigger = "button",
}: {
  slug: string;
  businessName: string;
  triggerLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  trigger?: "button" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/book/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Booking link copied");
      void trackShareAction();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy automatically. Select the link and copy it.");
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Hi! You can book an appointment with ${businessName} here: ${url}`,
  )}`;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        {trigger === "icon" ? (
          <Button variant="secondary" size="icon" aria-label="Share booking page">
            <Share2 aria-hidden="true" />
          </Button>
        ) : (
          <Button variant={variant} size={size}>
            <Share2 aria-hidden="true" />
            {triggerLabel}
          </Button>
        )}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-float sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-[18px] font-semibold tracking-[-0.015em] text-navy">
                Share your booking page
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1.5 text-[13px] leading-5 text-muted">
                Send this link to customers. They can book without creating an
                account.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="-mr-1 -mt-1 rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <div className="relative flex-1">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                readOnly
                value={origin ? url : `/book/${slug}`}
                aria-label="Public booking link"
                className="pl-9 text-[13px]"
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
            <Button
              variant="primary"
              onClick={copyLink}
              aria-live="polite"
              className="shrink-0"
            >
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </Button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void trackShareAction()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-[#c8e8d9] bg-[#eef9f3] text-[13px] font-semibold text-[#12865b] transition-colors hover:bg-[#e3f5eb]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Share on WhatsApp
            </a>
            <a
              href={`/book/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-line bg-surface text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Preview booking page
            </a>
          </div>

          <div className="mt-5 hidden sm:block">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Live preview
            </p>
            <div className="overflow-hidden rounded-xl border border-line bg-canvas">
              <iframe
                src={`/book/${slug}`}
                title="Public booking page preview"
                className="h-[360px] w-full"
                loading="lazy"
              />
            </div>
          </div>

          <p className="mt-4 text-[11.5px] leading-5 text-muted">
            Tip: add the link to your Instagram bio and WhatsApp business
            profile so customers always have it.
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
