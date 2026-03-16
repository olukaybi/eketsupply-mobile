/**
 * EketSupply — Paystack Webhook Handler
 *
 * Handles all Paystack webhook events:
 *   - charge.success        → mark booking as paid, notify artisan
 *   - charge.failed         → mark booking as payment_failed, notify customer
 *   - transfer.success      → artisan settlement confirmed
 *   - transfer.failed       → artisan settlement failed, alert admin
 *   - refund.processed      → update booking status, notify customer
 *
 * Security: HMAC-SHA512 signature verification on every request.
 * Idempotency: each event is checked against processed_webhook_events
 *              table to prevent double-processing.
 */

import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase admin client (uses service role key — server-side only, never ship
// this key to the mobile app)
// ---------------------------------------------------------------------------
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn(
      "[webhook] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — " +
        "database updates will be skipped in development.",
    );
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------
function verifyPaystackSignature(
  rawBody: Buffer,
  signature: string,
  secret: string,
): boolean {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleChargeSuccess(data: PaystackChargeData) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const reference = data.reference;
  const metadata = data.metadata as BookingMetadata | undefined;
  const bookingId = metadata?.booking_id;

  console.log(`[webhook] charge.success — reference: ${reference}, booking: ${bookingId}`);

  if (!bookingId) {
    console.warn("[webhook] charge.success has no booking_id in metadata");
    return;
  }

  // Update booking: mark as paid
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      payment_reference: reference,
      payment_amount: data.amount / 100, // Paystack sends kobo
      payment_method: "paystack_split",
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("[webhook] Failed to update booking payment status:", error);
    throw error;
  }

  // Notify artisan via push notification (if notification token exists)
  await notifyArtisan(supabase, bookingId, {
    title: "New Booking Confirmed! 🎉",
    body: `Payment received for booking #${bookingId.slice(0, 8).toUpperCase()}. Please confirm your availability.`,
    data: { type: "booking_paid", booking_id: bookingId },
  });

  // Notify customer
  await notifyCustomer(supabase, bookingId, {
    title: "Payment Successful ✅",
    body: "Your booking is confirmed. The artisan will be in touch shortly.",
    data: { type: "booking_confirmed", booking_id: bookingId },
  });

  console.log(`[webhook] Booking ${bookingId} marked as paid and confirmed.`);
}

async function handleChargeFailed(data: PaystackChargeData) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const metadata = data.metadata as BookingMetadata | undefined;
  const bookingId = metadata?.booking_id;

  if (!bookingId) return;

  console.log(`[webhook] charge.failed — booking: ${bookingId}`);

  await supabase
    .from("bookings")
    .update({
      payment_status: "failed",
      status: "payment_failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  await notifyCustomer(supabase, bookingId, {
    title: "Payment Failed ❌",
    body: "Your payment could not be processed. Please try again or use a different payment method.",
    data: { type: "payment_failed", booking_id: bookingId },
  });
}

async function handleTransferSuccess(data: PaystackTransferData) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const bookingId = data.reason; // We set reason = booking_id when initiating transfer
  console.log(`[webhook] transfer.success — booking: ${bookingId}, amount: ₦${data.amount / 100}`);

  if (!bookingId) return;

  await supabase
    .from("bookings")
    .update({
      artisan_settlement_status: "settled",
      artisan_settlement_reference: data.transfer_code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  await notifyArtisan(supabase, bookingId, {
    title: "Payment Received 💰",
    body: `₦${(data.amount / 100).toLocaleString()} has been sent to your bank account.`,
    data: { type: "settlement_complete", booking_id: bookingId },
  });
}

async function handleTransferFailed(data: PaystackTransferData) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const bookingId = data.reason;
  console.error(`[webhook] transfer.failed — booking: ${bookingId}`, data);

  if (!bookingId) return;

  await supabase
    .from("bookings")
    .update({
      artisan_settlement_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // Alert admin (log for now — replace with email/Slack in production)
  console.error(
    `[ALERT] Artisan settlement FAILED for booking ${bookingId}. ` +
      `Transfer code: ${data.transfer_code}. Manual intervention required.`,
  );
}

async function handleRefundProcessed(data: PaystackRefundData) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const reference = data.transaction_reference;
  console.log(`[webhook] refund.processed — reference: ${reference}`);

  // Find booking by payment_reference and update
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, customer_id")
      .eq("payment_reference", reference)
      .single();

  const b = booking as { id: string; customer_id: string } | null;
  if (!b) return;

  await supabase
    .from("bookings")
    .update({
      payment_status: "refunded",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", b.id);

  await notifyCustomer(supabase, b.id, {
    title: "Refund Processed ✅",
    body: `Your refund of ₦${(data.amount / 100).toLocaleString()} is on its way to your account.`,
    data: { type: "refund_processed", booking_id: b.id },
  });
}

// ---------------------------------------------------------------------------
// Notification helpers
// ---------------------------------------------------------------------------

async function notifyArtisan(
  supabase: ReturnType<typeof createClient<any, any, any>>,
  bookingId: string,
  notification: PushNotification,
) {
  try {
    const { data: bookingRaw } = await supabase
      .from("bookings")
      .select("artisan_id")
      .eq("id", bookingId)
      .single();

    const booking = bookingRaw as { artisan_id?: string } | null;
    if (!booking?.artisan_id) return;

    const { data: artisan } = await supabase
      .from("artisans")
      .select("push_token, profile_id")
      .eq("id", booking.artisan_id)
      .single();

    const a = artisan as { push_token?: string; profile_id?: string } | null;
    if (a?.push_token) {
      await sendExpoPushNotification(a.push_token, notification);
    }
  } catch (err) {
    console.warn("[webhook] Failed to notify artisan:", err);
  }
}

async function notifyCustomer(
  supabase: ReturnType<typeof createClient<any, any, any>>,
  bookingId: string,
  notification: PushNotification,
) {
  try {
    const { data: bookingRaw } = await supabase
      .from("bookings")
      .select("customer_id")
      .eq("id", bookingId)
      .single();

    const booking = bookingRaw as { customer_id?: string } | null;
    if (!booking?.customer_id) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", booking.customer_id)
      .single();

    const p = profile as { push_token?: string } | null;
    if (p?.push_token) {
      await sendExpoPushNotification(p.push_token, notification);
    }
  } catch (err) {
    console.warn("[webhook] Failed to notify customer:", err);
  }
}

async function sendExpoPushNotification(token: string, notification: PushNotification) {
  if (!token.startsWith("ExponentPushToken")) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: "default",
      priority: "high",
    }),
  });
}

