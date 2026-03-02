import { describe, it, expect } from "vitest";

describe("Paystack API Key Validation", () => {
  it("EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY is set and has correct format", () => {
    const key = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
    expect(key, "EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY must be set").toBeTruthy();
    expect(key).toMatch(/^pk_(test|live)_/);
  });

  it("EXPO_PUBLIC_PAYSTACK_SECRET_KEY is set and has correct format", () => {
    const key = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY;
    expect(key, "EXPO_PUBLIC_PAYSTACK_SECRET_KEY must be set").toBeTruthy();
    expect(key).toMatch(/^sk_(test|live)_/);
  });

  it("Paystack secret key authenticates successfully against the live API", async () => {
    const key = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY;
    const res = await fetch("https://api.paystack.co/transaction?perPage=1", {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json() as { status: boolean; message: string };
    expect(res.status).toBe(200);
    expect(data.status).toBe(true);
    expect(data.message).toContain("Transactions retrieved");
  });
});
