import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import type { User } from "../drizzle/schema";

// ─── Mock notifyOwner so tests don't make real HTTP calls ─────────────────────
vi.mock("../server/_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

import { notifyOwner } from "../server/_core/notification";
const mockNotifyOwner = vi.mocked(notifyOwner);

// ─── Context helpers ──────────────────────────────────────────────────────────

const stubReqRes = {
  req: {
    protocol: "https",
    hostname: "localhost",
    headers: {},
  } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const regularUser: User = {
  id: 10,
  openId: "user-open-id",
  email: "user@eketsupply.com",
  name: "Regular User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
  lastSignedIn: new Date("2026-02-28T00:00:00Z"),
};

const adminUser: User = {
  ...regularUser,
  id: 1,
  email: "admin@eketsupply.com",
  name: "EketSupply Admin",
  role: "admin",
};

function makeCtx(user: User | null): TrpcContext {
  return { ...stubReqRes, user };
}

// ─── system.health ────────────────────────────────────────────────────────────

describe("system.health", () => {
  it("returns { ok: true } for an authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx(regularUser));
    const result = await caller.system.health({ timestamp: Date.now() });
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } for an unauthenticated request", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.system.health({ timestamp: Date.now() });
    expect(result).toEqual({ ok: true });
  });

  it("accepts timestamp 0 (boundary value)", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.system.health({ timestamp: 0 });
    expect(result).toEqual({ ok: true });
  });

  it("rejects a negative timestamp with a validation error", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.system.health({ timestamp: -1 }),
    ).rejects.toThrow();
  });

  it("rejects a missing timestamp input", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      // @ts-expect-error — intentionally passing wrong input to test runtime validation
      caller.system.health({}),
    ).rejects.toThrow();
  });
});

// ─── system.notifyOwner ───────────────────────────────────────────────────────

describe("system.notifyOwner", () => {
  beforeEach(() => {
    mockNotifyOwner.mockReset();
  });

  it("succeeds and returns { success: true } when called by an admin", async () => {
    mockNotifyOwner.mockResolvedValue(true);
    const caller = appRouter.createCaller(makeCtx(adminUser));

    const result = await caller.system.notifyOwner({
      title: "Test Alert",
      content: "This is a test notification from the admin.",
    });

    expect(result).toEqual({ success: true });
    expect(mockNotifyOwner).toHaveBeenCalledOnce();
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "Test Alert",
      content: "This is a test notification from the admin.",
    });
  });

  it("returns { success: false } when notifyOwner delivery fails", async () => {
    mockNotifyOwner.mockResolvedValue(false);
    const caller = appRouter.createCaller(makeCtx(adminUser));

    const result = await caller.system.notifyOwner({
      title: "Failed Alert",
      content: "Delivery will fail.",
    });

    expect(result).toEqual({ success: false });
  });

  it("throws FORBIDDEN when called by a regular user", async () => {
    const caller = appRouter.createCaller(makeCtx(regularUser));

    await expect(
      caller.system.notifyOwner({ title: "Hack", content: "Attempt" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(mockNotifyOwner).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN when called without a session (adminProcedure guards both null and non-admin)", async () => {
    const caller = appRouter.createCaller(makeCtx(null));

    await expect(
      caller.system.notifyOwner({ title: "No auth", content: "No session" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(mockNotifyOwner).not.toHaveBeenCalled();
  });

  it("rejects an empty title with a validation error", async () => {
    const caller = appRouter.createCaller(makeCtx(adminUser));

    await expect(
      caller.system.notifyOwner({ title: "", content: "Valid content" }),
    ).rejects.toThrow();

    expect(mockNotifyOwner).not.toHaveBeenCalled();
  });

  it("rejects an empty content with a validation error", async () => {
    const caller = appRouter.createCaller(makeCtx(adminUser));

    await expect(
      caller.system.notifyOwner({ title: "Valid title", content: "" }),
    ).rejects.toThrow();

    expect(mockNotifyOwner).not.toHaveBeenCalled();
  });
});
