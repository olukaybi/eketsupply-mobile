import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestBooking() {
  console.log('📝 Adding test booking to database...\n');
  
  // First, get the artisan and service IDs
  const { data: artisans } = await supabase
    .from('artisans')
    .select('id, profiles!artisans_profile_id_fkey(full_name)')
    .eq('service_category', 'Plumbing')
    .limit(1);
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(1);
  
  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .limit(1);
  
  if (!artisans || !profiles || !services) {
    console.error('❌ Could not fetch required data');
    return;
  }
  
  const artisan = artisans[0];
  const customer = profiles[0];
  const service = services[0];
  
  console.log(`👤 Customer: ${customer.full_name}`);
  console.log(`👷 Artisan: ${(artisan.profiles as any)?.full_name}`);
  console.log(`🛠️  Service: ${service.name}\n`);
  
  // Create the booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: customer.id,
      artisan_id: artisan.id,
      service_id: service.id,
      booking_type: 'instant',
      status: 'pending',
      service_description: 'Need urgent pipe repair in kitchen',
      preferred_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      preferred_time: '10:00 AM',
      location: 'Lagos, Nigeria',
      estimated_price: 12000,
      payment_method: 'cash',
      payment_status: 'pending',
      customer_notes: 'Please call before coming. Gate code is 1234.'
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating booking:', error);
    return;
  }
  
  console.log('✅ Booking created successfully!');
  console.log('\n📋 Booking Details:');
  console.log(`   ID: ${booking.id}`);
  console.log(`   Type: ${booking.booking_type}`);
  console.log(`   Status: ${booking.status}`);
  console.log(`   Service: ${booking.service_description}`);
  console.log(`   Date: ${new Date(booking.preferred_date).toLocaleDateString()}`);
  console.log(`   Time: ${booking.preferred_time}`);
  console.log(`   Location: ${booking.location}`);
  console.log(`   Price: ₦${booking.estimated_price?.toLocaleString()}`);
  console.log(`   Payment: ${booking.payment_method} (${booking.payment_status})`);
  
  // Verify booking count
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('id');
  
  console.log(`\n✅ Total bookings in database: ${allBookings?.length || 0}`);
}

addTestBooking().catch(console.error);
