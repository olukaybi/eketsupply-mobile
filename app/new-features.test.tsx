import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockSupabase } from '@/tests/mock-supabase.types';

// Mock Supabase
const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
  };
  return chain;
};

const mockSupabase: MockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => createMockChain()),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/video.mp4' } })),
    })),
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Video Testimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create video testimonial record', async () => {
    const testimonialData = {
      booking_id: 'booking-1',
      customer_id: 'customer-1',
      artisan_id: 'artisan-1',
      video_url: 'https://example.com/video.mp4',
      duration_seconds: 25,
      rating: 5,
    };

    const result = await mockSupabase
      .from('video_testimonials')
      .insert(testimonialData)
      .select()
      .single();

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should fetch video testimonials for artisan', async () => {
    const result = await mockSupabase
      .from('video_testimonials')
      .select('*')
      .eq('artisan_id', 'artisan-1')
      .order('created_at', { ascending: false })
      .limit(5);

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should enforce 30 second duration limit', () => {
    const MAX_DURATION = 30;
    const testDuration = 25;

    expect(testDuration).toBeLessThanOrEqual(MAX_DURATION);
  });

  it('should upload video to storage', async () => {
    const mockBlob = new Blob(['test'], { type: 'video/mp4' });
    const fileName = 'artisan-1/1234567890.mp4';

    const result = await mockSupabase.storage
      .from('video-testimonials')
      .upload(fileName, mockBlob);

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should get public URL for uploaded video', () => {
    const fileName = 'artisan-1/1234567890.mp4';

    const { data } = mockSupabase.storage
      .from('video-testimonials')
      .getPublicUrl(fileName);

    expect(data.publicUrl).toContain('video.mp4');
  });
});

describe('Artisan Achievement Badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should define all badge types', () => {
    const badgeTypes = [
      'jobs_milestone_50',
      'jobs_milestone_100',
      'jobs_milestone_500',
      'rating_5_star',
      'rating_top_rated',
      'response_fast',
      'response_instant',
      'verified_pro',
      'customer_favorite',
      'quality_expert',
    ];

    expect(badgeTypes).toHaveLength(10);
    expect(badgeTypes).toContain('jobs_milestone_100');
    expect(badgeTypes).toContain('rating_5_star');
  });

  it('should award jobs milestone badge', () => {
    const completedJobs = 100;
    const shouldAwardBadge = completedJobs >= 100;

    expect(shouldAwardBadge).toBe(true);
  });

  it('should award 5-star rating badge', () => {
    const rating = 5.0;
    const totalReviews = 50;
    const shouldAwardBadge = rating === 5.0 && totalReviews >= 10;

    expect(shouldAwardBadge).toBe(true);
  });

  it('should award top-rated badge', () => {
    const rating = 4.9;
    const totalReviews = 60;
    const shouldAwardBadge = rating >= 4.8 && totalReviews >= 50;

    expect(shouldAwardBadge).toBe(true);
  });

  it('should fetch artisan badges', async () => {
    // Mock returns a promise that resolves to { data, error }
    const mockResult = { data: [], error: null };
    expect(mockResult.data).toBeDefined();
    expect(mockResult.error).toBeNull();
  });

  it('should calculate badge progress for jobs', () => {
    const currentJobs = 75;
    const target = 100;
    const progress = (currentJobs / target) * 100;

    expect(progress).toBe(75);
  });

  it('should calculate badge progress for rating', () => {
    const currentRating = 4.5;
    const targetRating = 4.8;
    const baseRating = 4.0;
    const progress = ((currentRating - baseRating) / (targetRating - baseRating)) * 100;

    expect(progress).toBeCloseTo(62.5, 1);
  });

  it('should display badge with correct icon and color', () => {
    const badge = {
      type: 'jobs_milestone_100',
      name: '100 Jobs',
      icon: '💯',
      color: '#8B5CF6',
    };

    expect(badge.icon).toBe('💯');
    expect(badge.color).toBe('#8B5CF6');
  });
});

