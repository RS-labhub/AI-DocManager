import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import postgres from 'postgres';

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '';
const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  .replace('https://', '')
  .replace('.supabase.co', '');

const db = postgres(
  `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  { ssl: 'require' }
);

async function main() {
  const rows = await db`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'documents'
    ORDER BY ordinal_position
  `;
  console.log('\n=== Documents table columns ===');
  for (const r of rows) {
    console.log(`  ${r.column_name} (${r.data_type}) default: ${r.column_default || 'none'}`);
  }
  console.log(`\nTotal: ${rows.length} columns`);

  const newCols = ['description', 'file_url', 'file_size', 'version', 'status', 'last_accessed_at'];
  const found = rows.map((r: any) => r.column_name);
  console.log('\n=== V3 Migration columns check ===');
  for (const col of newCols) {
    console.log(`  ${col}: ${found.includes(col) ? '✅' : '❌'}`);
  }

  await db.end();
}

main().catch(console.error);
