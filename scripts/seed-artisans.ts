/**
 * Seed Script: 15 Realistic Nigerian Artisans
 *
 * Inserts 15 artisans across 6 Nigerian states with varied:
 * - Categories (plumbing, electrical, carpentry, painting, AC repair, tiling, welding, etc.)
 * - Locations (Lagos, Abuja, Port Harcourt, Enugu, Kano, Ibadan)
 * - Ratings (3.8 – 5.0)
 * - Price ranges (₦2,000 – ₦200,000)
 * - Response times (30 min – 48 hrs)
 *
 * Run: npx tsx scripts/seed-artisans.ts
 */

import "./load-env.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ARTISANS = [
  // Lagos artisans
  {
    full_name: "Emeka Okonkwo",
    email: "emeka.okonkwo@eketsupply.test",
    phone: "+2348012345678",
    category: "Plumbing",
    skills: ["Pipe Repair", "Toilet Installation", "Drain Cleaning", "Water Heater"],
    hourly_rate: 8000,
    location: "Lagos Island, Lagos",
    state: "Lagos",
    bio: "Licensed plumber with 12 years experience serving Lagos Island and Victoria Island. Available for emergency callouts 24/7.",
    rating: 4.9,
    total_reviews: 87,
    latitude: 6.4541,
    longitude: 3.3947,
    avg_response_minutes: 45,
    verification_status: "approved",
    services: [
      { name: "Pipe Repair", min_price: 5000, max_price: 20000, duration_hours: 2 },
      { name: "Toilet Installation", min_price: 8000, max_price: 25000, duration_hours: 3 },
      { name: "Drain Cleaning", min_price: 3000, max_price: 12000, duration_hours: 1 },
      { name: "Water Heater Installation", min_price: 15000, max_price: 40000, duration_hours: 4 },
    ],
  },
  {
    full_name: "Fatima Bello",
    email: "fatima.bello@eketsupply.test",
    phone: "+2348023456789",
    category: "Electrical",
    skills: ["Wiring", "Solar Installation", "Generator Repair", "CCTV"],
    hourly_rate: 12000,
    location: "Lekki Phase 1, Lagos",
    state: "Lagos",
    bio: "Certified electrical engineer specialising in solar energy systems and smart home installations. Serving Lekki, Ajah, and Sangotedo.",
    rating: 4.8,
    total_reviews: 63,
    latitude: 6.4698,
    longitude: 3.5852,
    avg_response_minutes: 60,
    verification_status: "approved",
    services: [
      { name: "Wiring Installation", min_price: 50000, max_price: 200000, duration_hours: 8 },
      { name: "Solar Panel Setup", min_price: 150000, max_price: 500000, duration_hours: 16 },
      { name: "Generator Repair", min_price: 10000, max_price: 50000, duration_hours: 4 },
      { name: "CCTV Installation", min_price: 40000, max_price: 120000, duration_hours: 6 },
    ],
  },
  {
    full_name: "Biodun Adeyemi",
    email: "biodun.adeyemi@eketsupply.test",
    phone: "+2348034567890",
    category: "Painting",
    skills: ["Interior Painting", "Exterior Painting", "Texture Coating", "Wallpaper"],
    hourly_rate: 6000,
    location: "Surulere, Lagos",
    state: "Lagos",
    bio: "Professional painter with expertise in modern texture finishes and epoxy floor coatings. Serving mainland Lagos for 8 years.",
    rating: 4.7,
    total_reviews: 112,
    latitude: 6.4969,
    longitude: 3.3564,
    avg_response_minutes: 90,
    verification_status: "approved",
    services: [
      { name: "Interior Painting (per room)", min_price: 15000, max_price: 45000, duration_hours: 6 },
      { name: "Exterior Painting", min_price: 80000, max_price: 250000, duration_hours: 24 },
      { name: "Texture Coating", min_price: 20000, max_price: 80000, duration_hours: 8 },
      { name: "Wallpaper Installation", min_price: 25000, max_price: 70000, duration_hours: 4 },
    ],
  },
  // Abuja artisans
  {
    full_name: "Usman Garba",
    email: "usman.garba@eketsupply.test",
    phone: "+2348045678901",
    category: "AC Repair",
    skills: ["AC Installation", "AC Servicing", "Refrigerator Repair", "Inverter AC"],
    hourly_rate: 10000,
    location: "Wuse 2, Abuja",
    state: "FCT Abuja",
    bio: "Certified HVAC technician with 10 years experience. Authorised service partner for LG, Samsung, and Daikin in Abuja.",
    rating: 4.9,
    total_reviews: 201,
    latitude: 9.0765,
    longitude: 7.3986,
    avg_response_minutes: 30,
    verification_status: "approved",
    services: [
      { name: "AC Installation (split unit)", min_price: 20000, max_price: 50000, duration_hours: 4 },
      { name: "AC Servicing & Gas Refill", min_price: 8000, max_price: 18000, duration_hours: 2 },
      { name: "Refrigerator Repair", min_price: 5000, max_price: 30000, duration_hours: 3 },
      { name: "Inverter AC Installation", min_price: 35000, max_price: 80000, duration_hours: 6 },
    ],
  },
  {
    full_name: "Ngozi Eze",
    email: "ngozi.eze@eketsupply.test",
    phone: "+2348056789012",
    category: "Carpentry",
    skills: ["Custom Furniture", "Kitchen Cabinets", "Door Frames", "Wardrobes"],
    hourly_rate: 9000,
    location: "Garki, Abuja",
    state: "FCT Abuja",
    bio: "Master carpenter specialising in custom hardwood furniture and fitted kitchens. 15 years experience, workshop in Garki.",
    rating: 4.8,
    total_reviews: 78,
    latitude: 9.0579,
    longitude: 7.4951,
    avg_response_minutes: 120,
    verification_status: "approved",
    services: [
      { name: "Custom Wardrobe", min_price: 80000, max_price: 300000, duration_hours: 24 },
      { name: "Kitchen Cabinet Set", min_price: 150000, max_price: 500000, duration_hours: 40 },
      { name: "Door Frame Installation", min_price: 15000, max_price: 40000, duration_hours: 4 },
      { name: "Custom Furniture", min_price: 50000, max_price: 250000, duration_hours: 16 },
    ],
  },
  {
    full_name: "Abdullahi Musa",
    email: "abdullahi.musa@eketsupply.test",
    phone: "+2348067890123",
    category: "Tiling",
    skills: ["Floor Tiling", "Wall Tiling", "Bathroom Tiling", "Epoxy Grouting"],
    hourly_rate: 7500,
    location: "Maitama, Abuja",
    state: "FCT Abuja",
    bio: "Precision tiler with experience in large-format porcelain and marble installations. Serving Maitama, Asokoro, and Gwarinpa.",
    rating: 4.6,
    total_reviews: 55,
    latitude: 9.0810,
    longitude: 7.4836,
    avg_response_minutes: 180,
    verification_status: "approved",
    services: [
      { name: "Floor Tiling (per sqm)", min_price: 2500, max_price: 6000, duration_hours: 1 },
      { name: "Bathroom Complete Tiling", min_price: 60000, max_price: 180000, duration_hours: 16 },
      { name: "Wall Tiling (per sqm)", min_price: 2000, max_price: 5000, duration_hours: 1 },
      { name: "Epoxy Grouting", min_price: 15000, max_price: 40000, duration_hours: 4 },
    ],
  },
  // Port Harcourt artisans
  {
    full_name: "Chisom Nwosu",
    email: "chisom.nwosu@eketsupply.test",
    phone: "+2348078901234",
    category: "Electrical",
    skills: ["Industrial Wiring", "Panel Boards", "Street Lighting", "Generator Installation"],
    hourly_rate: 15000,
    location: "GRA Phase 2, Port Harcourt",
    state: "Rivers",
    bio: "Industrial electrician with oil & gas sector experience. Specialises in high-capacity generator installations and panel board upgrades.",
    rating: 4.7,
    total_reviews: 44,
    latitude: 4.8156,
    longitude: 7.0498,
    avg_response_minutes: 60,
    verification_status: "approved",
    services: [
      { name: "Generator Installation (20KVA+)", min_price: 80000, max_price: 300000, duration_hours: 12 },
      { name: "Panel Board Upgrade", min_price: 40000, max_price: 120000, duration_hours: 8 },
      { name: "Industrial Wiring", min_price: 100000, max_price: 400000, duration_hours: 24 },
      { name: "Street Light Installation", min_price: 25000, max_price: 80000, duration_hours: 6 },
    ],
  },
  {
    full_name: "Precious Obi",
    email: "precious.obi@eketsupply.test",
    phone: "+2348089012345",
    category: "Plumbing",
    skills: ["Borehole Drilling", "Water Treatment", "Overhead Tank", "Pumping Machine"],
    hourly_rate: 11000,
    location: "Trans Amadi, Port Harcourt",
    state: "Rivers",
    bio: "Water supply specialist with 9 years experience in borehole drilling and water treatment systems for residential and commercial properties.",
    rating: 4.5,
    total_reviews: 38,
    latitude: 4.8242,
    longitude: 7.0303,
    avg_response_minutes: 240,
    verification_status: "approved",
    services: [
      { name: "Borehole Drilling", min_price: 200000, max_price: 600000, duration_hours: 48 },
      { name: "Overhead Tank Installation", min_price: 30000, max_price: 80000, duration_hours: 8 },
      { name: "Pumping Machine Repair", min_price: 8000, max_price: 35000, duration_hours: 3 },
      { name: "Water Treatment System", min_price: 50000, max_price: 150000, duration_hours: 12 },
    ],
  },
  // Enugu artisans
  {
    full_name: "Ikenna Okafor",
    email: "ikenna.okafor@eketsupply.test",
    phone: "+2348090123456",
    category: "Welding",
    skills: ["Gate Fabrication", "Burglary Proof", "Steel Roofing", "Railings"],
    hourly_rate: 8500,
    location: "Independence Layout, Enugu",
    state: "Enugu",
    bio: "Structural welder and fabricator specialising in security gates, burglary-proof windows, and steel roofing. 14 years experience.",
    rating: 4.8,
    total_reviews: 92,
    latitude: 6.4527,
    longitude: 7.5248,
    avg_response_minutes: 120,
    verification_status: "approved",
    services: [
      { name: "Security Gate Fabrication", min_price: 60000, max_price: 200000, duration_hours: 24 },
      { name: "Burglary Proof Windows", min_price: 15000, max_price: 50000, duration_hours: 8 },
      { name: "Steel Roofing", min_price: 100000, max_price: 400000, duration_hours: 40 },
      { name: "Staircase Railing", min_price: 40000, max_price: 120000, duration_hours: 16 },
    ],
  },
  {
    full_name: "Ada Ugwu",
    email: "ada.ugwu@eketsupply.test",
    phone: "+2348001234567",
    category: "Interior Design",
    skills: ["Space Planning", "Furniture Sourcing", "Colour Consultation", "3D Rendering"],
    hourly_rate: 20000,
    location: "GRA, Enugu",
    state: "Enugu",
    bio: "Certified interior designer with a portfolio of over 50 residential projects. Specialises in contemporary Nigerian aesthetics blending local materials with modern design.",
    rating: 5.0,
    total_reviews: 29,
    latitude: 6.4698,
    longitude: 7.5341,
    avg_response_minutes: 360,
    verification_status: "approved",
    services: [
      { name: "Full Room Design Consultation", min_price: 50000, max_price: 150000, duration_hours: 8 },
      { name: "3D Rendering (per room)", min_price: 30000, max_price: 80000, duration_hours: 6 },
      { name: "Furniture Sourcing & Procurement", min_price: 20000, max_price: 60000, duration_hours: 4 },
      { name: "Colour Consultation", min_price: 10000, max_price: 25000, duration_hours: 2 },
    ],
  },
  // Kano artisans
  {
    full_name: "Suleiman Ibrahim",
    email: "suleiman.ibrahim@eketsupply.test",
    phone: "+2348011234567",
    category: "Masonry",
    skills: ["Block Laying", "Plastering", "Screeding", "Paving"],
    hourly_rate: 6500,
    location: "Nassarawa GRA, Kano",
    state: "Kano",
    bio: "Experienced mason and construction contractor. Handles new builds, extensions, and renovation projects across Kano metropolis.",
    rating: 4.4,
    total_reviews: 67,
    latitude: 12.0022,
    longitude: 8.5920,
    avg_response_minutes: 180,
    verification_status: "approved",
    services: [
      { name: "Block Laying (per sqm)", min_price: 1500, max_price: 3500, duration_hours: 1 },
      { name: "Plastering (per sqm)", min_price: 1200, max_price: 2800, duration_hours: 1 },
      { name: "Concrete Screeding", min_price: 20000, max_price: 60000, duration_hours: 8 },
      { name: "Paving & Interlocking", min_price: 3000, max_price: 7000, duration_hours: 1 },
    ],
  },
  {
    full_name: "Hauwa Yusuf",
    email: "hauwa.yusuf@eketsupply.test",
    phone: "+2348022345678",
    category: "Cleaning",
    skills: ["Deep Cleaning", "Post-Construction Cleaning", "Carpet Cleaning", "Fumigation"],
    hourly_rate: 4000,
    location: "Sabon Gari, Kano",
    state: "Kano",
    bio: "Professional cleaning service provider with a team of 6 trained staff. Specialises in post-construction and deep cleaning for offices and homes.",
    rating: 4.6,
    total_reviews: 143,
    latitude: 12.0055,
    longitude: 8.5170,
    avg_response_minutes: 90,
    verification_status: "approved",
    services: [
      { name: "Deep House Cleaning", min_price: 15000, max_price: 50000, duration_hours: 6 },
      { name: "Post-Construction Cleaning", min_price: 30000, max_price: 100000, duration_hours: 12 },
      { name: "Carpet & Rug Cleaning", min_price: 5000, max_price: 20000, duration_hours: 3 },
      { name: "Fumigation & Pest Control", min_price: 10000, max_price: 35000, duration_hours: 2 },
    ],
  },
  // Ibadan artisans
  {
    full_name: "Rotimi Afolabi",
    email: "rotimi.afolabi@eketsupply.test",
    phone: "+2348033456789",
    category: "Roofing",
    skills: ["Roof Repair", "Roof Replacement", "Waterproofing", "Gutters"],
    hourly_rate: 9500,
    location: "Bodija, Ibadan",
    state: "Oyo",
    bio: "Roofing specialist with 11 years experience in all types of roofing systems — corrugated iron, long span, stone-coated steel, and flat roof waterproofing.",
    rating: 4.7,
    total_reviews: 58,
    latitude: 7.4198,
    longitude: 3.9070,
    avg_response_minutes: 120,
    verification_status: "approved",
    services: [
      { name: "Roof Repair (per sqm)", min_price: 3000, max_price: 8000, duration_hours: 2 },
      { name: "Full Roof Replacement", min_price: 200000, max_price: 600000, duration_hours: 40 },
      { name: "Waterproofing & Coating", min_price: 40000, max_price: 120000, duration_hours: 8 },
      { name: "Gutter Installation", min_price: 15000, max_price: 45000, duration_hours: 4 },
    ],
  },
  {
    full_name: "Yetunde Olawale",
    email: "yetunde.olawale@eketsupply.test",
    phone: "+2348044567890",
    category: "Carpentry",
    skills: ["POP Ceiling", "Gypsum Board", "Cornice", "Suspended Ceiling"],
    hourly_rate: 7000,
    location: "Ring Road, Ibadan",
    state: "Oyo",
    bio: "POP and gypsum ceiling specialist. Creates stunning ceiling designs for homes, offices, and event centres. Serving Ibadan for 7 years.",
    rating: 4.5,
    total_reviews: 84,
    latitude: 7.3775,
    longitude: 3.9470,
    avg_response_minutes: 150,
    verification_status: "approved",
    services: [
      { name: "POP Ceiling (per sqm)", min_price: 2500, max_price: 6000, duration_hours: 1 },
      { name: "Gypsum Board Ceiling", min_price: 3000, max_price: 7000, duration_hours: 1 },
      { name: "Cornice Installation", min_price: 1500, max_price: 4000, duration_hours: 1 },
      { name: "Suspended Ceiling (per sqm)", min_price: 4000, max_price: 10000, duration_hours: 1 },
    ],
  },
  {
    full_name: "Tunde Fashola",
    email: "tunde.fashola@eketsupply.test",
    phone: "+2348055678901",
    category: "Electrical",
    skills: ["Smart Home", "CCTV", "Access Control", "Intercom Systems"],
    hourly_rate: 14000,
    location: "Jericho, Ibadan",
    state: "Oyo",
    bio: "Smart home automation specialist. Installs Alexa-compatible lighting, CCTV, access control, and intercom systems. Serving Ibadan's high-end residential market.",
    rating: 3.8,
    total_reviews: 22,
    latitude: 7.4012,
    longitude: 3.9167,
    avg_response_minutes: 480,
    verification_status: "approved",
    services: [
      { name: "Smart Lighting System", min_price: 80000, max_price: 250000, duration_hours: 12 },
      { name: "CCTV (4 cameras)", min_price: 60000, max_price: 150000, duration_hours: 8 },
      { name: "Access Control System", min_price: 40000, max_price: 120000, duration_hours: 6 },
      { name: "Intercom Installation", min_price: 25000, max_price: 70000, duration_hours: 4 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertProfile(artisan: (typeof ARTISANS)[0]) {
  // Use a deterministic UUID based on email so re-runs are idempotent
  // The profiles table requires a user_id (FK to auth.users) but for seed data
  // we use a synthetic UUID derived from the email.
  const syntheticUserId = await deterministicUuid(artisan.email);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: syntheticUserId,
        full_name: artisan.full_name,
        email: artisan.email,
        phone: artisan.phone,
        user_type: "artisan",
        location: artisan.location,
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Profile upsert failed for ${artisan.full_name}: ${error.message}`);
  return data.id as string;
}

// Simple deterministic UUID v5-like from a string (no crypto dependency needed)
async function deterministicUuid(input: string): Promise<string> {
  // Use a namespace prefix + hash of the input string
  const encoder = new TextEncoder();
  const data = encoder.encode(`eketsupply-seed:${input}`);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Format as UUID v5 (variant bits set)
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '5' + hex.slice(13, 16), // version 5
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hex.slice(18, 20), // variant
    hex.slice(20, 32),
  ].join('-');
}

async function upsertArtisan(profileId: string, artisan: (typeof ARTISANS)[0]) {
  // Check if artisan already exists for this profile
  const { data: existing } = await supabase
    .from("artisans")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const responseTime = artisan.avg_response_minutes <= 60
    ? `${artisan.avg_response_minutes} minutes`
    : `${Math.round(artisan.avg_response_minutes / 60)} hours`;

  const { data, error } = await supabase
    .from("artisans")
    .insert({
      profile_id: profileId,
      business_name: artisan.full_name,
      service_category: artisan.category,
      bio: artisan.bio,
      rating: artisan.rating,
      total_reviews: artisan.total_reviews,
      location: artisan.location,
      verified: artisan.verification_status === "approved",
      response_time: responseTime,
      availability: "Available",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Artisan insert failed for ${artisan.full_name}: ${error.message}`);
  return data.id as string;
}

async function upsertServices(artisanId: string, artisan: (typeof ARTISANS)[0]) {
  for (const service of artisan.services) {
    // Services table uses: artisan_id, name, description, price (TEXT), duration (TEXT)
    const priceText = `₦${service.min_price.toLocaleString()} – ₦${service.max_price.toLocaleString()}`;
    const durationText = service.duration_hours < 1
      ? `${service.duration_hours * 60} minutes`
      : service.duration_hours === 1
      ? `1 hour`
      : `${service.duration_hours} hours`;

    // Try insert first; if conflict on name+artisan_id, skip (no upsert constraint available)
    const { error } = await supabase.from("services").insert({
      artisan_id: artisanId,
      name: service.name,
      description: `${artisan.category} service by ${artisan.full_name}`,
      price: priceText,
      duration: durationText,
    });
    if (error && !error.message.includes('duplicate')) {
      console.warn(`  ⚠ Service insert warning for "${service.name}": ${error.message}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding 15 realistic Nigerian artisans...\n");

  let succeeded = 0;
  let failed = 0;

  for (const artisan of ARTISANS) {
    try {
      process.stdout.write(`  → ${artisan.full_name} (${artisan.category}, ${artisan.state})... `);
      const profileId = await upsertProfile(artisan);
      const artisanId = await upsertArtisan(profileId, artisan);
      await upsertServices(artisanId, artisan);
      console.log(`✅`);
      succeeded++;
    } catch (err) {
      console.log(`❌ ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n✅ Seeding complete: ${succeeded} succeeded, ${failed} failed.`);

  if (succeeded > 0) {
    // Verify the count
    const { count } = await supabase
      .from("artisans")
      .select("*", { count: "exact", head: true });
    console.log(`📊 Total artisans in database: ${count}`);
  }
}

main().catch(console.error);
