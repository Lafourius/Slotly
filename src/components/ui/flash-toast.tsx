"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function FlashToast({
  message,
  variant = "success",
}: {
  message?: string;
  variant?: "success" | "error";
}) {
  useEffect(() => {
    if (!message) return;
    if (variant === "error") toast.error(message);
    else toast.success(message);
  }, [message, variant]);

  return null;
}
