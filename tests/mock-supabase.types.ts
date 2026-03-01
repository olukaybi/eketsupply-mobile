/**
 * Shared MockSupabase interface for test files.
 *
 * Design goals:
 * 1. Enforce the top-level shape (from, rpc, storage) so typos in property
 *    names are caught at compile time.
 * 2. Allow chained query builder methods to return `MockChain` (for further
 *    chaining) OR `Promise<MockResult>` (terminal), without TypeScript
 *    complaining that the union type is not callable.
 * 3. Keep mock implementations flexible — individual files may omit optional
 *    table methods (e.g. `delete`) or use different `rpc` return shapes.
 *
 * Strategy: use the bare `Mock` type (default `Procedure` constraint) for all
 * method mocks. This preserves strict null checking on the *structure* while
 * allowing each method's implementation to return whatever the test needs.
 */
import type { Mock } from 'vitest';

// ─── Shared result shape ──────────────────────────────────────────────────────

/** Generic Supabase-style result envelope */
export interface MockResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

// ─── Query chain ──────────────────────────────────────────────────────────────

/**
 * A chainable query builder mock.
 *
 * All methods use the default `Mock` type so they accept any arguments and can
 * return either another `MockChain` (for chaining) or a `Promise<MockResult>`
 * (terminal). This mirrors how Supabase's PostgREST builder works at runtime.
 */
export interface MockChain {
  select: Mock;
  eq: Mock;
  is: Mock;
  gte: Mock;
  order: Mock;
  limit: Mock;
  single: Mock;
}

// ─── insert() chain ───────────────────────────────────────────────────────────

export interface MockSelectAfterInsert {
  single: Mock;
}

export interface MockInsertBuilder {
  select: Mock;
}

// ─── delete() chain ───────────────────────────────────────────────────────────

export interface MockDeleteBuilder {
  eq: Mock;
}

// ─── Table builder (returned by .from()) ─────────────────────────────────────

/**
 * Shape returned by `mockSupabase.from(table)`.
 * `update` and `delete` are optional — some test files only implement the
 * subset of methods they need.
 */
export interface MockTableBuilder {
  select: Mock;
  insert: Mock;
  update?: Mock;
  delete?: Mock;
}

// ─── Storage bucket (returned by .storage.from()) ────────────────────────────

export interface MockStorageBucket {
  upload: Mock;
  getPublicUrl: Mock;
  remove?: Mock;
}

// ─── Top-level client ─────────────────────────────────────────────────────────

/**
 * Top-level MockSupabase interface.
 *
 * `rpc` and `storage` are required here because every test file that uses
 * `MockSupabase` declares them. Making them required means TypeScript will
 * catch any accidental omission in a mock declaration.
 */
export interface MockSupabase {
  from: Mock;
  rpc: Mock;
  storage: {
    from: Mock;
  };
}
