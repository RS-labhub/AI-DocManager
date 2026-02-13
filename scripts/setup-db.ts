import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || "";

if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR_PROJECT")) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL is not set in .env");
  process.exit(1);
}
if (!DB_PASSWORD) {
  console.error("ERROR: SUPABASE_DB_PASSWORD is not set in .env");
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

async function main() {
  console.log("");
  console.log("========================================================");
  console.log("    AI DocManager - Supabase Database Setup");
  console.log("========================================================");
  console.log("  Project:  " + PROJECT_REF);
  console.log("  URL:      " + SUPABASE_URL);

  const root = process.cwd();
  const schemaPath = path.join(root, "supabase", "schema.sql");

  if (!fs.existsSync(schemaPath)) {
    console.error("\n  ERROR: supabase/schema.sql not found. Run from project root.\n");
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, "utf-8");
  console.log("\n  Schema: supabase/schema.sql (" + schema.length + " bytes)");

  // Try multiple connection formats across all Supabase regions
  const regions = [
    "ap-south-1", "us-east-1", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
    "sa-east-1", "ca-central-1",
  ];

  const connectionCandidates: string[] = [
    // Direct connection (no pooler)
    `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  ];

  // Pooler connections across all regions (session mode = port 5432, transaction mode = port 6543)
  for (const region of regions) {
    connectionCandidates.push(
      `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    );
  }

  console.log("\n--------------------------------------------------------");
  console.log("  STEP 1 - Connecting to Supabase PostgreSQL");
  console.log("--------------------------------------------------------");
  console.log("  Trying " + connectionCandidates.length + " connection candidates...");

  let sql: ReturnType<typeof postgres> | null = null;

  for (let i = 0; i < connectionCandidates.length; i++) {
    const connStr = connectionCandidates[i];
    // Show a short label for the connection being tried
    const label = connStr
      .replace(`postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@`, "pooler:")
      .replace(`postgresql://postgres:${DB_PASSWORD}@`, "direct:")
      .replace("/postgres", "");
    
    const candidate = postgres(connStr, {
      ssl: "require",
      connect_timeout: 8,
      idle_timeout: 5,
      max: 1,
    });

    try {
      const result = await candidate`SELECT current_database(), current_user`;
      console.log("  [OK] Connected via: " + label);
      console.log("       User: " + result[0].current_user + " @ " + result[0].current_database);
      sql = candidate;
      break;
    } catch {
      await candidate.end().catch(() => {});
    }
  }

  if (!sql) {
    console.error("\n  [FAIL] Could not connect with any connection string.");
    console.error("\n  Please run the schema manually:");
    console.error("  1. Open: https://supabase.com/dashboard/project/" + PROJECT_REF + "/sql/new");
    console.error("  2. Paste contents of supabase/schema.sql");
    console.error("  3. Click Run\n");
    process.exit(1);
  }

  console.log("\n--------------------------------------------------------");
  console.log("  STEP 2 - Executing schema.sql");
  console.log("--------------------------------------------------------");

  try {
    await sql.unsafe(schema);
    console.log("  [OK] Full schema executed successfully");
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      console.log("  [OK] Schema objects already exist (safe to continue)");
    } else {
      console.error("  [FAIL] Schema execution error: " + err.message);
      console.error("\n  Trying statement-by-statement...\n");
      await runStatements(sql, schema);
    }
  }

  console.log("\n--------------------------------------------------------");
  console.log("  STEP 3 - Verifying tables");
  console.log("--------------------------------------------------------");

  const tables = [
    "organizations", "profiles", "credentials", "documents",
    "ai_api_keys", "ai_agents", "ai_actions", "audit_logs",
    "document_comments", "document_passwords",
  ];

  let allOk = true;
  for (const t of tables) {
    try {
      const check = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${t}
        ) as exists
      `;
      if (check[0].exists) {
        console.log("  [OK]   " + t);
      } else {
        console.log("  [FAIL] " + t + " - not found");
        allOk = false;
      }
    } catch (err: any) {
      console.log("  [FAIL] " + t + " - " + err.message);
      allOk = false;
    }
  }

  if (!allOk) {
    console.log("\n  Some tables are missing. Check for errors above.");
  }

  // Check for enum type
  try {
    const enumCheck = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
      ) as exists
    `;
    console.log("  [" + (enumCheck[0].exists ? "OK" : "FAIL") + "]   user_role enum type");
  } catch {}

  console.log("\n--------------------------------------------------------");
  console.log("  STEP 4 - Seed the database");
  console.log("--------------------------------------------------------");
  console.log("  Seed via the API for bcrypt passwords:");
  console.log("    1. bun dev");
  console.log("    2. Open http://localhost:3000/api/seed");
  console.log("    3. Default password: Password123!");

  console.log("\n========================================================");
  console.log("  Setup complete!");
  console.log("========================================================\n");

  await sql.end();
}

function splitSQL(sqlText: string): string[] {
  const stmts: string[] = [];
  let buf = "";
  let inDollar = false;
  for (const line of sqlText.split("\n")) {
    const t = line.trim();
    if (!t || (t.startsWith("--") && !inDollar)) continue;
    const dCount = (line.match(/\$\$/g) || []).length;
    if (dCount % 2 !== 0) inDollar = !inDollar;
    buf += line + "\n";
    if (t.endsWith(";") && !inDollar) {
      stmts.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) stmts.push(buf.trim());
  return stmts;
}

async function runStatements(sql: ReturnType<typeof postgres>, schema: string) {
  const stmts = splitSQL(schema);
  console.log("  " + stmts.length + " statements to execute\n");
  let ok = 0, skipped = 0, failed = 0;
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    const preview = stmt.replace(/\s+/g, " ").substring(0, 60);
    const n = "[" + String(i + 1).padStart(2) + "/" + stmts.length + "]";
    try {
      await sql.unsafe(stmt);
      console.log("  " + n + " OK    " + preview);
      ok++;
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log("  " + n + " SKIP  " + preview + " (exists)");
        skipped++;
      } else {
        console.log("  " + n + " FAIL  " + preview);
        console.log("         " + msg.substring(0, 200));
        failed++;
      }
    }
  }
  console.log("\n  Result: " + ok + " ok, " + skipped + " skipped, " + failed + " failed");
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});