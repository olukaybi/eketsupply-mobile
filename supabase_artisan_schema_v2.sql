-- ============================================================
-- EketSupply Supabase Migration v2
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql
-- ============================================================

-- 1. Add missing columns to artisans table
ALTER TABLE artisans
  ADD COLUMN IF NOT EXISTS bank_name         TEXT,
  ADD COLUMN IF NOT EXISTS bank_code         TEXT,
  ADD COLUMN IF NOT EXISTS account_number    TEXT,
  ADD COLUMN IF NOT EXISTS account_name      TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT,
  ADD COLUMN IF NOT EXISTS name              TEXT,
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS address           TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS skills            TEXT[],
  ADD COLUMN IF NOT EXISTS experience_years  INTEGER,
  ADD COLUMN IF NOT EXISTS hourly_rate       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_available      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS id_type           TEXT,
  ADD COLUMN IF NOT EXISTS id_number         TEXT,
  ADD COLUMN IF NOT EXISTS id_document_url   TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url        TEXT;

-- 2. Create verification_documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id      UUID REFERENCES artisans(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,
  document_url    TEXT NOT NULL,
  file_name       TEXT,
  side            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id      UUID REFERENCES artisans(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artisan_id)
);

-- 4. Enable RLS on new tables
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests  ENABLE ROW LEVEL SECURITY;

-- 5. RLS: artisans can read their own verification documents
CREATE POLICY IF NOT EXISTS "artisan_own_docs_select"
  ON verification_documents FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- 6. RLS: admins can read all verification documents
CREATE POLICY IF NOT EXISTS "admin_docs_select"
  ON verification_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 7. RLS: artisans can read their own verification request
CREATE POLICY IF NOT EXISTS "artisan_own_vr_select"
  ON verification_requests FOR SELECT
  USING (
    artisan_id IN (
      SELECT id FROM artisans WHERE profile_id = auth.uid()
    )
  );

-- 8. RLS: admins can read and update all verification requests
CREATE POLICY IF NOT EXISTS "admin_vr_all"
  ON verification_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Done!
SELECT 'Migration v2 applied successfully' AS result;
