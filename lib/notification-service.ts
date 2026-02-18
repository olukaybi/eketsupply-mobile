import { supabase } from './supabase';
import * as Notifications from 'expo-notifications';

type NotificationType = 'booking_accepted' | 'booking_rejected' | 'booking_completed' | 'new_booking';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send a push notification to a user
 */
export async function sendPushNotification({
  userId,
  type,
  title,
  body,
  data = {}
}: SendNotificationParams): Promise<boolean> {
  try {
    // Get user's push token from database
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('profile_id', userId)
      .order('last_used_at', { ascending: false })
      .limit(1);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log('No push token found for user:', userId);
      return false;
    }

    const pushToken = tokens[0].expo_push_token;

    // Send push notification via Expo
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          type,
        },
        sound: true,
      },
      trigger: null, // Send immediately
    });

    // Store notification in database for history
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        profile_id: userId,
        title,
        body,
        data: {
          ...data,
          type,
        },
        read: false,
      });

    if (notifError) {
      console.error('Error storing notification:', notifError);
    }

    console.log('✅ Push notification sent to user:', userId);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send notification when a booking is accepted
 */
export async function notifyBookingAccepted(
  customerId: string,
  artisanName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  await sendPushNotification({
    userId: customerId,
    type: 'booking_accepted',
    title: '✅ Booking Accepted!',
    body: `${artisanName} has accepted your booking for ${serviceDescription}`,
    data: {
      bookingId,
      action: 'view_booking',
    },
  });
}

/**
 * Send notification when a booking is rejected
 */
export async function notifyBookingRejected(
  customerId: string,
  artisanName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  await sendPushNotification({
    userId: customerId,
    type: 'booking_rejected',
    title: '❌ Booking Declined',
    body: `${artisanName} is unable to accept your booking for ${serviceDescription}. Please try another artisan.`,
    data: {
      bookingId,
      action: 'find_artisan',
    },
  });
}

/**
 * Send notification when a booking is completed
 */
export async function notifyBookingCompleted(
  customerId: string,
  artisanName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  await sendPushNotification({
    userId: customerId,
    type: 'booking_completed',
    title: '🎉 Job Completed!',
    body: `${artisanName} has completed your ${serviceDescription}. Please leave a review!`,
    data: {
      bookingId,
      action: 'leave_review',
    },
  });
}

/**
 * Send notification to artisan when they receive a new booking
 */
export async function notifyNewBooking(
  artisanId: string,
  customerName: string,
  serviceDescription: string,
  bookingId: string
): Promise<void> {
  await sendPushNotification({
    userId: artisanId,
    type: 'new_booking',
    title: '📬 New Booking Request',
    body: `${customerName} has requested ${serviceDescription}`,
    data: {
      bookingId,
      action: 'view_booking',
    },
  });
}
