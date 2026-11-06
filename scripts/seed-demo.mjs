import path from "node:path";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.SUPABASE_DB_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!connectionString || !serviceKey || !url) {
  console.error("Missing Supabase environment values in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const db = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();

const PASSWORD = "SlotlyDemo2026";

async function ensureUser(email, fullName) {
  const existing = await db.query("select id from auth.users where email = $1", [
    email,
  ]);
  if (existing.rows[0]) return existing.rows[0].id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    throw new Error(`Could not create ${email}: ${error?.message}`);
  }
  return data.user.id;
}

async function upsertBusiness(ownerId, business) {
  const { rows } = await db.query(
    `insert into public.businesses
      (owner_id, name, slug, description, category, email, phone, city, timezone, booking_mode)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (owner_id) do update set
       name = excluded.name,
       slug = excluded.slug,
       description = excluded.description,
       category = excluded.category,
       email = excluded.email,
       phone = excluded.phone,
       city = excluded.city,
       timezone = excluded.timezone,
       booking_mode = excluded.booking_mode
     returning id, slug`,
    [
      ownerId,
      business.name,
      business.slug,
      business.description,
      business.category,
      business.email,
      business.phone ?? null,
      business.city ?? null,
      business.timezone ?? "Asia/Kolkata",
      business.bookingMode ?? "manual",
    ],
  );
  return rows[0];
}

async function seedServices(businessId, services) {
  const existing = await db.query(
    "select count(*)::int as count from public.services where business_id = $1",
    [businessId],
  );
  if (existing.rows[0].count > 0) return;

  for (const service of services) {
    await db.query(
      `insert into public.services
        (business_id, name, description, duration_minutes, price_minor_units, buffer_minutes, is_active)
       values ($1,$2,$3,$4,$5,$6,true)`,
      [
        businessId,
        service.name,
        service.description,
        service.duration,
        service.price,
        service.buffer ?? 0,
      ],
    );
  }
}

async function seedAvailability(businessId) {
  const existing = await db.query(
    "select count(*)::int as count from public.availability_rules where business_id = $1",
    [businessId],
  );
  if (existing.rows[0].count > 0) return;

  for (const weekday of [1, 2, 3, 4, 5, 6]) {
    await db.query(
      `insert into public.availability_rules
        (business_id, weekday, start_time, end_time, is_active)
       values ($1,$2,'09:00','18:00',true)`,
      [businessId, weekday],
    );
  }
  await db.query(
    `insert into public.availability_breaks
      (business_id, weekday, start_time, end_time, label)
     values
      ($1,1,'13:00','14:00','Lunch'),
      ($1,2,'13:00','14:00','Lunch'),
      ($1,3,'13:00','14:00','Lunch'),
      ($1,4,'13:00','14:00','Lunch'),
      ($1,5,'13:00','14:00','Lunch')`,
    [businessId],
  );
}

const demoOwner = await ensureUser("demo@slotly.app", "Ananya Sharma");
const tutorBusiness = await upsertBusiness(demoOwner, {
  name: "Bright Tuition",
  slug: "bright-tuition",
  description:
    "One-to-one maths and science tutoring for classes 8–12, online and in Indiranagar. Focused sessions built around the topics you find hardest.",
  category: "tutoring",
  email: "hello@brighttuition.in",
  phone: "+91 98765 43210",
  city: "Bengaluru",
  bookingMode: "manual",
});

await seedServices(tutorBusiness.id, [
  {
    name: "Mathematics consultation",
    description:
      "A focused 30-minute session to work through specific problems from your syllabus.",
    duration: 30,
    price: 49900,
  },
  {
    name: "Physics deep dive",
    description:
      "A full hour on mechanics, electricity or whatever needs more time. Includes a short recap plan.",
    duration: 60,
    price: 89900,
    buffer: 10,
  },
  {
    name: "First trial class",
    description: "A free 20-minute introductory session to see if we are a good fit.",
    duration: 20,
    price: null,
  },
]);
await seedAvailability(tutorBusiness.id);

const secondOwner = await ensureUser("priya@canvasco.example", "Priya Nair");
const secondBusiness = await upsertBusiness(secondOwner, {
  name: "Canvas & Co",
  slug: "canvas-and-co",
  description: "Independent hair studio in Bandra. Cuts, colour and blow-dry appointments.",
  category: "salon",
  email: "studio@canvasco.example",
  city: "Mumbai",
  bookingMode: "auto",
});
await seedServices(secondBusiness.id, [
  {
    name: "Haircut",
    description: "Consultation and precision cut, finished with a blow-dry.",
    duration: 45,
    price: 120000,
    buffer: 15,
  },
]);
await seedAvailability(secondBusiness.id);

console.log("Seeded demo data:");
console.log(`  tutor   /book/${tutorBusiness.slug}  (owner demo@slotly.app)`);
console.log(`  salon   /book/${secondBusiness.slug}  (owner priya@canvasco.example)`);
console.log(`  password for both demo owners: ${PASSWORD}`);

await db.end();
