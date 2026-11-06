import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppointmentStatus } from "@/lib/types";

interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface CustomerAppointmentRow {
  customer_id: string;
  start_at: string;
  status: AppointmentStatus;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  totalBookings: number;
  upcomingBookings: number;
  lastVisit: string | null;
  nextVisit: string | null;
}

export async function fetchCustomerSummaries(
  supabase: SupabaseClient,
  businessId: string,
): Promise<CustomerSummary[]> {
  const [customersResult, appointmentsResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, phone, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<CustomerRow[]>(),
    supabase
      .from("appointments")
      .select("customer_id, start_at, status")
      .eq("business_id", businessId)
      .order("start_at", { ascending: false })
      .limit(2000)
      .returns<CustomerAppointmentRow[]>(),
  ]);

  const error = customersResult.error ?? appointmentsResult.error;
  if (error) {
    throw new Error(`Could not load customers: ${error.message}`);
  }

  const now = Date.now();
  const byCustomer = new Map<string, CustomerAppointmentRow[]>();
  for (const appointment of appointmentsResult.data ?? []) {
    const list = byCustomer.get(appointment.customer_id) ?? [];
    list.push(appointment);
    byCustomer.set(appointment.customer_id, list);
  }

  return (customersResult.data ?? []).map((customer) => {
    const history = byCustomer.get(customer.id) ?? [];
    const counted = history.filter(
      (appointment) =>
        appointment.status !== "cancelled" && appointment.status !== "rejected",
    );
    const future = counted
      .filter(
        (appointment) =>
          new Date(appointment.start_at).getTime() > now &&
          appointment.status !== "rejected",
      )
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      );
    const past = counted
      .filter((appointment) => new Date(appointment.start_at).getTime() <= now)
      .sort(
        (a, b) =>
          new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
      );

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.created_at,
      totalBookings: counted.length,
      upcomingBookings: future.length,
      lastVisit: past[0]?.start_at ?? null,
      nextVisit: future[0]?.start_at ?? null,
    };
  });
}

export async function fetchCustomer(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string,
): Promise<CustomerRow | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, created_at")
    .eq("business_id", businessId)
    .eq("id", customerId)
    .maybeSingle()
    .returns<CustomerRow>();

  if (error) return null;
  return data ?? null;
}
