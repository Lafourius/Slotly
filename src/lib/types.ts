export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export type BookingMode = "auto" | "manual";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  email: string;
  phone: string | null;
  city: string | null;
  timezone: string;
  logo_url: string | null;
  booking_mode: BookingMode;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_minor_units: number | null;
  buffer_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  business_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface AvailabilityBreak {
  id: string;
  business_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  label: string | null;
}

export interface AvailabilityException {
  id: string;
  business_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_unavailable: boolean;
  reason: string | null;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string;
  customer_id: string;
  start_at: string;
  end_at: string;
  buffer_end_at: string;
  status: AppointmentStatus;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithRelations extends Appointment {
  service: Pick<Service, "id" | "name" | "duration_minutes"> | null;
  customer: Pick<Customer, "id" | "name" | "email" | "phone"> | null;
}

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string | null;
  timezone: string;
  logo_url: string | null;
  booking_mode: BookingMode;
}

export interface PublicService {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_minor_units: number | null;
}

export interface BusyInterval {
  start_at: string;
  buffer_end_at: string;
}

export interface BookingContext {
  business: PublicBusiness;
  service: {
    id: string;
    name: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    price_minor_units: number | null;
    is_active: boolean;
  };
  services: PublicService[];
  rules: { weekday: number; start_time: string; end_time: string }[];
  breaks: { weekday: number; start_time: string; end_time: string }[];
  exceptions: {
    date: string;
    start_time: string | null;
    end_time: string | null;
    is_unavailable: boolean;
  }[];
  busy: BusyInterval[];
}

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export type ActionError = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

export type ActionOk<T = undefined> = { ok: true; data?: T };
export type ActionResult<T = undefined> = ActionOk<T> | ActionError;
