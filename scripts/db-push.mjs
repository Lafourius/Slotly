import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "SUPABASE_DB_URL is not set. Add the session pooler connection string to .env.local.",
  );
  process.exit(1);
}

const directory = path.resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(directory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  create table if not exists public.slotly_migrations (
    version text primary key,
    applied_at timestamptz not null default now()
  );
`);

for (const file of files) {
  const version = file.replace(/\.sql$/, "");
  const existing = await client.query(
    "select 1 from public.slotly_migrations where version = $1",
    [version],
  );

  if (existing.rowCount > 0) {
    console.log(`skip   ${file}`);
    continue;
  }

  const sql = readFileSync(path.join(directory, file), "utf8");
  process.stdout.write(`apply  ${file} ... `);

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(
      "insert into public.slotly_migrations (version) values ($1)",
      [version],
    );
    await client.query("commit");
    console.log("ok");
  } catch (error) {
    await client.query("rollback");
    console.log("failed");
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("Migrations complete.");
