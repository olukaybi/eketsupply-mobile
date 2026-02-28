import { describe, it, expect } from 'vitest';

describe('Supabase Configuration', () => {
  it('should have a valid Supabase URL', () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it('should have a valid Supabase anon key (JWT format)', () => {
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(supabaseKey).toBeDefined();
    // JWT tokens have 3 parts separated by dots
    const parts = supabaseKey!.split('.');
    expect(parts.length).toBe(3);
    expect(supabaseKey!.startsWith('eyJ')).toBe(true);
  });

  it('should be able to reach Supabase REST API', async () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    expect(response.status).toBe(200);
  }, 10000);
});
