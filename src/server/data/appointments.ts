import { DateTime } from "luxon";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppointmentStatus,
  AppointmentWithRelations,
} from "@/lib/types";

const RELATIONS = `
  id,
  business_id,
  service_id,
  customer_id,
  start_at,
  end_at,
  buffer_end_at,
  status,
  customer_notes,
  created_at,
  updated_at,
  service:services(id, name, duration_minutes),
  customer:customers(id, name, email, phone)
`;

const ACTIVE: AppointmentStatus[] = ["pending", "confirmed", "completed"];

function normalizeRows(
  rows: unknown[] | null,
): AppointmentWithRelations[] {
  if (!rows) return [];
  return rows.map((row) => {
    const item = row as AppointmentWithRelations & {
      service?: AppointmentWithRelations["service"] | AppointmentWithRelations["service"][];
      customer?: AppointmentWithRelations["customer"] | AppointmentWithRelations["customer"][];
    };
    return {
      ...item,
      service: Array.isArray(item.service)
        ? (item.service[0] ?? null)
        : (item.service ?? null),
      customer: Array.isArray(item.customer)
        ? (item.customer[0] ?? null)
        : (item.customer ?? null),
    };
  });
}

export async function fetchAppointmentsInRange(
  supabase: SupabaseClient,
  businessId: string,
  fromIso: string,
  toIso: string,
  options: { statuses?: AppointmentStatus[]; customerId?: string } = {},
): Promise<AppointmentWithRelations[]> {
  let query = supabase
    .from("appointments")
    .select(RELATIONS)
    .eq("business_id", businessId)
    .gte("start_at", fromIso)
    .lt("start_at", toIso)
    .order("start_at", { ascending: true })
    .limit(500);

  if (options.statuses?.length) {
    query = query.in("status", options.statuses);
  }
  if (options.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  const { data, error } = await query.returns<unknown[]>();
  if (error) {
    throw new Error(`Could not load appointments: ${error.message}`);
  }
  return normalizeRows(data);
}

export async function fetchAppointmentById(
  supabase: SupabaseClient,
  businessId: string,
  appointmentId: string,
): Promise<AppointmentWithRelations | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(RELATIONS)
    .eq("business_id", businessId)
    .eq("id", appointmentId)
    .maybeSingle()
    .returns<unknown>();

  if (error) {
    throw new Error(`Could not load appointment: ${error.message}`);
  }
  return normalizeRows(data ? [data] : [])[0] ?? null;
}

export async function countByStatus(
  supabase: SupabaseClient,
  businessId: string,
  status: AppointmentStatus,
): Promise<number> {
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", status);

  if (error) return 0;
  return count ?? 0;
}

export interface DashboardData {
  today: AppointmentWithRelations[];
  upcoming: AppointmentWithRelations[];
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  todayCount: number;
}

export async function fetchDashboardData(
  supabase: SupabaseClient,
  businessId: string,
  timezone: string,
): Promise<DashboardData> {
  const now = DateTime.now().setZone(timezone);
  const dayStart = now.startOf("day").toUTC().toISO() ?? "";
  const dayEnd = now.startOf("day").plus({ days: 1 }).toUTC().toISO() ?? "";
  const upcomingEnd = now.plus({ days: 14 }).toUTC().toISO() ?? "";

  const [today, upcoming, pendingCount, completedCount, cancelledCount] =
    await Promise.all([
      fetchAppointmentsInRange(supabase, businessId, dayStart, dayEnd),
      fetchAppointmentsInRange(
        supabase,
        businessId,
        now.toUTC().toISO() ?? "",
        upcomingEnd,
        { statuses: ACTIVE },
      ),
      countByStatus(supabase, businessId, "pending"),
      countByStatus(supabase, businessId, "completed"),
      countByStatus(supabase, businessId, "cancelled"),
    ]);

  const activeToday = today.filter(
    (appointment) =>
      appointment.status !== "cancelled" && appointment.status !== "rejected",
  );

  return {
    today: activeToday,
    upcoming: upcoming.filter(
      (appointment) =>
        DateTime.fromISO(appointment.start_at) > DateTime.now(),
    ),
    pendingCount,
    completedCount,
    cancelledCount,
    todayCount: activeToday.length,
  };
}