// ---------------------------------------------------------------------------
// Idempotency: record processed events to prevent double-processing
// ---------------------------------------------------------------------------

async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data } = await supabase
    .from("processed_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  return !!data;
}

async function markEventAsProcessed(eventId: string, event: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase
    .from("processed_webhook_events")
    .upsert(
      { event_id: eventId, event_type: event, processed_at: new Date().toISOString() },
      { onConflict: "event_id", ignoreDuplicates: true }
    );
}

// ---------------------------------------------------------------------------
// Register webhook route on the Express app
// ---------------------------------------------------------------------------

export function registerPaystackWebhook(app: Express) {
  // IMPORTANT: This route must use raw body parsing (before express.json middleware)
  // so we can verify the HMAC-SHA512 signature.
  app.post(
    "/api/webhooks/paystack",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const signature = req.headers["x-paystack-signature"] as string;
      const secret = process.env.PAYSTACK_SECRET_KEY || "";

      if (!secret) {
        console.error("[webhook] PAYSTACK_SECRET_KEY not set");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      // 1. Verify signature
      if (!verifyPaystackSignature(req.body as Buffer, signature, secret)) {
        console.warn("[webhook] Invalid Paystack signature — request rejected");
        return res.status(401).json({ error: "Invalid signature" });
      }

      // 2. Parse event
      let event: PaystackEvent;
      try {
        event = JSON.parse((req.body as Buffer).toString());
      } catch {
        return res.status(400).json({ error: "Invalid JSON" });
      }

      // 3. Acknowledge immediately (Paystack requires < 5s response)
      res.status(200).json({ received: true });

      // 4. Check idempotency
      const eventId = event.id?.toString() || `${event.event}-${Date.now()}`;
      if (await isEventAlreadyProcessed(eventId)) {
        console.log(`[webhook] Event ${eventId} already processed — skipping`);
        return;
      }

      // 5. Process event asynchronously
      try {
        switch (event.event) {
          case "charge.success":
            await handleChargeSuccess(event.data as PaystackChargeData);
            break;
          case "charge.failed":
            await handleChargeFailed(event.data as PaystackChargeData);
            break;
          case "transfer.success":
            await handleTransferSuccess(event.data as PaystackTransferData);
            break;
          case "transfer.failed":
          case "transfer.reversed":
            await handleTransferFailed(event.data as PaystackTransferData);
            break;
          case "refund.processed":
            await handleRefundProcessed(event.data as PaystackRefundData);
            break;
          default:
            console.log(`[webhook] Unhandled event type: ${event.event}`);
        }

        await markEventAsProcessed(eventId, event.event);
        console.log(`[webhook] Successfully processed: ${event.event}`);
      } catch (err) {
        console.error(`[webhook] Error processing ${event.event}:`, err);
        // Don't re-throw — we already sent 200 to Paystack
      }
    },
  );

  console.log("[api] Paystack webhook registered at POST /api/webhooks/paystack");
}

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface PaystackEvent {
  id?: number;
  event: string;
  data: unknown;
}

interface PaystackChargeData {
  reference: string;
  amount: number; // in kobo
  status: string;
  metadata?: unknown;
  customer: { email: string; first_name?: string; last_name?: string };
}

interface PaystackTransferData {
  transfer_code: string;
  amount: number; // in kobo
  reason: string; // we set this to booking_id
  status: string;
  recipient: { account_number: string; bank_code: string };
}

interface PaystackRefundData {
  transaction_reference: string;
  amount: number; // in kobo
  status: string;
}

interface BookingMetadata {
  booking_id: string;
  customer_name?: string;
  service_type?: string;
}

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Need to import express for raw body middleware inside the route registration
import express from "express";
