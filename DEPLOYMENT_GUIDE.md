# EketSupply Mobile App - Deployment Guide

This guide will help you deploy the EketSupply mobile app database and publish the app.

## Prerequisites

- Supabase project created (you should already have this)
- Supabase credentials configured in your app
- Access to Supabase SQL Editor

---

## Step 1: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project** at https://supabase.com/dashboard
2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query" button
3. **Copy the migration file**
   - Open the file: `MASTER_MIGRATION.sql` (in your project root)
   - Copy the entire contents
4. **Paste and run**
   - Paste the SQL into the editor
   - Click "Run" button (or press Ctrl/Cmd + Enter)
5. **Verify success**
   - You should see: "EketSupply Master Migration completed successfully!"
   - Check the "Table Editor" to see all new tables

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push --file MASTER_MIGRATION.sql
```

---

## Step 2: Create Storage Buckets

You need to create storage buckets for file uploads:

1. **Navigate to Storage** in Supabase dashboard
2. **Create these buckets** (click "New bucket" for each):

   | Bucket Name | Public | Description |
   |-------------|--------|-------------|
   | `portfolio-photos` | ✅ Yes | Artisan portfolio gallery photos |
   | `before-after-photos` | ✅ Yes | Before/after transformation photos |
   | `video-testimonials` | ✅ Yes | Customer video reviews |
   | `verification-documents` | ❌ No | ID cards, certifications (private) |

3. **Set bucket policies** (for public buckets):
   - Click on each public bucket
   - Go to "Policies" tab
   - Click "New policy"
   - Select "Allow public read access"
   - Save

---

## Step 3: Configure Storage Policies

For the `verification-documents` bucket (private):

1. Go to Storage → `verification-documents` → Policies
2. Add these policies:

**Policy 1: Artisans can upload their documents**
```sql
CREATE POLICY "Artisans can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid() IN (SELECT user_id FROM artisans)
);
```

**Policy 2: Artisans can view their documents**
```sql
CREATE POLICY "Artisans can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents'
  AND auth.uid() IN (SELECT user_id FROM artisans)
);
```

---

## Step 4: Verify Database Setup

Run this query in SQL Editor to check everything is set up:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'portfolio_photos',
    'before_after_photos',
    'video_testimonials',
    'artisan_badges',
    'service_packages',
    'verification_documents',
    'referral_codes',
    'response_times',
    'emergency_bookings'
  )
ORDER BY table_name;

-- Should return 9 rows
```

---

## Step 5: Publish the Mobile App

### Using Manus Platform

1. **Click the "Publish" button** in the top-right corner of the Management UI
2. **Wait for build to complete** (this may take 2-5 minutes)
3. **Get your app link**:
   - You'll receive a QR code
   - You'll get a shareable link
   - Users can scan the QR code with their camera to open in Expo Go

### Testing the Published App

1. **Install Expo Go** on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scan the QR code** from the publish screen

3. **Test key features**:
   - Sign up/login
   - Browse artisans
   - View map with nearby artisans
   - Try emergency booking flow
   - Check artisan profiles with portfolios

---

## Step 6: Optional - Add Sample Data

To test the app with sample data, run this in SQL Editor:

```sql
-- Add sample Lagos coordinates to existing artisans
UPDATE artisans 
SET 
  latitude = 6.5244 + (random() * 0.1 - 0.05),
  longitude = 3.3792 + (random() * 0.1 - 0.05),
  location_updated_at = NOW()
WHERE id IN (SELECT id FROM artisans LIMIT 10);

-- Verify location data
SELECT id, name, latitude, longitude 
FROM artisans 
WHERE latitude IS NOT NULL 
LIMIT 5;
```

---

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- This is safe to ignore - it means some tables were already created
- The migration is idempotent (safe to run multiple times)

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check your Supabase project permissions

### Storage Bucket Errors

**Error: "Bucket already exists"**
- Skip to the next bucket
- Buckets may have been created previously

**Error: "Cannot upload files"**
- Check bucket policies are correctly set
- Verify the bucket is set to "Public" for portfolio/video buckets

### App Not Loading

**QR code not working**
- Make sure you have Expo Go installed
- Try opening the link directly in your browser first
- Check your phone and computer are on the same network

**App crashes on startup**
- Check the Supabase URL and anon key are correct in your environment
- Verify the database migration completed successfully
- Check the browser console for error messages

---

## Next Steps After Deployment

1. **Create admin account** for reviewing verification requests
2. **Add initial artisans** through the app or database
3. **Test all features** thoroughly before sharing widely
4. **Monitor usage** through Supabase dashboard analytics
5. **Set up backups** in Supabase settings

---

## App Store Deployment (Future)

When you're ready to deploy to app stores:

### Google Play Store
- Cost: $25 (one-time)
- Process: Build APK → Create developer account → Upload → Review (2-7 days)
- Required: Privacy policy, app screenshots, description

### Apple App Store
- Cost: $99/year
- Process: Build IPA → Create developer account → Upload → Review (1-3 days)
- Required: Privacy policy, app screenshots, description, TestFlight testing

---

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Review the browser console for errors
3. Check the app logs in Expo Go
4. Contact support at https://help.manus.im

---

## Summary Checklist

- [ ] Run `MASTER_MIGRATION.sql` in Supabase SQL Editor
- [ ] Create 4 storage buckets (portfolio, before-after, video, verification)
- [ ] Set bucket policies (public for 3, private for verification)
- [ ] Verify database setup with test query
- [ ] Click "Publish" button in Manus UI
- [ ] Test app with Expo Go
- [ ] Add sample location data (optional)
- [ ] Share QR code with users

**Your EketSupply mobile app is now deployed! 🎉**
