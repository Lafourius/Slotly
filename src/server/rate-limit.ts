import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

async function clientFingerprint(scope: string): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    "unknown";

  // Only a salted hash of the address is stored, never the address itself.
  return createHash("sha256").update(`${scope}:${ip}`).digest("hex").slice(0, 48);
}

/**
 * Returns true when the request is allowed. If rate limiting infrastructure is
 * unavailable the booking still proceeds: the database concurrency guard is
 * the authoritative protection against duplicate appointments.
 */
export async function allowRequest(
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return true;

  try {
    const bucket = await clientFingerprint(scope);
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}
