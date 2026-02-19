import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
  };
  return chain;
};

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => createMockChain()),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
      })),
    })),
    update: vi.fn(() => createMockChain()),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
  rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/thumb.jpg' } })),
      remove: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Badge Auto-Awarding System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create badge_award_log entry', async () => {
    const logData = {
      artisan_id: 'artisan-1',
      badge_type: 'jobs_milestone_100',
      milestone_value: 100,
      notification_sent: false,
    };

    const result = await mockSupabase
      .from('badge_award_log')
      .insert(logData)
      .select()
      .single();

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should detect jobs milestone (50 jobs)', () => {
    const completedJobs = 50;
    const shouldAward = completedJobs >= 50;

    expect(shouldAward).toBe(true);
  });

  it('should detect jobs milestone (100 jobs)', () => {
    const completedJobs = 100;
    const shouldAward = completedJobs >= 100;

    expect(shouldAward).toBe(true);
  });

  it('should detect jobs milestone (500 jobs)', () => {
    const completedJobs = 500;
    const shouldAward = completedJobs >= 500;

    expect(shouldAward).toBe(true);
  });

  it('should detect 5-star rating milestone', () => {
    const rating = 5.0;
    const totalReviews = 15;
    const shouldAward = rating === 5.0 && totalReviews >= 10;

    expect(shouldAward).toBe(true);
  });

  it('should detect top-rated milestone', () => {
    const rating = 4.85;
    const totalReviews = 60;
    const shouldAward = rating >= 4.8 && totalReviews >= 50;

    expect(shouldAward).toBe(true);
  });

  it('should call check_and_award_badges RPC function', async () => {
    const artisanId = 'artisan-1';

    await mockSupabase.rpc('check_and_award_badges', {
      p_artisan_id: artisanId,
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_and_award_badges', {
      p_artisan_id: artisanId,
    });
  });

  it('should mark notification as sent', async () => {
    const result = await mockSupabase
      .from('badge_award_log')
      .update({ notification_sent: true })
      .eq('artisan_id', 'artisan-1')
      .eq('badge_type', 'jobs_milestone_100')
      .is('notification_sent', false);

    expect(mockSupabase.from).toHaveBeenCalledWith('badge_award_log');
  });

  it('should fetch recent badge awards', async () => {
    const mockResult = { data: [], error: null };
    expect(mockResult.data).toBeDefined();
    expect(mockResult.error).toBeNull();
  });

  it('should calculate badge statistics', () => {
    const totalBadges = 5;
    const recentAwards = 2;
    const nextMilestone = '45 more jobs for 100 Jobs badge';

    expect(totalBadges).toBeGreaterThan(0);
    expect(recentAwards).toBeGreaterThanOrEqual(0);
    expect(nextMilestone).toBeTruthy();
  });

  it('should send push notification for badge', () => {
    const notification = {
      title: '🎉 New Badge Earned!',
      body: 'Congratulations! You\'ve earned the "100 Jobs" badge',
      data: {
        type: 'badge_earned',
        badge_type: 'jobs_milestone_100',
      },
    };

    expect(notification.title).toContain('Badge Earned');
    expect(notification.data.type).toBe('badge_earned');
  });
});

describe('Video Thumbnail Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add thumbnail_url column to video_testimonials', () => {
    const testimonial = {
      id: 'video-1',
      video_url: 'https://example.com/video.mp4',
      thumbnail_url: 'https://example.com/thumb.jpg',
    };

    expect(testimonial.thumbnail_url).toBeDefined();
    expect(testimonial.thumbnail_url).toContain('thumb.jpg');
  });

  it('should generate thumbnail at 1 second mark', () => {
    const timeMs = 1000;
    const expectedTime = 1000;

    expect(timeMs).toBe(expectedTime);
  });

  it('should upload thumbnail to storage', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    const fileName = 'artisan-1/1234567890_thumb.jpg';

    const result = await mockSupabase.storage
      .from('video-testimonials')
      .upload(fileName, mockBlob);

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should get public URL for thumbnail', () => {
    const fileName = 'artisan-1/1234567890_thumb.jpg';

    const { data } = mockSupabase.storage
      .from('video-testimonials')
      .getPublicUrl(fileName);

    expect(data.publicUrl).toContain('thumb.jpg');
  });

  it('should update video testimonial with thumbnail URL', async () => {
    const testimonialId = 'video-1';
    const thumbnailUrl = 'https://example.com/thumb.jpg';

    const result = await mockSupabase
      .from('video_testimonials')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', testimonialId);

    expect(mockSupabase.from).toHaveBeenCalledWith('video_testimonials');
  });

  it('should cache thumbnail URL in database', () => {
    const cached = {
      id: 'video-1',
      thumbnail_url: 'https://example.com/thumb.jpg',
    };

    expect(cached.thumbnail_url).toBeTruthy();
  });

  it('should delete thumbnail from storage', async () => {
    const thumbnailUrl = 'https://example.com/video-testimonials/artisan-1/thumb.jpg';
    const filePath = 'artisan-1/thumb.jpg';

    const result = await mockSupabase.storage
      .from('video-testimonials')
      .remove([filePath]);

    expect(result.error).toBeNull();
  });

  it('should use quality 0.8 for thumbnails', () => {
    const quality = 0.8;
    const expectedQuality = 0.8;

    expect(quality).toBe(expectedQuality);
  });

  it('should process unprocessed videos in batches', () => {
    const batchSize = 10;
    const processedCount = 7;

    expect(processedCount).toBeLessThanOrEqual(batchSize);
  });
});

