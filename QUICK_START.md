# Quick Start - 2 Minutes Setup

## Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Sign in and select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Run the Migration
1. Open `supabase_complete_migration.sql` from this project
2. Copy **ALL** the code (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **Run** (bottom right corner)
5. Wait for "Success" message

## Step 3: Verify
1. Click **Table Editor** in left sidebar
2. You should see these tables:
   - ✅ profiles
   - ✅ artisans (with 3 sample artisans)
   - ✅ services (with 9 services)
   - ✅ reviews (with 8 reviews)
   - ✅ bookings
   - ✅ push_tokens
   - ✅ notifications

## Step 4: Test the App
1. Open the mobile app preview
2. Sign up with a new account
3. Home screen should show 3 artisans
4. Tap an artisan to view profile
5. Try "Request Quote" or "Book Now"

## ✅ Done!
Your database is now fully set up with sample data.

---

## Troubleshooting

**"relation already exists"**
- Tables are already created, you're good to go!

**"permission denied"**
- Make sure you're logged in as project owner
- Check you selected the correct project

**No artisans showing**
- Check Table Editor → artisans table has 3 rows
- Verify environment variables are set correctly
- Check app console for errors

---

## What's Included

### Sample Artisans
1. **Chidi Okafor** - Plumbing (Lagos)
2. **Amaka Nwosu** - Electrical (Abuja)
3. **Tunde Adeyemi** - Carpentry (Port Harcourt)

### Features Ready
- ✅ User authentication (sign up/sign in)
- ✅ Browse artisans by category
- ✅ View artisan profiles with ratings
- ✅ Request quotes
- ✅ Book services instantly
- ✅ Push notifications
- ✅ Secure data with RLS policies

---

**Next:** Start using the app or add more artisans via the database!
