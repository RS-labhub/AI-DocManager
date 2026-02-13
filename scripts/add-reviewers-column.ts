import * as path from "path";
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || "";

if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error("Missing env vars");
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

async function main() {
  console.log("\n=== Migration: Add reviewers & referenced_docs columns ===\n");

  const regions = ["ap-south-1", "us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"];
  const candidates: string[] = [
    "postgresql://postgres:" + DB_PASSWORD + "@db." + PROJECT_REF + ".supabase.co:5432/postgres",
  ];
  for (const region of regions) {
    candidates.push(
      "postgresql://postgres." + PROJECT_REF + ":" + DB_PASSWORD + "@aws-0-" + region + ".pooler.supabase.com:5432/postgres",
      "postgresql://postgres." + PROJECT_REF + ":" + DB_PASSWORD + "@aws-0-" + region + ".pooler.supabase.com:6543/postgres",
    );
  }

  let sql: ReturnType<typeof postgres> | null = null;
  for (const connStr of candidates) {
    const candidate = postgres(connStr, { ssl: "require", connect_timeout: 8, idle_timeout: 5, max: 1 });
    try {
      await candidate`SELECT 1`;
      sql = candidate;
      console.log("  Connected to database.");
      break;
    } catch {
      await candidate.end().catch(() => {});
    }
  }

  if (!sql) {
    console.error("  Could not connect. Run SQL manually.");
    process.exit(1);
  }

  try {
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS reviewers UUID[] DEFAULT '{}'`;
    console.log("  Added reviewers column");
  } catch (e: any) { console.log("  reviewers:", e.message); }

  try {
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS referenced_docs UUID[] DEFAULT '{}'`;
    console.log("  Added referenced_docs column");
  } catch (e: any) { console.log("  referenced_docs:", e.message); }

  await sql.end();
  console.log("\n  Done!\n");
}

main().catch(console.error);
