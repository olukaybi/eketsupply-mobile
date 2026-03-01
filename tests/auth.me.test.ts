import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import type { User } from "../drizzle/schema";

// ─── Context helpers ──────────────────────────────────────────────────────────

/** Minimal Express-like req/res stubs — auth.me only reads ctx.user */
const stubReqRes = {
  req: {
    protocol: "https",
    hostname: "localhost",
    headers: {},
  } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

/** A fully-populated User row as returned by the database */
const authenticatedUser: User = {
  id: 42,
  openId: "oauth-open-id-abc123",
  email: "chidi@eketsupply.com",
  name: "Chidi Okonkwo",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date("2025-01-15T10:00:00Z"),
  updatedAt: new Date("2025-06-01T08:30:00Z"),
  lastSignedIn: new Date("2026-02-28T20:00:00Z"),
};

/** An admin variant to verify the role field is passed through unchanged */
const adminUser: User = {
  ...authenticatedUser,
  id: 1,
  email: "admin@eketsupply.com",
  name: "EketSupply Admin",
  role: "admin",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns the full user object when authenticated", async () => {
    const ctx: TrpcContext = { ...stubReqRes, user: authenticatedUser };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toEqual(authenticatedUser);
  });

  it("returns null when unauthenticated (no session)", async () => {
    const ctx: TrpcContext = { ...stubReqRes, user: null };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("preserves all User fields without modification", async () => {
    const ctx: TrpcContext = { ...stubReqRes, user: authenticatedUser };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    // Every field on the User type must be present and unchanged
    expect(result?.id).toBe(authenticatedUser.id);
    expect(result?.openId).toBe(authenticatedUser.openId);
    expect(result?.email).toBe(authenticatedUser.email);
    expect(result?.name).toBe(authenticatedUser.name);
    expect(result?.loginMethod).toBe(authenticatedUser.loginMethod);
    expect(result?.role).toBe(authenticatedUser.role);
    expect(result?.createdAt).toEqual(authenticatedUser.createdAt);
    expect(result?.updatedAt).toEqual(authenticatedUser.updatedAt);
    expect(result?.lastSignedIn).toEqual(authenticatedUser.lastSignedIn);
  });

  it("returns the correct role for an admin user", async () => {
    const ctx: TrpcContext = { ...stubReqRes, user: adminUser };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result?.role).toBe("admin");
    expect(result?.id).toBe(adminUser.id);
  });

  it("returns the correct role for a regular user", async () => {
    const ctx: TrpcContext = { ...stubReqRes, user: authenticatedUser };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result?.role).toBe("user");
  });

  it("does not mutate the context user object", async () => {
    const userSnapshot = { ...authenticatedUser };
    const ctx: TrpcContext = { ...stubReqRes, user: authenticatedUser };
    const caller = appRouter.createCaller(ctx);

    await caller.auth.me();

    // The original user object in context must be untouched
    expect(ctx.user).toEqual(userSnapshot);
  });
});
