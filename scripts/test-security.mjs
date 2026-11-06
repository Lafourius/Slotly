import path from "node:path";
import { Client } from "pg";
import { DateTime } from "luxon";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is missing");
  process.exit(1);
}

const TZ = "Asia/Kolkata";
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(
    `${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : ` — ${detail}`}`,
  );
}

async function connect() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

const db = await connect();

// Remove leftovers from an interrupted earlier run so the suite is repeatable.
await db.query(
  `delete from public.appointments where customer_notes = 'Slotly automated test'`,
);
await db.query(
  `delete from public.customers
   where id not in (select customer_id from public.appointments)
     and email like 'qa-%'`,
);

const { rows: businesses } = await db.query(
  `select id, owner_id, slug, timezone from public.businesses
   where slug in ('bright-tuition','canvas-and-co') order by slug`,
);
const tutor = businesses.find((row) => row.slug === "bright-tuition");
const salon = businesses.find((row) => row.slug === "canvas-and-co");

if (!tutor || !salon) {
  console.error("Seed data missing. Run node scripts/seed-demo.mjs first.");
  process.exit(1);
}

const { rows: tutorServices } = await db.query(
  "select id, duration_minutes from public.services where business_id = $1 order by duration_minutes",
  [tutor.id],
);
const shortService = tutorServices[0];

async function nextWeekdayAt(time) {
  let date = DateTime.now().setZone(TZ).plus({ days: 1 }).startOf("day");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (date.weekday % 7 !== 0) {
      const candidate = DateTime.fromISO(
        `${date.toISODate()}T${time}`,
        { zone: TZ },
      );
      const taken = await db.query(
        `select 1 from public.appointments
         where business_id = $1 and status in ('pending','confirmed','completed')
           and tstzrange(start_at, buffer_end_at, '[)') && tstzrange($2::timestamptz, $2::timestamptz + interval '45 minutes', '[)')`,
        [tutor.id, candidate.toUTC().toISO()],
      );
      if (!taken.rowCount) return candidate;
    }
    date = date.plus({ days: 1 });
  }
  throw new Error("Could not find a free test slot");
}

// Create a booking in the second business so owner isolation can be verified.
const salonSlot = DateTime.now()
  .setZone(TZ)
  .plus({ days: 2 })
  .set({ hour: 11, minute: 0, second: 0, millisecond: 0 });
const salonBooking = await db.query(
  "select public.create_public_booking($1,$2,$3,$4,$5,$6,$7) as result",
  [
    "canvas-and-co",
    (await db.query("select id from public.services where business_id=$1 limit 1", [
      salon.id,
    ])).rows[0].id,
    salonSlot.toUTC().toISO(),
    "Ishita Rao",
    "qa-salon@example.com",
    null,
    "Slotly automated test",
  ],
);
const salonAppointmentId = salonBooking.rows[0].result.id;

async function attempt(client, sql, params = []) {
  await client.query("savepoint attempt");
  try {
    const result = await client.query(sql, params);
    await client.query("release savepoint attempt");
    return { ok: true, result };
  } catch (error) {
    await client.query("rollback to savepoint attempt");
    return { ok: false, code: error.code, message: error.message };
  }
}

