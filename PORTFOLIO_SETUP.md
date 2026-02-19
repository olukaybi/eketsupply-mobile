# Portfolio Gallery Setup Guide

This guide explains how to set up the portfolio gallery feature for artisans in the EketSupply mobile app.

## Overview

The portfolio gallery allows artisans to:
- Upload up to 12 high-quality photos of their completed work
- Manage their portfolio (add/delete photos)
- Showcase their best work to potential customers
- Display photos in a professional grid layout on their profile

## Database Setup

### Step 1: Run the Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase_portfolio_migration.sql` from the project root
4. Copy and paste the entire SQL script into the SQL Editor
5. Click **Run** to execute the migration

This will:
- Create the `portfolio_photos` table
- Set up Row Level Security (RLS) policies
- Create the `portfolio-photos` storage bucket
- Configure storage policies

### Step 2: Verify the Setup

After running the migration, verify:

1. **Table Created**: Go to **Table Editor** → Check for `portfolio_photos` table
2. **Storage Bucket**: Go to **Storage** → Check for `portfolio-photos` bucket
3. **RLS Enabled**: Go to **Authentication** → **Policies** → Verify policies exist for `portfolio_photos`

## Database Schema

### portfolio_photos Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `artisan_id` | UUID | Foreign key to artisans table |
| `photo_url` | TEXT | Public URL of the uploaded photo |
| `caption` | TEXT | Optional caption for the photo |
| `display_order` | INTEGER | Order in which photos are displayed |
| `created_at` | TIMESTAMP | When the photo was uploaded |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Features

### For Artisans

1. **Access Portfolio Manager**
   - Navigate to the Analytics tab
   - Tap "Manage Portfolio" button at the top
   - This opens the portfolio management screen

2. **Upload Photos**
   - Tap "Add Portfolio Photo" button
   - Select a photo from your device gallery
   - Photo is automatically uploaded to Supabase storage
   - Maximum 12 photos allowed per artisan

3. **Delete Photos**
   - Tap the red delete button on any photo
   - Confirm deletion
   - Photo is removed from both storage and database

### For Customers

1. **View Portfolio**
   - Open any artisan's profile
   - Scroll to the "Portfolio" section
   - Tap any photo to view in fullscreen gallery
   - Swipe left/right to navigate between photos
   - Pinch to zoom on photos

## File Structure

```
app/
  portfolio-manager.tsx          # Portfolio management screen for artisans
  artisan/[id].tsx               # Updated to display portfolio photos
  (tabs)/
    analytics.tsx                # Added "Manage Portfolio" button

components/
  ui/icon-symbol.tsx             # Added photo, trash, plus icons

supabase_portfolio_migration.sql # Database migration file
PORTFOLIO_SETUP.md              # This setup guide
```

## Security

### Row Level Security (RLS)

The following RLS policies are in place:

1. **View**: Anyone can view portfolio photos (public)
2. **Insert**: Only authenticated artisans can upload photos to their own portfolio
3. **Update**: Only the artisan who owns the photo can update it
4. **Delete**: Only the artisan who owns the photo can delete it

### Storage Policies

1. **View**: Public access to view all photos in the `portfolio-photos` bucket
2. **Upload**: Only authenticated users can upload photos
3. **Update/Delete**: Only the user who uploaded the photo can modify or delete it

## Image Specifications

- **Format**: JPEG (automatically converted)
- **Aspect Ratio**: 4:3 (enforced during image picking)
- **Quality**: 80% compression for optimal balance between quality and file size
- **Max Photos**: 12 per artisan

## Usage Tips

### For Artisans

1. **Upload High-Quality Photos**: Use well-lit, clear photos of your completed work
2. **Show Variety**: Upload different types of projects to demonstrate your range
3. **Keep It Professional**: Only upload photos of finished, quality work
4. **Regular Updates**: Update your portfolio as you complete new projects

### For Developers

1. **Testing**: Use the sample artisan accounts to test upload/delete functionality
2. **Storage**: Monitor Supabase storage usage as photos accumulate
3. **Performance**: Photos are lazy-loaded for optimal performance
4. **Error Handling**: All upload/delete operations include error handling and user feedback

## Troubleshooting

### Photos Not Uploading

1. Check Supabase storage bucket exists: `portfolio-photos`
2. Verify storage policies allow authenticated uploads
3. Check device permissions for photo library access
4. Ensure artisan profile exists in database

### Photos Not Displaying

1. Verify `portfolio_photos` table has data
2. Check RLS policies allow public SELECT
3. Ensure photo URLs are valid and accessible
4. Check network connectivity

### Delete Not Working

1. Verify user is authenticated
2. Check RLS policies allow DELETE for photo owner
3. Ensure storage policies allow deletion
4. Check file path extraction from URL is correct

## Next Steps

After setting up the portfolio feature, consider:

1. **Add Captions**: Enable artisans to add descriptions to their photos
2. **Reorder Photos**: Allow drag-and-drop reordering of portfolio photos
3. **Photo Categories**: Tag photos by project type (before/after, specific services)
4. **Featured Photo**: Let artisans select one photo as their profile cover
5. **Analytics**: Track which portfolio photos get the most views

## Support

For issues or questions:
- Check the Supabase logs for error messages
- Review the RLS policies in the Supabase dashboard
- Verify storage bucket configuration
- Test with different artisan accounts
