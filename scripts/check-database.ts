import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database...\n');
  
  // Check profiles
  console.log('📋 Profiles Table:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
  } else {
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    profiles?.forEach(p => console.log(`   - ${p.full_name} (${p.user_type})`));
  }
  
  console.log('\n👷 Artisans Table:');
  const { data: artisans, error: artisansError } = await supabase
    .from('artisans')
    .select(`
      *,
      profiles!artisans_profile_id_fkey(full_name, email)
    `);
  
  if (artisansError) {
    console.error('❌ Error fetching artisans:', artisansError);
  } else {
    console.log(`✅ Found ${artisans?.length || 0} artisans`);
    artisans?.forEach(a => console.log(`   - ${a.profiles?.full_name} - ${a.service_category} (Rating: ${a.rating})`));
  }
  
  console.log('\n🛠️  Services Table:');
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*');
  
  if (servicesError) {
    console.error('❌ Error fetching services:', servicesError);
  } else {
    console.log(`✅ Found ${services?.length || 0} services`);
    services?.forEach(s => console.log(`   - ${s.name}: ${s.price}`));
  }
  
  console.log('\n⭐ Reviews Table:');
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*');
  
  if (reviewsError) {
    console.error('❌ Error fetching reviews:', reviewsError);
  } else {
    console.log(`✅ Found ${reviews?.length || 0} reviews`);
  }
  
  console.log('\n📅 Bookings Table:');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*');
  
  if (bookingsError) {
    console.error('❌ Error fetching bookings:', bookingsError);
  } else {
    console.log(`✅ Found ${bookings?.length || 0} bookings`);
  }
  
  console.log('\n✅ Database check complete!');
}

checkDatabase().catch(console.error);
