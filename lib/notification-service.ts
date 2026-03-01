/**
 * EketSupply Notification Service
 *
 * Handles:
 * 1. Push token registration (device → Supabase profiles table)
 * 2. Foreground notification display handler
 * 3. Server-side push sending via Expo Push API (called from webhook handler)
 * 4. Local (in-app) notifications for immediate feedback
 * 5. Deep-link URL generation per notification event
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// ─── Foreground handler (must be at module level) ────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Android notification channel ────────────────────────────────────────────
export async function setupAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("eketsupply", {
      name: "EketSupply",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1B5E20",
      sound: "default",
    });
  }
}

// ─── Push token registration ──────────────────────────────────────────────────
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[Notifications] Push tokens require a physical device");
    return null;
  }

  await setupAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notifications] Permission denied");
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      // In dev without EAS, we can't get a real Expo push token.
      // Local notifications still work via scheduleNotificationAsync.
      console.log("[Notifications] No EAS projectId — local notifications only");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Persist token to Supabase so the webhook handler can look it up
    if (token && userId) {
      const { error } = await supabase
        .from("profiles")
        .update({
          push_token: token,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) console.error("[Notifications] Failed to save token:", error);
      else console.log("[Notifications] Push token saved for user:", userId);
    }

    return token;
  } catch (error) {
    console.error("[Notifications] Token registration error:", error);
    return null;
  }
}

// ─── Notification event types ─────────────────────────────────────────────────
export type NotificationEvent =
  | "booking_received"   // artisan: new booking request
  | "booking_accepted"   // customer: artisan accepted
  | "booking_declined"   // customer: artisan declined
  | "booking_started"    // customer: artisan is on the way
  | "booking_completed"  // customer: job done, please review
  | "payment_confirmed"  // artisan: Paystack payment received
  | "new_message"        // both: new chat message
  | "artisan_approved"   // artisan: verification approved by admin
  | "artisan_rejected"   // artisan: verification rejected
  | "badge_earned";      // artisan: new achievement badge

// ─── Notification content templates ──────────────────────────────────────────
export function buildNotificationContent(
  event: NotificationEvent,
  params: Record<string, string>
): { title: string; body: string } {
  const { artisanName, customerName, serviceName, bookingRef, badgeName, senderName } = params;

  const templates: Record<NotificationEvent, { title: string; body: string }> = {
    booking_received: {
      title: "New Booking Request",
      body: `${customerName ?? "A customer"} wants to book ${serviceName ?? "your service"}. Tap to review.`,
    },
    booking_accepted: {
      title: "Booking Confirmed!",
      body: `${artisanName ?? "Your artisan"} has accepted your booking. They'll be in touch shortly.`,
    },
    booking_declined: {
      title: "Booking Declined",
      body: `${artisanName ?? "The artisan"} is unavailable. Please search for another artisan.`,
    },
    booking_started: {
      title: "Artisan On the Way",
      body: `${artisanName ?? "Your artisan"} has started your job and is on their way.`,
    },
    booking_completed: {
      title: "Job Completed!",
      body: `${artisanName ?? "Your artisan"} has marked the job as complete. Please leave a review.`,
    },
    payment_confirmed: {
      title: "Payment Received",
      body: `Payment for booking ${bookingRef ?? ""} confirmed. Funds settle within 24-48 hours.`,
    },
    new_message: {
      title: `Message from ${senderName ?? "EketSupply"}`,
      body: "You have a new message. Tap to reply.",
    },
    artisan_approved: {
      title: "Verification Approved!",
      body: "Your artisan profile is verified. You can now receive bookings.",
    },
    artisan_rejected: {
      title: "Verification Update",
      body: "Your verification needs attention. Please review the feedback and resubmit.",
    },
    badge_earned: {
      title: `Badge Earned: ${badgeName ?? "Achievement"}`,
      body: "You've earned a new achievement badge! Check your profile to see it.",
    },
  };

  return templates[event];
}

// ─── Deep-link URL per event ──────────────────────────────────────────────────
export function buildNotificationUrl(
  event: NotificationEvent,
  params: Record<string, string>
): string {
  const { bookingId } = params;

  const urlMap: Record<NotificationEvent, string> = {
    booking_received: `/artisan/dashboard`,
    booking_accepted: `/(tabs)/bookings`,
    booking_declined: `/(tabs)/bookings`,
    booking_started: `/(tabs)/bookings`,
    booking_completed: `/(tabs)/bookings`,
    payment_confirmed: `/artisan/dashboard`,
    new_message: bookingId ? `/chat/${bookingId}` : `/(tabs)/messages`,
    artisan_approved: `/artisan/dashboard`,
    artisan_rejected: `/artisan/onboarding`,
    badge_earned: `/artisan/dashboard`,
  };

  return urlMap[event];
}

// ─── Local (immediate) notification ──────────────────────────────────────────
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: "default",
    },
    trigger: null,
  });
}

// ─── Legacy helpers (kept for backward compatibility) ────────────────────────
export async function sendPushNotification({
  userId,
  type,
  title,
  body,
  data = {},
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    // Show local notification immediately (works without EAS)
    await showLocalNotification(title, body, { ...data, type });

    // Store in notifications table for history
    await supabase.from("notifications").insert({
      profile_id: userId,
      title,
      body,
      data: { ...data, type },
      read: false,
    });

    return true;
  } catch (error) {
    console.error("[Notifications] sendPushNotification error:", error);
    return false;
  }
}

export async function notifyBookingAccepted(
  customerId: string,
  artisanName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  const { title, body } = buildNotificationContent("booking_accepted", {
    artisanName,
    serviceName: serviceDescription,
    bookingId,
  });
  await sendPushNotification({ userId: customerId, type: "booking_accepted", title, body, data: { bookingId } });
}

export async function notifyBookingRejected(
  customerId: string,
  artisanName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  const { title, body } = buildNotificationContent("booking_declined", {
    artisanName,
    serviceName: serviceDescription,
    bookingId,
  });
  await sendPushNotification({ userId: customerId, type: "booking_declined", title, body, data: { bookingId } });
}

export async function notifyBookingCompleted(
  customerId: string,
  artisanName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  const { title, body } = buildNotificationContent("booking_completed", {
    artisanName,
    serviceName: serviceDescription,
    bookingId,
  });
  await sendPushNotification({ userId: customerId, type: "booking_completed", title, body, data: { bookingId } });
}

export async function notifyNewBooking(
  artisanId: string,
  customerName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  const { title, body } = buildNotificationContent("booking_received", {
    customerName,
    serviceName: serviceDescription,
    bookingId,
  });
  await sendPushNotification({ userId: artisanId, type: "booking_received", title, body, data: { bookingId } });
}