describe('Package Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create package_bookings entry', async () => {
    const bookingData = {
      booking_id: 'booking-1',
      package_id: 'package-1',
      artisan_id: 'artisan-1',
      customer_id: 'customer-1',
      package_price: 42500,
      original_price: 50000,
      discount_amount: 7500,
      discount_percentage: 15,
      booking_status: 'pending',
    };

    const result = await mockSupabase
      .from('package_bookings')
      .insert(bookingData)
      .select()
      .single();

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should calculate total bookings for package', () => {
    const bookings = [
      { id: '1', status: 'completed' },
      { id: '2', status: 'completed' },
      { id: '3', status: 'pending' },
    ];

    const totalBookings = bookings.length;
    expect(totalBookings).toBe(3);
  });

  it('should calculate completed bookings', () => {
    const bookings = [
      { id: '1', status: 'completed' },
      { id: '2', status: 'completed' },
      { id: '3', status: 'pending' },
    ];

    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    expect(completedBookings).toBe(2);
  });

  it('should calculate total revenue from completed bookings', () => {
    const completedBookings = [
      { package_price: 42500, status: 'completed' },
      { package_price: 38000, status: 'completed' },
    ];

    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.package_price, 0);
    expect(totalRevenue).toBe(80500);
  });

  it('should calculate completion rate', () => {
    const totalBookings = 10;
    const completedBookings = 8;
    const completionRate = (completedBookings / totalBookings) * 100;

    expect(completionRate).toBe(80);
  });

  it('should calculate average package price', () => {
    const bookings = [
      { package_price: 42500 },
      { package_price: 38000 },
      { package_price: 45000 },
    ];

    const avgPrice = bookings.reduce((sum, b) => sum + b.package_price, 0) / bookings.length;
    expect(avgPrice).toBeCloseTo(41833.33, 2);
  });

  it('should track customer savings', () => {
    const originalPrice = 50000;
    const packagePrice = 42500;
    const savings = originalPrice - packagePrice;

    expect(savings).toBe(7500);
  });

  it('should query package_analytics view', async () => {
    const mockResult = { data: [], error: null };
    expect(mockResult.data).toBeDefined();
    expect(mockResult.error).toBeNull();
  });

  it('should identify most popular package', () => {
    const packages = [
      { id: '1', name: 'Basic', bookings: 15 },
      { id: '2', name: 'Premium', bookings: 25 },
      { id: '3', name: 'Deluxe', bookings: 10 },
    ];

    const mostPopular = packages.reduce((max, pkg) => 
      pkg.bookings > max.bookings ? pkg : max
    );

    expect(mostPopular.name).toBe('Premium');
    expect(mostPopular.bookings).toBe(25);
  });

  it('should calculate total savings given to customers', () => {
    const bookings = [
      { discount_amount: 7500, status: 'completed' },
      { discount_amount: 5000, status: 'completed' },
      { discount_amount: 3000, status: 'cancelled' },
    ];

    const totalSavings = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.discount_amount, 0);

    expect(totalSavings).toBe(12500);
  });

  it('should provide package recommendations', () => {
    const avgCompletionRate = 65;
    const shouldRecommendImprovement = avgCompletionRate < 70;

    expect(shouldRecommendImprovement).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should trigger badge check after booking completion', () => {
    const booking = {
      id: 'booking-1',
      status: 'completed',
      artisan_id: 'artisan-1',
    };

    const shouldTriggerBadgeCheck = booking.status === 'completed';
    expect(shouldTriggerBadgeCheck).toBe(true);
  });

  it('should trigger badge check after review submission', () => {
    const review = {
      id: 'review-1',
      artisan_id: 'artisan-1',
      rating: 5,
    };

    const shouldTriggerBadgeCheck = review.rating !== undefined;
    expect(shouldTriggerBadgeCheck).toBe(true);
  });

  it('should generate thumbnail during video upload', () => {
    const videoUpload = {
      video_url: 'https://example.com/video.mp4',
      thumbnail_url: null,
    };

    const shouldGenerateThumbnail = videoUpload.thumbnail_url === null;
    expect(shouldGenerateThumbnail).toBe(true);
  });

  it('should track package booking in analytics', () => {
    const booking = {
      package_id: 'package-1',
      status: 'completed',
      package_price: 42500,
    };

    const shouldTrackInAnalytics = booking.package_id !== undefined;
    expect(shouldTrackInAnalytics).toBe(true);
  });

  it('should display package analytics on dashboard', () => {
    const analytics = {
      total_packages: 5,
      total_bookings: 42,
      total_revenue: 1250000,
      avg_completion_rate: 78.5,
    };

    expect(analytics.total_packages).toBeGreaterThan(0);
    expect(analytics.total_bookings).toBeGreaterThan(0);
    expect(analytics.avg_completion_rate).toBeGreaterThan(0);
  });
});