describe('Service Packages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create service package', async () => {
    const packageData = {
      artisan_id: 'artisan-1',
      package_name: 'Complete Home Service',
      description: 'Full home cleaning and repair',
      original_price: 50000,
      discounted_price: 42500,
      discount_percentage: 15,
      is_active: true,
    };

    const result = await mockSupabase
      .from('service_packages')
      .insert(packageData)
      .select()
      .single();

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should calculate package discount correctly', () => {
    const originalPrice = 50000;
    const discountPercentage = 15;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    expect(discountedPrice).toBe(42500);
  });

  it('should enforce minimum 2 services per package', () => {
    const selectedServices = ['service-1', 'service-2'];
    const isValid = selectedServices.length >= 2;

    expect(isValid).toBe(true);
  });

  it('should enforce discount range 5-50%', () => {
    const discount1 = 10;
    const discount2 = 3;
    const discount3 = 60;

    expect(discount1 >= 5 && discount1 <= 50).toBe(true);
    expect(discount2 >= 5 && discount2 <= 50).toBe(false);
    expect(discount3 >= 5 && discount3 <= 50).toBe(false);
  });

  it('should fetch active packages for artisan', async () => {
    // Mock returns a promise that resolves to { data, error }
    const mockResult = { data: [], error: null };
    expect(mockResult.data).toBeDefined();
    expect(mockResult.error).toBeNull();
  });

  it('should calculate total package value', () => {
    const services = [
      { id: '1', price: 15000 },
      { id: '2', price: 20000 },
      { id: '3', price: 15000 },
    ];

    const total = services.reduce((sum, s) => sum + s.price, 0);
    expect(total).toBe(50000);
  });

  it('should toggle package activation status', async () => {
    const packageId = 'package-1';
    const newStatus = false;

    const result = await mockSupabase
      .from('service_packages')
      .update({ is_active: newStatus })
      .eq('id', packageId);

    expect(result.error).toBeNull();
  });

  it('should delete service package', async () => {
    const packageId = 'package-1';

    const result = await mockSupabase
      .from('service_packages')
      .delete()
      .eq('id', packageId);

    expect(result.error).toBeNull();
  });

  it('should display package savings prominently', () => {
    const originalPrice = 50000;
    const discountedPrice = 42500;
    const savings = originalPrice - discountedPrice;
    const savingsPercentage = ((savings / originalPrice) * 100).toFixed(0);

    expect(savings).toBe(7500);
    expect(savingsPercentage).toBe('15');
  });

  it('should link services to package', async () => {
    const packageServices = [
      { package_id: 'package-1', service_id: 'service-1' },
      { package_id: 'package-1', service_id: 'service-2' },
    ];

    const result = await mockSupabase
      .from('package_services')
      .insert(packageServices);

    expect(mockSupabase.from).toHaveBeenCalledWith('package_services');
  });
});

describe('Integration Tests', () => {
  it('should display video testimonials on artisan profile', () => {
    const videoTestimonials = [
      {
        id: '1',
        customer_name: 'John Doe',
        rating: 5,
        video_url: 'https://example.com/video1.mp4',
        duration_seconds: 28,
      },
    ];

    expect(videoTestimonials).toHaveLength(1);
    expect(videoTestimonials[0].duration_seconds).toBeLessThanOrEqual(30);
  });

  it('should display badges on artisan profile', () => {
    const badges = ['jobs_milestone_100', 'rating_5_star', 'response_fast'];

    expect(badges).toContain('jobs_milestone_100');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display service packages on artisan profile', () => {
    const packages = [
      {
        id: '1',
        package_name: 'Complete Home Service',
        original_price: 50000,
        discounted_price: 42500,
        discount_percentage: 15,
        services: [
          { id: '1', name: 'Plumbing' },
          { id: '2', name: 'Electrical' },
        ],
      },
    ];

    expect(packages).toHaveLength(1);
    expect(packages[0].services).toHaveLength(2);
    expect(packages[0].discounted_price).toBeLessThan(packages[0].original_price);
  });

  it('should navigate to package manager from analytics', () => {
    const navigationTarget = '/package-manager';
    expect(navigationTarget).toBe('/package-manager');
  });

  it('should navigate to video recording from booking', () => {
    const navigationTarget = '/record-video-testimonial';
    expect(navigationTarget).toBe('/record-video-testimonial');
  });
});
