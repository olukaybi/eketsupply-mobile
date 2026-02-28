/**
 * Runs the chat_messages table migration against the live Supabase instance.
 * Usage: node scripts/migrate-chat.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local or environment
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to:', SUPABASE_URL);

// Test connection by checking if chat_messages already exists
const response = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages?limit=1`, {
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  },
});

if (response.status === 200) {
  console.log('✅ chat_messages table already exists — no migration needed.');
  process.exit(0);
} else if (response.status === 404) {
  console.log('⚠️  chat_messages table not found — migration required.');
  console.log('');
  console.log('Please run the following SQL in your Supabase Dashboard → SQL Editor:');
  console.log('');
  console.log(`
-- ============================================================
-- EketSupply: Create chat_messages table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR artisan_id IN (
           SELECT id FROM public.artisans
           WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         )
    )
  );

CREATE POLICY "Booking participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR artisan_id IN (
           SELECT id FROM public.artisans
           WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         )
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON public.chat_messages FOR UPDATE
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR artisan_id IN (
           SELECT id FROM public.artisans
           WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         )
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON public.chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON public.chat_messages(read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
  `);
} else {
  console.log('Unexpected status:', response.status, await response.text());
}
