import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AvailabilityBreak,
  AvailabilityException,
  AvailabilityRule,
} from "@/lib/types";

export interface AvailabilityData {
  rules: AvailabilityRule[];
  breaks: AvailabilityBreak[];
  exceptions: AvailabilityException[];
}

export async function fetchAvailability(
  supabase: SupabaseClient,
  businessId: string,
): Promise<AvailabilityData> {
  const [rulesResult, breaksResult, exceptionsResult] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("*")
      .eq("business_id", businessId)
      .order("weekday", { ascending: true })
      .returns<AvailabilityRule[]>(),
    supabase
      .from("availability_breaks")
      .select("*")
      .eq("business_id", businessId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true })
      .returns<AvailabilityBreak[]>(),
    supabase
      .from("availability_exceptions")
      .select("*")
      .eq("business_id", businessId)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .returns<AvailabilityException[]>(),
  ]);

  const error =
    rulesResult.error ?? breaksResult.error ?? exceptionsResult.error;
  if (error) {
    throw new Error(`Could not load availability: ${error.message}`);
  }

  return {
    rules: rulesResult.data ?? [],
    breaks: breaksResult.data ?? [],
    exceptions: exceptionsResult.data ?? [],
  };
}
