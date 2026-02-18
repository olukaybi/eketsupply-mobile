import { describe, it, expect } from 'vitest';

describe('Supabase Configuration', () => {
  it('should have Supabase URL environment variable', () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toContain('supabase');
  });

  it('should have Supabase anon key environment variable', () => {
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(supabaseKey).toBeDefined();
    expect(supabaseKey).not.toBe('your-anon-key');
    expect(supabaseKey!.length).toBeGreaterThan(20);
  });
});
