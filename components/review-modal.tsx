import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import * as Haptics from "expo-haptics";

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  artisanId: string;
  customerId: string;
  artisanName: string;
  serviceDescription: string;
}

export function ReviewModal({
  visible,
  onClose,
  bookingId,
  artisanId,
  customerId,
  artisanName,
  serviceDescription,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Comment Required", "Please write a review comment");
      return;
    }

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (existingReview) {
        Alert.alert("Already Reviewed", "You have already reviewed this booking");
        onClose();
        return;
      }

      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          artisan_id: artisanId,
          customer_id: customerId,
          booking_id: bookingId,
          rating,
          comment: comment.trim(),
        });

      if (reviewError) {
        console.error('Error submitting review:', reviewError);
        Alert.alert("Error", "Failed to submit review");
        return;
      }

      // Update artisan rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('artisan_id', artisanId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const roundedRating = Math.round(avgRating * 10) / 10;

        await supabase
          .from('artisans')
          .update({ rating: roundedRating })
          .eq('id', artisanId);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thank You!", "Your review has been submitted");
      
      // Reset and close
      setRating(0);
      setComment("");
      onClose();
    } catch (err) {
      console.error('Error in submitReview:', err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-foreground">Leave a Review</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl text-muted">×</Text>
            </TouchableOpacity>
          </View>

          {/* Artisan Info */}
          <View className="mb-6">
            <Text className="text-base text-foreground font-semibold">{artisanName}</Text>
            <Text className="text-sm text-muted mt-1">{serviceDescription}</Text>
          </View>

          {/* Star Rating */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">Rating</Text>
            <View className="flex-row gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRating(star);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text className="text-4xl">
                    {star <= rating ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">Your Review</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground min-h-[120px]"
              placeholder="Share your experience..."
              placeholderTextColor="#9BA1A6"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text className="text-xs text-muted mt-2 text-right">
              {comment.length}/500
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={submitReview}
            disabled={submitting || rating === 0 || !comment.trim()}
            className={`py-4 rounded-xl ${
              submitting || rating === 0 || !comment.trim()
                ? 'bg-muted/20'
                : 'bg-primary'
            }`}
          >
            <Text className={`text-center font-semibold ${
              submitting || rating === 0 || !comment.trim()
                ? 'text-muted'
                : 'text-background'
            }`}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
