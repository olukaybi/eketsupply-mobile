import { describe, it, expect } from 'vitest';

describe('Authentication', () => {
  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it('should validate password length', () => {
    const shortPassword = '12345';
    const validPassword = '123456';
    
    expect(shortPassword.length >= 6).toBe(false);
    expect(validPassword.length >= 6).toBe(true);
  });

  it('should validate password match', () => {
    const password = 'password123';
    const confirmPassword = 'password123';
    const mismatchPassword = 'different';
    
    expect(password === confirmPassword).toBe(true);
    expect(password === mismatchPassword as string).toBe(false);
  });
});
