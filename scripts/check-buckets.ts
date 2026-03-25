import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? "✅ set" : "❌ missing");
console.log("Anon key:", anonKey ? "✅ set" : "❌ missing");
console.log("Service key:", serviceKey ? "✅ set" : "❌ missing");

if (!supabaseUrl || !anonKey) {
  console.error("Missing required env vars");
  process.exit(1);
}

const key = serviceKey || anonKey;
const sb = createClient(supabaseUrl, key);

async function main() {
  const { data: buckets, error } = await sb.storage.listBuckets();
  if (error) {
    console.error("List buckets error:", error.message);
  } else {
    console.log("Existing buckets:", buckets?.map(b => b.name));
  }
}

main().catch(console.error);
