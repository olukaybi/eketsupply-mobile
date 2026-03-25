/**
 * Assign remaining artisan photos to profiles that still have no avatar_url.
 * Maps the 15 generated photos to the 18 artisan profiles in the database.
 */
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// Available resized photos (already uploaded — use their public URLs)
// We'll re-upload the remaining ones to new filenames for the remaining profiles
const photoFiles = [
  "/home/ubuntu/artisan_photos_resized/artisan_07_kemi.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_08_ibrahim.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_09_funke.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_10_seun.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_11_yemi.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_12_adaeze.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_13_musa.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_14_chisom.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_15_dele.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_01_emeka.jpg",
  "/home/ubuntu/artisan_photos_resized/artisan_02_chidi.jpg",
];

async function uploadPhoto(filePath: string, slug: string): Promise<string | null> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `${slug}-${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("artisan-photos")
    .upload(fileName, fileBuffer, { contentType: "image/jpeg", upsert: true });

  if (error) {
    console.error(`Upload failed: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from("artisan-photos").getPublicUrl(fileName);
  return data.publicUrl;
}

async function main() {
  // Get all artisan profiles without avatar_url
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("user_type", "artisan")
    .or("avatar_url.is.null,avatar_url.eq.");

  if (error) {
    console.error("Error fetching profiles:", error.message);
    return;
  }

  console.log(`Found ${profiles?.length} profiles without photos`);
  
  if (!profiles || profiles.length === 0) {
    console.log("✅ All artisan profiles already have photos!");
    return;
  }

  let photoIndex = 0;
  for (const profile of profiles) {
    if (photoIndex >= photoFiles.length) {
      // Cycle through photos if we run out
      photoIndex = 0;
    }

    const filePath = photoFiles[photoIndex];
    const slug = profile.full_name.split(" ")[0].toLowerCase();
    
    console.log(`📸 Assigning photo to ${profile.full_name}...`);
    const photoUrl = await uploadPhoto(filePath, slug);

    if (photoUrl) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: photoUrl })
        .eq("id", profile.id);

      if (updateError) {
        console.error(`❌ Failed to update ${profile.full_name}: ${updateError.message}`);
      } else {
        console.log(`✅ ${profile.full_name} → ${photoUrl}`);
      }
    }

    photoIndex++;
  }

  console.log("\n✅ All done!");
}

main().catch(console.error);
