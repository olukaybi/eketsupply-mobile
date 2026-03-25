import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase Service Role Key", () => {
  it("should be set in environment", () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).not.toBe("");
  });

  it("should be able to list storage buckets with service role key", async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(url).toBeTruthy();
    expect(serviceKey).toBeTruthy();

    const sb = createClient(url!, serviceKey!);
    const { data, error } = await sb.storage.listBuckets();

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    console.log("✅ Service role key valid. Existing buckets:", data?.map(b => b.name));
  }, 15000);
});
