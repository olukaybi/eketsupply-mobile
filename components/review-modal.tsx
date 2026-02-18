import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, Image, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

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
  const [photos, setPhotos] = useState<string[]>([]);

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 3 - photos.length,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  }

  async function uploadPhotos(): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const photoUri of photos) {
      try {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const fileName = `review_${bookingId}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        const { data, error } = await supabase.storage
          .from('review-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (error) {
          console.error('Error uploading photo:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error('Error processing photo:', err);
      }
    }

    return uploadedUrls;
  }

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

      // Upload photos if any
      const photoUrls = photos.length > 0 ? await uploadPhotos() : [];

      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          artisan_id: artisanId,
          customer_id: customerId,
          booking_id: bookingId,
          rating,
          comment: comment.trim(),
          photos: photoUrls.length > 0 ? photoUrls : null,
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

          {/* Photo Upload */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">Photos (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
              {photos.map((photo, index) => (
                <View key={index} className="relative">
                  <Image source={{ uri: photo }} className="w-24 h-24 rounded-xl" />
                  <TouchableOpacity
                    className="absolute -top-2 -right-2 bg-error w-6 h-6 rounded-full items-center justify-center"
                    onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Text className="text-background font-bold text-xs">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border items-center justify-center bg-surface"
                  onPress={pickImage}
                >
                  <Text className="text-4xl text-muted">📷</Text>
                  <Text className="text-xs text-muted mt-1">Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
