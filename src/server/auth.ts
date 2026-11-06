import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";

export interface AuthContext {
  supabase: SupabaseClient;
  user: User;
}

/** Returns the signed-in user or null. Never throws on a missing session. */
export const getAuth = cache(async (): Promise<AuthContext | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { supabase, user: data.user };
  } catch {
    return null;
  }
});

export async function requireUser(nextPath?: string): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) {
    redirect(
      nextPath
        ? `/login?next=${encodeURIComponent(nextPath)}`
        : "/login",
    );
  }
  return auth;
}

export async function getCurrentBusiness(
  auth: AuthContext,
): Promise<Business | null> {
  const { data, error } = await auth.supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load business: ${error.message}`);
  }
  return (data as Business | null) ?? null;
}

export interface BusinessContext extends AuthContext {
  business: Business;
}

/** Use in every owner page/action. Redirects to onboarding when incomplete. */
export async function requireBusiness(): Promise<BusinessContext> {
  const auth = await requireUser();
  const business = await getCurrentBusiness(auth);
  if (!business) {
    redirect("/onboarding");
  }
  return { ...auth, business };
}

export function displayName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  return user.email?.split("@")[0] ?? "there";
}
