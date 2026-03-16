/**
 * ReviewPromptSheet
 *
 * A bottom-sheet modal that appears when a customer has a recently-completed
 * booking that hasn't been reviewed yet.  It shows the artisan name, service,
 * and two CTAs: "Leave a Review" (navigates to /booking/review) and "Later".
 *
 * Usage:
 *   <ReviewPromptSheet
 *     visible={showPrompt}
 *     bookingId="..."
 *     artisanName="John Doe"
 *     serviceDescription="Plumbing"
 *     onClose={() => setShowPrompt(false)}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 320;

type Props = {
  visible: boolean;
  bookingId: string;
  artisanName: string;
  serviceDescription: string;
  onClose: () => void;
};

export function ReviewPromptSheet({
  visible,
  bookingId,
  artisanName,
  serviceDescription,
  onClose,
}: Props) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  function handleReview() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    // Small delay so the sheet animates out before navigation
    setTimeout(() => {
      router.push(`/booking/review?bookingId=${bookingId}` as never);
    }, 100);
  }

  function handleLater() {
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleLater}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        {/* Prevent taps inside the sheet from closing it */}
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} />
      </TouchableOpacity>

      {/* Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SHEET_HEIGHT,
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          transform: [{ translateY }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 20,
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: '#E5E7EB',
            alignSelf: 'center',
            marginBottom: 20,
          }}
        />

        {/* Star burst icon */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: '#FFF7ED',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 32 }}>⭐</Text>
          </View>
        </View>

        {/* Copy */}
        <Text
          style={{
            fontSize: 18, fontWeight: '700', color: '#11181C',
            textAlign: 'center', marginBottom: 6,
          }}
        >
          How was {artisanName}?
        </Text>
        <Text
          style={{
            fontSize: 14, color: '#687076',
            textAlign: 'center', lineHeight: 20, marginBottom: 24,
          }}
          numberOfLines={2}
        >
          Your {serviceDescription} job is complete. Share your experience to help others find great artisans.
        </Text>

        {/* CTAs */}
        <TouchableOpacity
          onPress={handleReview}
          style={{
            backgroundColor: '#1B5E20',
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            Leave a Review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLater}
          style={{
            borderRadius: 16,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#687076', fontWeight: '600', fontSize: 14 }}>
            Maybe Later
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
