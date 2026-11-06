"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackShareAction } from "@/server/actions/analytics";

export function SharePageActions({
  slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/book/${slug}`;
  const message = `Hi! You can book an appointment with ${businessName} here: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      void trackShareAction();
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Copy failed. Select the link and copy it manually.");
    }
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") {
      void copy();
      return;
    }
    try {
      await navigator.share({
        title: `Book with ${businessName}`,
        text: `Book your next appointment with ${businessName}.`,
        url,
      });
      void trackShareAction();
    } catch {
      // The customer cancelled the share sheet; nothing to report.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            readOnly
            value={origin ? url : `/book/${slug}`}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="Booking link"
            className="text-[12.5px]"
          />
        </div>
        <Button onClick={copy} className="shrink-0">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShareAction()}
          className="inline-flex h-10 items-center gap-2 rounded-control border border-[#c8e8d9] bg-[#eef9f3] px-3.5 text-[12.5px] font-semibold text-[#12865b] hover:bg-[#e3f5eb]"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
        <Button variant="secondary" size="sm" onClick={nativeShare}>
          <Share2 aria-hidden="true" />
          More options
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={`/book/${slug}`} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            Open page
          </a>
        </Button>
      </div>
    </div>
  );
}
