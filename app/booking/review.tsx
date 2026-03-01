import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const QUICK_TAGS = [
  'Punctual', 'Professional', 'Quality Work', 'Clean & Tidy',
  'Good Value', 'Friendly', 'Would Hire Again', 'Fast Service',
];

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, _setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (bookingId) fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, payment_status, preferred_date,
          artisans:artisan_id (id, name, avatar_url, category),
          services:service_id (name)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);

      // Check if already reviewed
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.openId)
          .single();

        if (profile) {
          const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('booking_id', bookingId)
            .eq('reviewer_id', profile.id)
            .single();

          if (existing) setAlreadyReviewed(true);
        }
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const pickPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Limit Reached', 'You can add up to 3 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const uploadPhoto = async (uri: string, reviewId: string, index: number): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() || 'jpg';
      const path = `reviews/${reviewId}/photo_${index}.${ext}`;

      const { error } = await supabase.storage
        .from('review-photos')
        .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('review-photos')
        .getPublicUrl(path);

      return publicUrl;
    } catch (err) {
      console.error('Photo upload error:', err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review.');
      return;
    }

    try {
      setSubmitting(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Get reviewer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.openId)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Insert review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          artisan_id: booking?.artisans?.id,
          reviewer_id: profile.id,
          rating,
          comment: comment.trim() || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
        })
        .select('id')
        .single();

      if (reviewError) throw reviewError;

      // Upload photos if any
      if (photos.length > 0 && review) {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < photos.length; i++) {
          const url = await uploadPhoto(photos[i], review.id, i);
          if (url) uploadedUrls.push(url);
        }
        if (uploadedUrls.length > 0) {
          await supabase
            .from('reviews')
            .update({ photo_urls: uploadedUrls })
            .eq('id', review.id);
        }
      }

      // Recalculate artisan average rating
      const { data: allRatings } = await supabase
        .from('reviews')
        .select('rating')
        .eq('artisan_id', booking?.artisans?.id);

      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
        await supabase
          .from('artisans')
          .update({ rating: Math.round(avg * 10) / 10, review_count: allRatings.length })
          .eq('id', booking?.artisans?.id);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Review Submitted! 🌟',
        'Thank you for your feedback. It helps other customers find great artisans.',
        [{ text: 'Done', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (err: any) {
      console.error('Review submission error:', err);
      if (err?.code === '23505') {
        Alert.alert('Already Reviewed', 'You have already submitted a review for this booking.');
        setAlreadyReviewed(true);
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      </ScreenContainer>
    );
  }

  if (alreadyReviewed) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-5xl">✅</Text>
          <Text className="text-xl font-bold text-foreground text-center">Already Reviewed</Text>
          <Text className="text-muted text-center">You have already submitted a review for this booking.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#1B5E20', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const displayStar = hoveredStar || rating;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <Text style={{ fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Rate Your Experience</Text>
        </View>

        {/* Artisan Info */}
        {booking?.artisans && (
          <View
            className="flex-row items-center p-4 rounded-2xl mb-6"
            style={{ backgroundColor: '#F0F7F0' }}
          >
            {booking.artisans.avatar_url ? (
              <Image
                source={{ uri: booking.artisans.avatar_url }}
                style={{ width: 56, height: 56, borderRadius: 28, marginRight: 14 }}
              />
            ) : (
              <View
                style={{
                  width: 56, height: 56, borderRadius: 28, marginRight: 14,
                  backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
                  {booking.artisans.name?.[0] ?? '?'}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{booking.artisans.name}</Text>
              <Text className="text-sm text-muted">{booking.services?.name ?? booking.artisans.category}</Text>
            </View>
          </View>
        )}

        {/* Star Rating */}
        <View className="items-center mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">How would you rate this service?</Text>
          <View className="flex-row gap-3 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setRating(star);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={{ fontSize: 44, color: star <= displayStar ? '#E65100' : '#D1D5DB' }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {displayStar > 0 && (
            <Text style={{ color: '#E65100', fontWeight: '600', fontSize: 16 }}>
              {STAR_LABELS[displayStar]}
            </Text>
          )}
        </View>

        {/* Quick Tags */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">What stood out? (optional)</Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_TAGS.map(tag => {
              const selected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: selected ? '#1B5E20' : '#D1D5DB',
                    backgroundColor: selected ? '#E8F5E9' : 'transparent',
                  }}
                >
                  <Text style={{ color: selected ? '#1B5E20' : '#6B7280', fontSize: 13, fontWeight: selected ? '600' : '400' }}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Written Review */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Write a review (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share details about your experience — quality of work, professionalism, punctuality..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={500}
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              padding: 14,
              fontSize: 14,
              color: '#11181C',
              minHeight: 100,
              textAlignVertical: 'top',
              backgroundColor: '#FAFAFA',
            }}
          />
          <Text className="text-xs text-muted text-right mt-1">{comment.length}/500</Text>
        </View>

        {/* Photo Upload */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-foreground mb-2">Add photos (optional, max 3)</Text>
          <View className="flex-row gap-3">
            {photos.map((uri, idx) => (
              <View key={idx} style={{ position: 'relative' }}>
                <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                <TouchableOpacity
                  onPress={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 3 && (
              <TouchableOpacity
                onPress={pickPhoto}
                style={{
                  width: 80, height: 80, borderRadius: 10,
                  borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 28, color: '#9CA3AF' }}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
          style={{
            backgroundColor: rating === 0 ? '#9CA3AF' : '#1B5E20',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Submit Review
            </Text>
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/bookings')}
          className="items-center mt-4"
        >
          <Text className="text-muted text-sm">Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