async function asRole(role, userId, fn) {
  const client = await connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role}`);
    if (userId) {
      await client.query(
        `select set_config('request.jwt.claims', $1, true)`,
        [JSON.stringify({ sub: userId, role })],
      );
    }
    return await fn(client);
  } finally {
    await client.query("rollback").catch(() => {});
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// Owner isolation
// ---------------------------------------------------------------------------

const ownerA = await asRole("authenticated", tutor.owner_id, async (client) => {
  const visibleBusinesses = await client.query(
    "select slug from public.businesses",
  );
  const visibleAppointments = await client.query(
    `select id from public.appointments where id = $1`,
    [salonAppointmentId],
  );
  const visibleCustomers = await client.query(
    `select id from public.customers where business_id = $1`,
    [salon.id],
  );
  const profileCount = await client.query(
    "select count(*)::int as count from public.profiles",
  );
  const injected = await attempt(
    client,
    "insert into public.services (business_id, name, duration_minutes) values ($1, 'Injected', 30) returning id",
    [salon.id],
  );
  const otherBusinessWrite = injected.ok ? "allowed" : injected.code;

  const statusUpdate = await client.query(
    `update public.appointments set status = 'cancelled' where id = $1`,
    [salonAppointmentId],
  );

  return {
    visibleBusinesses: visibleBusinesses.rows.map((row) => row.slug),
    visibleAppointments: visibleAppointments.rowCount,
    visibleCustomers: visibleCustomers.rowCount,
    profileCount: profileCount.rows[0].count,
    otherBusinessWrite,
    statusUpdate: statusUpdate.rowCount,
  };
});

check(
  "Owner A sees only their own business",
  ownerA.visibleBusinesses.length === 1 && ownerA.visibleBusinesses[0] === "bright-tuition",
  JSON.stringify(ownerA.visibleBusinesses),
);
check(
  "Owner A cannot read another business's appointment",
  ownerA.visibleAppointments === 0,
);
check(
  "Owner A cannot read another business's customers",
  ownerA.visibleCustomers === 0,
);
check(
  "Owner A cannot insert a service into another business",
  ["42501", "allowed"].includes(ownerA.otherBusinessWrite) &&
    ownerA.otherBusinessWrite !== "allowed",
  String(ownerA.otherBusinessWrite),
);
check(
  "Owner A cannot change another business's appointment",
  ownerA.statusUpdate === 0,
  String(ownerA.statusUpdate),
);
check(
  "Owner A sees only their own profile",
  ownerA.profileCount === 1,
  String(ownerA.profileCount),
);

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

const publicBusiness = await asRole("anon", null, async (client) => {
  const result = await client.query(
    "select public.get_public_business('bright-tuition') as data",
  );
  const tableRead = await attempt(
    client,
    "select * from public.businesses limit 1",
  );
  const tableError = tableRead.ok ? null : tableRead.code;
  const context = await client.query(
    `select public.get_public_booking_context('bright-tuition', $1) as data`,
    [shortService.id],
  );
  return { data: result.rows[0].data, tableError, context: context.rows[0].data };
});

check(
  "Anonymous visitors cannot select business tables",
  publicBusiness.tableError === "42501" || publicBusiness.tableError === "42P01",
  String(publicBusiness.tableError),
);
const publicJson = JSON.stringify(publicBusiness.data ?? {});
check(
  "Public business payload has no contact or private fields",
  !publicJson.includes("email") &&
    !publicJson.includes("phone") &&
    !publicJson.includes("owner_id"),
  publicJson.slice(0, 160),
);
check(
  "Public payload exposes only active services",
  Array.isArray(publicBusiness.data?.services) &&
    publicBusiness.data.services.length === 3,
  String(publicBusiness.data?.services?.length),
);
check(
  "Public booking context never includes customer data",
  publicBusiness.context &&
    !JSON.stringify(publicBusiness.context).includes("customer") &&
    Array.isArray(publicBusiness.context.busy),
);

// ---------------------------------------------------------------------------
// Overlap and concurrent booking
// ---------------------------------------------------------------------------

const slot = await nextWeekdayAt("09:00");
const params = [
  "bright-tuition",
  shortService.id,
  slot.toUTC().toISO(),
  "Concurrent Tester",
  "qa-concurrency@example.com",
  null,
  "Slotly automated test",
];

const bookOnce = async () => {
  const client = await connect();
  try {
    await client.query("begin");
    const result = await client.query(
      "select public.create_public_booking($1,$2,$3,$4,$5,$6,$7) as result",
      params,
    );
    await client.query("commit");
    return { ok: true, result: result.rows[0].result };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    return { ok: false, error: error.message };
  } finally {
    await client.end();
  }
};

const [first, second] = await Promise.all([bookOnce(), bookOnce()]);
const successes = [first, second].filter((item) => item.ok);
const failures = [first, second].filter((item) => !item.ok);

check(
  "Two simultaneous bookings for the same slot produce exactly one success",
  successes.length === 1,
  JSON.stringify({ first, second }),
);
check(
  "The losing concurrent booking gets a slot-taken error",
  failures.length === 1 && /SLOT_TAKEN/.test(failures[0].error ?? ""),
  failures[0]?.error ?? "",
);

const duplicate = await bookOnce();
check(
  "A later duplicate request for the same slot is rejected",
  !duplicate.ok && /SLOT_TAKEN/.test(duplicate.error ?? ""),
  duplicate.error ?? "",
);

// Buffer-aware conflict check: 60-minute service with a 10-minute buffer.
const longSlot = await nextWeekdayAt("15:00");
const longService = tutorServices.find((row) => row.duration_minutes === 60);
if (longService) {
  await db.query(
    "select public.create_public_booking($1,$2,$3,$4,$5,$6,$7)",
    [
      "bright-tuition",
      longService.id,
      longSlot.toUTC().toISO(),
      "Buffer Tester",
      "qa-buffer@example.com",
      null,
      "Slotly automated test",
    ],
  );
  let bufferError = null;
  try {
    await db.query(
      "select public.create_public_booking($1,$2,$3,$4,$5,$6,$7)",
      [
        "bright-tuition",
        shortService.id,
        longSlot.plus({ minutes: 60 }).toUTC().toISO(),
        "Buffer Tester 2",
        "qa-buffer2@example.com",
        null,
        "Slotly automated test",
      ],
    );
  } catch (error) {
    bufferError = error.message;
  }
  check(
    "A booking inside the previous appointment's buffer is rejected",
    /SLOT_TAKEN/.test(bufferError ?? ""),
    bufferError ?? "allowed",
  );
}

// Cleanup automated test records only.
await db.query(
  `delete from public.appointments where customer_notes = 'Slotly automated test'`,
);
await db.query(
  `delete from public.customers
   where id not in (select customer_id from public.appointments)
     and (email like 'qa-%' or email like 'qa+%')`,
);

await db.end();

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
