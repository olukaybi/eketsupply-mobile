import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('Supabase Connection', () => {
  it('should have valid Supabase configuration', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should be able to connect to Supabase', async () => {
    // Test connection by checking auth status
    const { data, error } = await supabase.auth.getSession();
    
    // Should not throw an error (even if no session exists)
    expect(error).toBeNull();
    expect(data).toBeDefined();
  }, 10000); // 10 second timeout for network request
});
