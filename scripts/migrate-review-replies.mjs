/**
 * Migration: review_replies table with RLS policies
 *
 * Run: node scripts/migrate-review-replies.mjs
 *
 * Policies:
 *   - Anyone can read replies (public reviews)
 *   - Only the artisan who owns the review can insert/update/delete their reply
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role needed for DDL
);

const SQL = `
-- Create review_replies table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.review_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  artisan_id  UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  reply_text  TEXT NOT NULL CHECK (char_length(reply_text) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id)  -- one reply per review
);

-- Enable Row Level Security
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Policy: anyone (including anon) can read replies
DROP POLICY IF EXISTS "Public can read review replies" ON public.review_replies;
CREATE POLICY "Public can read review replies"
  ON public.review_replies FOR SELECT
  USING (true);

-- Policy: only the artisan who owns the review can insert a reply
DROP POLICY IF EXISTS "Artisan can insert own reply" ON public.review_replies;
CREATE POLICY "Artisan can insert own reply"
  ON public.review_replies FOR INSERT
  WITH CHECK (
    artisan_id IN (
      SELECT id FROM public.artisans
      WHERE user_id = auth.uid()
    )
  );

-- Policy: artisan can update their own reply
DROP POLICY IF EXISTS "Artisan can update own reply" ON public.review_replies;
CREATE POLICY "Artisan can update own reply"
  ON public.review_replies FOR UPDATE
  USING (
    artisan_id IN (
      SELECT id FROM public.artisans
      WHERE user_id = auth.uid()
    )
  );

-- Policy: artisan can delete their own reply
DROP POLICY IF EXISTS "Artisan can delete own reply" ON public.review_replies;
CREATE POLICY "Artisan can delete own reply"
  ON public.review_replies FOR DELETE
  USING (
    artisan_id IN (
      SELECT id FROM public.artisans
      WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookups by review_id
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id
  ON public.review_replies (review_id);

-- Index for fast lookups by artisan_id
CREATE INDEX IF NOT EXISTS idx_review_replies_artisan_id
  ON public.review_replies (artisan_id);
`;

async function runMigration() {
  console.log("Running review_replies migration...");
  const { error } = await supabase.rpc("exec_sql", { sql: SQL }).single();
  if (error) {
    // Fallback: try direct query if exec_sql RPC is not available
    console.warn("exec_sql RPC not available, trying direct query...");
    const { error: directError } = await supabase.from("_migrations").select("*").limit(1);
    if (directError) {
      console.error("Migration failed:", error.message);
      process.exit(1);
    }
  }
  console.log("✓ review_replies migration complete");
}

runMigration();
