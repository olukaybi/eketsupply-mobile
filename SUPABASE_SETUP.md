# Supabase Setup Instructions

## Overview
The EketSupply mobile app now uses real Supabase authentication and database integration instead of mock data.

---

## Prerequisites
- Supabase account (free tier is sufficient)
- Supabase project created
- Supabase URL and Anon Key configured (already done via environment variables)

---

## Database Setup

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase_schema.sql` from this project
5. Paste into the SQL editor
6. Click **Run** to execute the migration

This will create:
- ✅ `profiles` table (user profiles)
- ✅ `artisans` table (artisan profiles)
- ✅ `services` table (services offered by artisans)
- ✅ `reviews` table (customer reviews)
- ✅ Row Level Security (RLS) policies
- ✅ Automatic triggers for profile creation
- ✅ Sample data for testing

### Step 2: Verify Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see 4 new tables:
   - `profiles`
   - `artisans`
   - `services`
   - `reviews`

### Step 3: Verify Sample Data

Check that sample data was inserted:
- **Profiles**: 3 artisan profiles (Chidi, Amaka, Tunde)
- **Artisans**: 3 artisan records with ratings and stats
- **Services**: 4 services across artisans
- **Reviews**: 3 sample reviews

---

## Authentication Setup

### Email Authentication (Already Configured)

The app uses Supabase's built-in email/password authentication:

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Ensure **Email** provider is enabled
3. Configure email templates (optional):
   - Confirmation email
   - Password reset email
   - Magic link email

### Email Confirmation Settings

By default, Supabase requires email confirmation. For testing:

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, toggle **Enable email confirmations** OFF for easier testing
3. For production, keep it ON for security

---

## Testing the Integration

### Test 1: Sign Up
1. Open the mobile app
2. Tap "Sign In" → "Sign Up"
3. Fill in details:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Select user type (Seeker or Artisan)
4. Tap "Create Account"
5. Check Supabase dashboard → **Authentication** → **Users** to see the new user

### Test 2: Sign In
1. Use the credentials from Test 1
2. Sign in should work and redirect to home screen
3. User info should be displayed in the header

### Test 3: View Artisans
1. On home screen, scroll to "Featured Artisans"
2. You should see 3 artisans loaded from database:
   - Chidi Okafor (Plumbing)
   - Amaka Nwosu (Electrical)
   - Tunde Adeyemi (Carpentry)

### Test 4: View Artisan Profile
1. Tap on any artisan card
2. Profile should load with:
   - Artisan details
   - Services offered
   - Customer reviews
   - Stats (jobs done, rating, reviews)

---

## Troubleshooting

### Issue: No artisans showing on home screen

**Solution:**
1. Check Supabase dashboard → **Table Editor** → `artisans`
2. Verify data exists
3. Check browser/app console for errors
4. Ensure RLS policies are set correctly

### Issue: Authentication fails

**Solution:**
1. Verify Supabase URL and Anon Key in environment variables
2. Check **Authentication** → **Settings** in Supabase
3. Ensure email provider is enabled
4. Check app console for specific error messages

### Issue: "Profile not found" error

**Solution:**
1. Check if the `handle_new_user()` trigger is working
2. Go to **Database** → **Functions** in Supabase
3. Verify `handle_new_user` function exists
4. Manually insert a profile if needed:
```sql
INSERT INTO profiles (user_id, email, full_name, user_type)
VALUES ('user-uuid-here', 'email@example.com', 'Full Name', 'seeker');
```

### Issue: RLS policy errors

**Solution:**
1. Go to **Authentication** → **Policies** in Supabase
2. Verify policies exist for all tables
3. Re-run the SQL migration if policies are missing

---

## Database Schema Reference

### Profiles Table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- full_name: TEXT
- email: TEXT
- phone: TEXT
- user_type: TEXT ('seeker' or 'artisan')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Artisans Table
```sql
- id: UUID (primary key)
- profile_id: UUID (references profiles)
- service_category: TEXT
- bio: TEXT
- location: TEXT
- rating: DECIMAL(2,1)
- total_reviews: INTEGER
- completed_jobs: INTEGER
- response_time: TEXT
- availability: TEXT
- verified: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Services Table
```sql
- id: UUID (primary key)
- artisan_id: UUID (references artisans)
- name: TEXT
- description: TEXT
- price_min: INTEGER
- price_max: INTEGER
- duration: TEXT
- created_at: TIMESTAMP
```

### Reviews Table
```sql
- id: UUID (primary key)
- artisan_id: UUID (references artisans)
- reviewer_id: UUID (references profiles)
- reviewer_name: TEXT
- rating: INTEGER (1-5)
- comment: TEXT
- created_at: TIMESTAMP
```

---

## Next Steps

1. **Add More Artisans**: Insert more artisan data for testing
2. **Test on Device**: Use Expo Go to test on real device
3. **Configure Email Templates**: Customize Supabase email templates
4. **Enable Email Confirmation**: Turn on for production
5. **Add Profile Pictures**: Extend schema to support images
6. **Implement Search**: Add search functionality for artisans
7. **Add Booking System**: Implement booking and payment flows

---

## Security Notes

- ✅ Row Level Security (RLS) is enabled on all tables
- ✅ Users can only update their own profiles
- ✅ Artisans can only manage their own services
- ✅ All artisan data is publicly viewable
- ✅ Authentication tokens are stored securely in Expo SecureStore

---

## Support

If you encounter issues:
1. Check Supabase logs: **Logs** → **API Logs**
2. Check app console for error messages
3. Verify environment variables are set correctly
4. Ensure you're using the latest Supabase client library

---

**Last Updated:** February 18, 2026
**Supabase Client Version:** @supabase/supabase-js ^2.96.0
