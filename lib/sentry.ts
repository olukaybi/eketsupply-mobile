/**
 * EketSupply Sentry Integration
 *
 * Provides crash reporting and error tracking for the app.
 * Sentry DSN is read from EXPO_PUBLIC_SENTRY_DSN (safe to expose client-side).
 *
 * Usage:
 *   import { captureException, captureMessage, setUser, clearUser } from "@/lib/sentry";
 *
 *   captureException(error);                     // in catch blocks
 *   captureMessage("Payment flow started");       // breadcrumb events
 *   setUser({ id: userId, email });              // after sign-in
 *   clearUser();                                 // after sign-out
 */
import * as Sentry from "@sentry/react-native";
import { Platform } from "react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

let _initialized = false;

/**
 * Initialise Sentry. Call once from the root layout before rendering.
 * No-ops if DSN is not configured (safe for local dev without a Sentry project).
 */
export function initSentry() {
  if (_initialized || !DSN) return;

  Sentry.init({
    dsn: DSN,
    // Capture 20% of transactions for performance monitoring
    tracesSampleRate: 0.2,
    // Capture 10% of sessions for session replay
    replaysSessionSampleRate: 0.1,
    // Always capture replays on crash
    replaysOnErrorSampleRate: 1.0,
    // Attach JS stack traces to all events
    attachStacktrace: true,
    // Tag environment
    environment: __DEV__ ? "development" : "production",
    // Disable in development to avoid noise
    enabled: !__DEV__,
    integrations: [
      Sentry.mobileReplayIntegration(),
    ],
    beforeSend(event) {
      // Return event as-is; PII is stripped at the Sentry project level via Data Scrubbing rules
      return event;
    },
  });

  _initialized = true;
}

/**
 * Capture an exception (replaces console.error in catch blocks).
 * Safe to call even if Sentry is not initialised.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (!_initialized) return;
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/**
 * Capture a non-fatal message for breadcrumb tracking.
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
) {
  if (!_initialized) return;
  Sentry.captureMessage(message, level);
}

/**
 * Set the current authenticated user context.
 * Call after successful sign-in.
 */
export function setUser(user: { id: string; email?: string }) {
  if (!_initialized) return;
  Sentry.setUser({ id: user.id, email: user.email });
}

/**
 * Clear the user context on sign-out.
 */
export function clearUser() {
  if (!_initialized) return;
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for important user actions.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  if (!_initialized) return;
  Sentry.addBreadcrumb({ message, category, data, level: "info" });
}

/**
 * Wrap a React component with the Sentry error boundary.
 * Use this on screen-level components for automatic crash reporting.
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Higher-order component that wraps the root app with Sentry's
 * navigation and performance instrumentation.
 */
export const wrap = Sentry.wrap;

export { Sentry };
