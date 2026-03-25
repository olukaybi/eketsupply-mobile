/**
 * Upload artisan profile photos to Supabase Storage and update selfie_url
 * 
 * Photos are uploaded to the 'artisan-photos' bucket and the selfie_url
 * column in the artisans table is updated for each seeded artisan.
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map of artisan first_name → local photo file
const photoMap: Record<string, string> = {
  "Emeka":   "/home/ubuntu/artisan_photos_resized/artisan_01_emeka.jpg",
  "Chidi":   "/home/ubuntu/artisan_photos_resized/artisan_02_chidi.jpg",
  "Ngozi":   "/home/ubuntu/artisan_photos_resized/artisan_03_ngozi.jpg",
  "Tunde":   "/home/ubuntu/artisan_photos_resized/artisan_04_tunde.jpg",
  "Amaka":   "/home/ubuntu/artisan_photos_resized/artisan_05_amaka.jpg",
  "Biodun":  "/home/ubuntu/artisan_photos_resized/artisan_06_biodun.jpg",
  "Kemi":    "/home/ubuntu/artisan_photos_resized/artisan_07_kemi.jpg",
  "Ibrahim": "/home/ubuntu/artisan_photos_resized/artisan_08_ibrahim.jpg",
  "Funke":   "/home/ubuntu/artisan_photos_resized/artisan_09_funke.jpg",
  "Seun":    "/home/ubuntu/artisan_photos_resized/artisan_10_seun.jpg",
  "Yemi":    "/home/ubuntu/artisan_photos_resized/artisan_11_yemi.jpg",
  "Adaeze":  "/home/ubuntu/artisan_photos_resized/artisan_12_adaeze.jpg",
  "Musa":    "/home/ubuntu/artisan_photos_resized/artisan_13_musa.jpg",
  "Chisom":  "/home/ubuntu/artisan_photos_resized/artisan_14_chisom.jpg",
  "Dele":    "/home/ubuntu/artisan_photos_resized/artisan_15_dele.jpg",
};

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === "artisan-photos");
  if (!exists) {
    const { error } = await supabase.storage.createBucket("artisan-photos", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log("✅ Created artisan-photos bucket");
  } else {
    console.log("✅ artisan-photos bucket already exists");
  }
}

async function uploadPhoto(firstName: string, filePath: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `${firstName.toLowerCase()}-${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from("artisan-photos")
    .upload(fileName, fileBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error(`❌ Upload failed for ${firstName}: ${error.message}`);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("artisan-photos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

async function updateArtisanPhoto(firstName: string, photoUrl: string) {
  // Find profile by first name (full_name starts with firstName)
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, full_name")
    .ilike("full_name", `${firstName} %`);

  if (profileError || !profiles || profiles.length === 0) {
    console.warn(`⚠️  No profile found for ${firstName}`);
    return;
  }

  const profile = profiles[0];

  // Update avatar_url on profiles table
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ avatar_url: photoUrl })
    .eq("id", profile.id);

  if (profileUpdateError) {
    console.error(`❌ Failed to update profile for ${firstName}: ${profileUpdateError.message}`);
    return;
  }

  console.log(`✅ Updated ${profile.full_name} → ${photoUrl}`);
}

async function main() {
  console.log("🚀 Starting artisan photo upload...\n");

  await ensureBucket();

  let successCount = 0;
  let failCount = 0;

  for (const [firstName, filePath] of Object.entries(photoMap)) {
    console.log(`📸 Uploading photo for ${firstName}...`);
    const photoUrl = await uploadPhoto(firstName, filePath);

    if (photoUrl) {
      await updateArtisanPhoto(firstName, photoUrl);
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} uploaded, ${failCount} failed`);
}

main().catch(console.error);
