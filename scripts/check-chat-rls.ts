/**
 * Check chat_messages table existence and RLS status
 */
import "./load-env.js";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const r = await sb.from("chat_messages").select("id").limit(1);
  if (r.error) {
    console.log("chat_messages status:", r.error.message);
  } else {
    console.log("chat_messages table OK, rows:", r.data?.length ?? 0);
  }
}

main().catch(console.error);
