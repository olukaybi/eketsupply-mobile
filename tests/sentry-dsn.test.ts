import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

describe("Sentry DSN configuration", () => {
  it("EXPO_PUBLIC_SENTRY_DSN is set in environment", () => {
    const envPath = resolve(ROOT, ".env");
    const envLocalPath = resolve(ROOT, ".env.local");

    let dsnFound = false;

    // Check process.env (set by the secrets system)
    if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
      dsnFound = true;
      const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
      expect(dsn).toMatch(/^https:\/\/.+@.+\/.+$/);
    }

    // Check .env files
    for (const p of [envPath, envLocalPath]) {
      if (existsSync(p)) {
        const content = readFileSync(p, "utf8");
        if (content.includes("EXPO_PUBLIC_SENTRY_DSN")) {
          dsnFound = true;
          const match = content.match(/EXPO_PUBLIC_SENTRY_DSN=(.+)/);
          if (match) {
            expect(match[1].trim()).toMatch(/^https:\/\/.+@.+\/.+$/);
          }
        }
      }
    }

    expect(dsnFound, "EXPO_PUBLIC_SENTRY_DSN must be set in env or .env file").toBe(true);
  });

  it("lib/sentry.ts reads EXPO_PUBLIC_SENTRY_DSN from process.env", () => {
    const sentryPath = resolve(ROOT, "lib/sentry.ts");
    expect(existsSync(sentryPath)).toBe(true);
    const src = readFileSync(sentryPath, "utf8");
    expect(src).toContain("EXPO_PUBLIC_SENTRY_DSN");
    expect(src).toContain("initSentry");
    expect(src).toContain("captureException");
  });

  it("initSentry is called in root layout", () => {
    const layoutPath = resolve(ROOT, "app/_layout.tsx");
    expect(existsSync(layoutPath)).toBe(true);
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain("initSentry");
  });

  it("@sentry/react-native plugin is configured in app.config.ts", () => {
    const configPath = resolve(ROOT, "app.config.ts");
    expect(existsSync(configPath)).toBe(true);
    const src = readFileSync(configPath, "utf8");
    expect(src).toContain("@sentry/react-native/expo");
  });
});
