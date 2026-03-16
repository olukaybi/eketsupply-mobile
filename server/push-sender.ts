/**
 * EketSupply Server-Side Push Sender
 *
 * Sends push notifications via the Expo Push API.
 * Called by the Paystack webhook handler and tRPC routes.
 *
 * Expo Push API docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

// ─── Core send function ───────────────────────────────────────────────────────
async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json() as { data: ExpoPushTicket[] };
    return result.data ?? [];
  } catch (error) {
    console.error("[PushSender] Failed to send push messages:", error);
    return [];
  }
}

// ─── Get push token for a user ────────────────────────────────────────────────
async function getPushToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("push_token")
    .eq("user_id", userId)
    .single();

  if (error || !data?.push_token) return null;

  const token = data.push_token as string;
  // Validate it's an Expo push token
  if (!token.startsWith("ExponentPushToken[")) return null;

  return token;
}

// ─── Send to a single user ────────────────────────────────────────────────────
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const token = await getPushToken(supabase, userId);
  if (!token) {
    console.log(`[PushSender] No push token for user ${userId}`);
    return false;
  }

  const tickets = await sendExpoPushMessages([{
    to: token,
    title,
    body,
    data: data ?? {},
    sound: "default",
    channelId: "eketsupply",
    priority: "high",
  }]);

  const success = tickets[0]?.status === "ok";
  if (!success) {
    console.error("[PushSender] Push failed:", tickets[0]?.message);
  }
  return success;
}

// ─── Booking event notifications ──────────────────────────────────────────────

/** Notify artisan of a new booking request */
export async function notifyArtisanNewBooking(
  supabase: SupabaseClient,
  artisanUserId: string,
  customerName: string,
  serviceName: string,
  bookingId: string
) {
  return sendPushToUser(
    supabase,
    artisanUserId,
    "New Booking Request",
    `${customerName} wants to book ${serviceName}. Tap to review.`,
    { url: "/artisan/dashboard", bookingId, event: "booking_received" }
  );
}

/** Notify customer that artisan accepted */
export async function notifyCustomerBookingAccepted(
  supabase: SupabaseClient,
  customerUserId: string,
  artisanName: string,
  bookingId: string
) {
  return sendPushToUser(
    supabase,
    customerUserId,
    "Booking Confirmed!",
    `${artisanName} has accepted your booking. They'll be in touch shortly.`,
    { url: "/(tabs)/bookings", bookingId, event: "booking_accepted" }
  );
}

/** Notify customer that artisan declined */
export async function notifyCustomerBookingDeclined(
  supabase: SupabaseClient,
  customerUserId: string,
  artisanName: string,
  bookingId: string
) {
  return sendPushToUser(
    supabase,
    customerUserId,
    "Booking Declined",
    `${artisanName} is unavailable. Please search for another artisan.`,
    { url: "/(tabs)/bookings", bookingId, event: "booking_declined" }
  );
}

/** Notify customer that job is complete */
export async function notifyCustomerJobCompleted(
  supabase: SupabaseClient,
  customerUserId: string,
  artisanName: string,
  bookingId: string
) {
  return sendPushToUser(
    supabase,
    customerUserId,
    "Job Completed!",
    `${artisanName} has marked the job as complete. Please leave a review.`,
    { url: "/(tabs)/bookings", bookingId, event: "booking_completed" }
  );
}

/** Notify artisan that Paystack payment was confirmed */
export async function notifyArtisanPaymentConfirmed(
  supabase: SupabaseClient,
  artisanUserId: string,
  bookingRef: string,
  amount: number
) {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

  return sendPushToUser(
    supabase,
    artisanUserId,
    "Payment Received",
    `Payment of ${formatted} for booking ${bookingRef} confirmed. Settles in 24-48 hours.`,
    { url: "/artisan/dashboard", bookingRef, event: "payment_confirmed" }
  );
}

/** Notify user of a new chat message */
export async function notifyNewMessage(
  supabase: SupabaseClient,
  recipientUserId: string,
  senderName: string,
  bookingId: string
) {
  return sendPushToUser(
    supabase,
    recipientUserId,
    `Message from ${senderName}`,
    "You have a new message. Tap to reply.",
    { url: `/chat/${bookingId}`, bookingId, event: "new_message" }
  );
}

/** Notify artisan that their verification was approved */
export async function notifyArtisanVerificationApproved(
  supabase: SupabaseClient,
  artisanUserId: string
) {
  return sendPushToUser(
    supabase,
    artisanUserId,
    "Verification Approved!",
    "Your artisan profile is verified. You can now receive bookings.",
    { url: "/artisan/dashboard", event: "artisan_approved" }
  );
}

/** Notify artisan that their verification was rejected */
export async function notifyArtisanVerificationRejected(
  supabase: SupabaseClient,
  artisanUserId: string,
  reason?: string
) {
  return sendPushToUser(
    supabase,
    artisanUserId,
    "Verification Update",
    reason ?? "Your verification needs attention. Please review the feedback and resubmit.",
    { url: "/artisan/onboarding", event: "artisan_rejected" }
  );
}
