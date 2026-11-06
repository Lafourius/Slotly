import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "link-invalid":
    "That confirmation or reset link has expired. Request a new one and try again.",
  setup:
    "The booking backend is not configured yet. Add your Supabase keys to .env.local.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";

  return (
    <LoginForm
      next={next}
      initialError={params.error ? ERRORS[params.error] : undefined}
    />
  );
}
