/**
 * Apply supabase_artisan_schema_v2.sql migration via Supabase Management API
 * Run: npx tsx scripts/apply-schema-v2.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Apply each ALTER TABLE statement individually using the REST API
// We use the PostgREST /rpc endpoint if exec_sql exists, otherwise we use
// individual column additions via the Supabase client
async function checkColumn(table: string, column: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .limit(1);
  return !error;
}

async function applyMigration() {
  console.log("Checking current artisans table schema...");
  
  const columnsToCheck = [
    "bank_name", "bank_code", "account_number", "account_name",
    "verification_status", "verified_at", "rejection_reason",
    "name", "phone", "address", "city", "skills",
    "experience_years", "hourly_rate", "is_available",
    "id_type", "id_number", "id_document_url", "selfie_url"
  ];
  
  const missing: string[] = [];
  for (const col of columnsToCheck) {
    const exists = await checkColumn("artisans", col);
    if (!exists) {
      missing.push(col);
      console.log(`  ✗ Missing: ${col}`);
    } else {
      console.log(`  ✓ Exists: ${col}`);
    }
  }
  
  if (missing.length === 0) {
    console.log("\n✅ All columns already exist — no migration needed.");
    return;
  }
  
  console.log(`\n⚠️  ${missing.length} columns are missing from the artisans table.`);
  console.log("\nTo apply the migration, run this SQL in your Supabase SQL Editor:");
  console.log("https://supabase.com/dashboard/project/_/sql");
  console.log("\n--- COPY THIS SQL ---");
  
  const alterStatements = missing.map(col => {
    const defs: Record<string, string> = {
      bank_name: "TEXT",
      bank_code: "TEXT",
      account_number: "TEXT",
      account_name: "TEXT",
      verification_status: "TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'))",
      verified_at: "TIMESTAMPTZ",
      rejection_reason: "TEXT",
      name: "TEXT",
      phone: "TEXT",
      address: "TEXT",
      city: "TEXT",
      skills: "TEXT[]",
      experience_years: "INTEGER",
      hourly_rate: "NUMERIC(10,2)",
      is_available: "BOOLEAN DEFAULT true",
      id_type: "TEXT",
      id_number: "TEXT",
      id_document_url: "TEXT",
      selfie_url: "TEXT",
    };
    return `ALTER TABLE artisans ADD COLUMN IF NOT EXISTS ${col} ${defs[col] || "TEXT"};`;
  });
  
  console.log(alterStatements.join("\n"));
  console.log("--- END SQL ---\n");
  
  // Try to apply via the pg connection string if available
  const pgUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (pgUrl) {
    console.log("DATABASE_URL found — attempting direct PostgreSQL migration...");
    try {
      const { Client } = await import("pg" as any);
      const client = new Client({ connectionString: pgUrl });
      await client.connect();
      for (const stmt of alterStatements) {
        await client.query(stmt);
        console.log(`  ✓ Applied: ${stmt.substring(0, 60)}...`);
      }
      await client.end();
      console.log("\n✅ Migration applied successfully via direct PostgreSQL connection!");
    } catch (err: any) {
      console.log("Direct PostgreSQL connection failed:", err.message);
      console.log("Please run the SQL above manually in the Supabase SQL Editor.");
    }
  } else {
    console.log("No DATABASE_URL found. Please run the SQL above manually in the Supabase SQL Editor.");
  }
}

applyMigration().catch(console.error);
