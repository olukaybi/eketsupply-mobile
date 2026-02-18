# Database Migration - Quick Start Guide

## 📋 5-Minute Setup

### Step 1: Login to Supabase
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (or create a new one if needed)

### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query** button (top right)

### Step 3: Run Migration
1. Open the file `supabase_schema.sql` in this project
2. Copy **ALL** the SQL code (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click **Run** button (bottom right)
5. Wait for "Success. No rows returned" message

### Step 4: Verify Setup
1. Click **Table Editor** in left sidebar
2. You should see 4 new tables:
   - ✅ profiles
   - ✅ artisans  
   - ✅ services
   - ✅ reviews

3. Click on **artisans** table
4. You should see 3 sample artisans:
   - Chidi Okafor (Plumbing)
   - Amaka Nwosu (Electrical)
   - Tunde Adeyemi (Carpentry)

### Step 5: Test the App
1. Open the mobile app
2. Try signing up with a new account
3. Check home screen - you should see the 3 artisans
4. Tap on an artisan to view their profile

---

## ✅ Success Checklist

- [ ] SQL migration ran without errors
- [ ] 4 tables created in Supabase
- [ ] 3 sample artisans visible in Table Editor
- [ ] App shows artisans on home screen
- [ ] Can view artisan profile details

---

## ❌ Troubleshooting

**Error: "relation already exists"**
- The tables are already created. You can skip this step.

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check that you selected the correct project

**No artisans showing in app**
- Verify data exists in Supabase Table Editor
- Check app console for errors
- Ensure environment variables are set correctly

---

## 🔄 Reset Database (if needed)

If you need to start over:

```sql
-- Run this in SQL Editor to drop all tables
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS artisans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
```

Then run the full `supabase_schema.sql` again.

---

**Next:** Once migration is complete, the booking system and push notifications will be ready to use!
