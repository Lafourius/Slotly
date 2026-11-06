import type { SupabaseClient } from "@supabase/supabase-js";
import type { Service } from "@/lib/types";

export async function fetchServices(
  supabase: SupabaseClient,
  businessId: string,
  includeInactive = true,
): Promise<Service[]> {
  let query = supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.returns<Service[]>();
  if (error) {
    throw new Error(`Could not load services: ${error.message}`);
  }
  return data ?? [];
}

export async function fetchService(
  supabase: SupabaseClient,
  businessId: string,
  serviceId: string,
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", serviceId)
    .maybeSingle<Service>();

  if (error) {
    throw new Error(`Could not load service: ${error.message}`);
  }
  return data ?? null;
}
