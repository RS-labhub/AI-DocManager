import postgres from "postgres"

const sql = postgres({
  host: "db.mznwyzecwzcwgmuwfenv.supabase.co",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "wdcpbMK6VfrZlEyT",
  ssl: "require",
})

async function run() {
  try {
    // 1. Drop old access_level CHECK constraint
    console.log("1. Dropping access_level constraint...")
    await sql`ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_access_level_check`
    console.log("   ✅ Done")

    // 2. Set new default
    console.log("2. Setting default to 'view_only'...")
    await sql`ALTER TABLE documents ALTER COLUMN access_level SET DEFAULT 'view_only'`
    console.log("   ✅ Done")

    // 3. Update existing rows
    console.log("3. Updating 'private' -> 'view_only'...")
    const r1 = await sql`UPDATE documents SET access_level = 'view_only' WHERE access_level = 'private'`
    console.log(`   ✅ Updated ${r1.count} rows`)

    console.log("4. Updating 'org' -> 'view_only'...")
    const r2 = await sql`UPDATE documents SET access_level = 'view_only' WHERE access_level = 'org'`
    console.log(`   ✅ Updated ${r2.count} rows`)

    console.log("5. Updating 'public' -> 'full_access'...")
    const r3 = await sql`UPDATE documents SET access_level = 'full_access' WHERE access_level = 'public'`
    console.log(`   ✅ Updated ${r3.count} rows`)

    // 6. Drop classification constraint to allow 'organization'
    console.log("6. Dropping classification constraint...")
    await sql`ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_classification_check`
    console.log("   ✅ Done")

    // 7. Show current access_level values
    const rows = await sql`SELECT DISTINCT access_level, count(*) FROM documents GROUP BY access_level`
    console.log("7. Current access_level distribution:", rows)

    console.log("\n🎉 Migration complete!")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await sql.end()
  }
}

run()
