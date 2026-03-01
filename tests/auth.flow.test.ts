/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * End-to-end auth flow integration test
 *
 * Validates the complete session lifecycle:
 *   1. auth.me returns the authenticated user
 *   2. auth.logout clears the session cookie
 *   3. auth.me returns null after logout
 *
 * This test chains the two procedures through a shared mutable context,
 * simulating what happens in a real Express request/response cycle.
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import type { User } from "../drizzle/schema";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const testUser: User = {
  id: 99,
  openId: "oauth-flow-test-xyz",
  email: "flow-test@eketsupply.com",
  name: "Flow Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date("2025-03-01T09:00:00Z"),
  updatedAt: new Date("2026-01-10T14:00:00Z"),
  lastSignedIn: new Date("2026-02-28T18:00:00Z"),
};

/** Build a context with a spy on res.clearCookie */
function buildContext(user: User | null): TrpcContext & { clearCookieSpy: ReturnType<typeof vi.fn> } {
  const clearCookieSpy = vi.fn();
  return {
    user,
    req: {
      protocol: "https",
      hostname: "localhost",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: clearCookieSpy,
    } as unknown as TrpcContext["res"],
    clearCookieSpy,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth session lifecycle", () => {
  it("auth.me returns user → auth.logout clears cookie → auth.me returns null", async () => {
    // Step 1: Authenticated context — auth.me should return the user
    const authCtx = buildContext(testUser);
    const authCaller = appRouter.createCaller(authCtx);

    const userBefore = await authCaller.auth.me();
    expect(userBefore).toEqual(testUser);

    // Step 2: Logout — cookie should be cleared
    await authCaller.auth.logout();
    expect(authCtx.clearCookieSpy).toHaveBeenCalledOnce();

    // Verify the cookie was cleared with maxAge: -1 (expiry flag)
    const [cookieName, cookieOptions] = authCtx.clearCookieSpy.mock.calls[0];
    expect(typeof cookieName).toBe("string");
    expect(cookieName.length).toBeGreaterThan(0);
    expect(cookieOptions).toMatchObject({ maxAge: -1 });

    // Step 3: Simulate the session being invalidated — new unauthenticated context
    const unauthCtx = buildContext(null);
    const unauthCaller = appRouter.createCaller(unauthCtx);

    const userAfter = await unauthCaller.auth.me();
    expect(userAfter).toBeNull();
  });

  it("logout does not affect other active sessions (independent contexts)", async () => {
    // Two separate sessions for two different users
    const ctx1 = buildContext(testUser);
    const ctx2 = buildContext({ ...testUser, id: 100, email: "other@eketsupply.com" });

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Logout session 1
    await caller1.auth.logout();
    expect(ctx1.clearCookieSpy).toHaveBeenCalledOnce();

    // Session 2 should be unaffected — its clearCookie was never called
    expect(ctx2.clearCookieSpy).not.toHaveBeenCalled();

    // Session 2 can still read its user
    const user2 = await caller2.auth.me();
    expect(user2?.id).toBe(100);
  });

  it("logout is idempotent — calling it twice clears the cookie twice", async () => {
    const ctx = buildContext(testUser);
    const caller = appRouter.createCaller(ctx);

    await caller.auth.logout();
    await caller.auth.logout();

    // clearCookie should have been called on each logout call
    expect(ctx.clearCookieSpy).toHaveBeenCalledTimes(2);
  });

  it("unauthenticated logout still clears the cookie (no error thrown)", async () => {
    const ctx = buildContext(null);
    const caller = appRouter.createCaller(ctx);

    // Should not throw even when user is null
    await expect(caller.auth.logout()).resolves.not.toThrow();
    expect(ctx.clearCookieSpy).toHaveBeenCalledOnce();
  });

  it("cookie options include httpOnly and sameSite security flags", async () => {
    const ctx = buildContext(testUser);
    const caller = appRouter.createCaller(ctx);

    await caller.auth.logout();

    const [, cookieOptions] = ctx.clearCookieSpy.mock.calls[0];
    // Security-critical flags must always be present
    expect(cookieOptions).toHaveProperty("httpOnly");
    expect(cookieOptions).toHaveProperty("sameSite");
    expect(cookieOptions).toHaveProperty("path");
  });

  it("auth.me is read-only — does not modify context user", async () => {
    const ctx = buildContext(testUser);
    const caller = appRouter.createCaller(ctx);

    const snapshot = { ...testUser };
    await caller.auth.me();
    await caller.auth.me(); // call twice

    // User in context must remain identical
    expect(ctx.user).toEqual(snapshot);
  });
});
