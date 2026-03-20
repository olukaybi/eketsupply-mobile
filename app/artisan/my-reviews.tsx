import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl,
  TextInput, KeyboardAvoidingView, Platform, Alert, Modal, Dimensions, ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { notifyReviewReply } from '@/lib/notification-service';
import { AppIcon } from '@/components/ui/app-icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ReviewReply = {
  id: string;
  reply_text: string;
  created_at: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  photo_urls: string[] | null;
  created_at: string;
  reviewer_id: string | null;
  reviewer: {
    full_name: string | null;
    avatar_url: string | null;
    user_id: string | null;
  } | null;
  booking: {
    service_type: string | null;
  } | null;
  reply: ReviewReply | null;
};

type RatingBreakdown = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

function StarRow({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ fontSize: 12, color: '#687076', width: 8 }}>{stars}</Text>
      <AppIcon name="star.fill" size={12} color="#E65100" style={{ marginLeft: 4, marginRight: 8 }} />
      <View style={{ flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: pct > 0 ? '#E65100' : 'transparent',
            borderRadius: 4,
          }}
        />
      </View>
      <Text style={{ fontSize: 12, color: '#687076', width: 24, textAlign: 'right', marginLeft: 8 }}>{count}</Text>
    </View>
  );
}

type ReviewCardProps = {
  review: Review;
  artisanId: string;
  artisanName: string;
  onReplySubmitted: () => void;
  onPhotoPress: (photos: string[], index: number) => void;
};

function ReviewCard({ review, artisanId, artisanName, onReplySubmitted, onPhotoPress }: ReviewCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState(review.reply?.reply_text ?? '');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const reviewerName = review.reviewer?.full_name ?? 'Anonymous';
  const initials = reviewerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const dateStr = new Date(review.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const hasExistingReply = !!review.reply;

  async function submitReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      if (hasExistingReply) {
        // Update existing reply
        const { error } = await supabase
          .from('review_replies')
          .update({ reply_text: replyText.trim(), updated_at: new Date().toISOString() })
          .eq('review_id', review.id);
        if (error) throw error;
      } else {
        // Insert new reply — then notify the reviewer
        const { error } = await supabase
          .from('review_replies')
          .insert({ review_id: review.id, artisan_id: artisanId, reply_text: replyText.trim() });
        if (error) throw error;

        // Send push notification to the customer who wrote the review
        const reviewerUserId = review.reviewer?.user_id ?? null;
        if (reviewerUserId) {
          // Look up the profile row id for this user
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', reviewerUserId)
            .single();
          if (profileRow) {
            notifyReviewReply({
              customerId: (profileRow as { id: string }).id,
              artisanName,
              reviewId: review.id,
            }).catch(() => {/* non-blocking */});
          }
        }
      }
      setShowReplyInput(false);
      onReplySubmitted();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReply() {
    Alert.alert('Delete Reply', 'Remove your reply to this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('review_replies')
            .delete()
            .eq('review_id', review.id);
          if (error) {
            Alert.alert('Error', 'Could not delete reply.');
            return;
          }
          setReplyText('');
          setShowReplyInput(false);
          onReplySubmitted();
        },
      },
    ]);
  }

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      {/* Reviewer info row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        {review.reviewer?.avatar_url ? (
          <Image
            source={{ uri: review.reviewer.avatar_url }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
          />
        ) : (
          <View
            style={{
              width: 40, height: 40, borderRadius: 20, marginRight: 10,
              backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#11181C' }}>{reviewerName}</Text>
          <Text style={{ fontSize: 12, color: '#687076', marginTop: 1 }}>
            {review.booking?.service_type ?? 'Service'} · {dateStr}
          </Text>
        </View>
        {/* Stars */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <AppIcon key={s} name={s <= review.rating ? 'star.fill' : 'star'} size={14} color={s <= review.rating ? '#E65100' : '#D1D5DB'} />
          ))}
        </View>
      </View>

      {/* Comment */}
      {review.comment ? (
        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 10 }}>
          {review.comment}
        </Text>
      ) : null}

      {/* Tags */}
      {review.tags && review.tags.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {review.tags.map((tag) => (
            <View
              key={tag}
              style={{
                paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 20, backgroundColor: '#E8F5E9',
              }}
            >
              <Text style={{ fontSize: 11, color: '#1B5E20', fontWeight: '600' }}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Photos — tappable to open full-screen gallery */}
      {review.photo_urls && review.photo_urls.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {review.photo_urls.map((uri, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onPhotoPress(review.photo_urls!, idx)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri }}
                style={{ width: 72, height: 72, borderRadius: 10 }}
              />
              {review.photo_urls!.length > 3 && idx === 2 && (
                <View
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    +{review.photo_urls!.length - 3}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )).slice(0, 3)}
        </View>
      ) : null}

      {/* Existing reply bubble */}
      {hasExistingReply && !showReplyInput && (
        <View
          style={{
            backgroundColor: '#F0FDF4',
            borderRadius: 12,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: '#1B5E20',
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#1B5E20', marginBottom: 4 }}>
            Your Reply
          </Text>
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>
            {review.reply!.reply_text}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setReplyText(review.reply!.reply_text);
                setShowReplyInput(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              <Text style={{ fontSize: 12, color: '#1B5E20', fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteReply}>
              <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reply input */}
      {showReplyInput ? (
        <View style={{ marginTop: 8 }}>
          <TextInput
            ref={inputRef}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write a public reply to this review…"
            placeholderTextColor="#9BA1A6"
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: '#1B5E20',
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              color: '#11181C',
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            returnKeyType="default"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setShowReplyInput(false);
                setReplyText(review.reply?.reply_text ?? '');
              }}
              style={{
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 13, color: '#687076', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submitReply}
              disabled={submitting || !replyText.trim()}
              style={{
                paddingHorizontal: 20, paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: replyText.trim() ? '#1B5E20' : '#D1D5DB',
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>
                  {hasExistingReply ? 'Update' : 'Reply'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : !hasExistingReply ? (
        <TouchableOpacity
          onPress={() => {
            setShowReplyInput(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          style={{
            flexDirection: 'row', alignItems: 'center', marginTop: 8,
            paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#E5E7EB',
          }}
        >
          <IconSymbol name="chevron.right" size={14} color="#1B5E20" />
          <Text style={{ fontSize: 13, color: '#1B5E20', fontWeight: '600', marginLeft: 4 }}>
            Reply to this review
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function MyReviewsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [artisanName, setArtisanName] = useState<string>('Your Artisan');
  // Photo gallery state
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);

  function openGallery(photos: string[], index: number) {
    setGalleryPhotos(photos);
    setGalleryIndex(index);
    setGalleryVisible(true);
  }

  const fetchReviews = useCallback(async (aid: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, tags, photo_urls, created_at, reviewer_id,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url, user_id),
          booking:bookings!reviews_booking_id_fkey(service_type),
          reply:review_replies(id, reply_text, created_at)
        `)
        .eq('artisan_id', aid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Supabase returns reply as array (one-to-one via unique constraint)
      const mapped = ((data as any[]) ?? []).map((r) => ({
        ...r,
        reply: Array.isArray(r.reply) ? (r.reply[0] ?? null) : (r.reply ?? null),
      })) as Review[];

      setReviews(mapped);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const resolveArtisanAndFetch = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_id', String(user.id))
        .single();
      if (!profile) { setLoading(false); return; }

      const p = profile as { id: string; full_name: string | null };
      if (p.full_name) setArtisanName(p.full_name);

      const { data: artisan } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', p.id)
        .single();
      if (!artisan) { setLoading(false); return; }

      const aid = (artisan as { id: string }).id;
      setArtisanId(aid);
      await fetchReviews(aid);
    } catch (err) {
      console.error('Error resolving artisan:', err);
      setLoading(false);
    }
  }, [user?.id, fetchReviews]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      resolveArtisanAndFetch();
    }, [resolveArtisanAndFetch]),
  );

  const onRefresh = useCallback(() => {
    if (!artisanId) return;
    setRefreshing(true);
    fetchReviews(artisanId);
  }, [artisanId, fetchReviews]);

  // ─── Compute stats ────────────────────────────────────────────────────────
  const total = reviews.length;
  const avgRating = total > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;

  const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    breakdown[r.rating as keyof RatingBreakdown] += 1;
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      </ScreenContainer>
    );
  }

  const ListHeader = (
    <View>
      {/* Page header */}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <IconSymbol name="chevron.left" size={22} color="#11181C" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#11181C' }}>My Reviews</Text>
      </View>

      {/* Rating summary card */}
      <View
        style={{
          marginHorizontal: 20, marginBottom: 20,
          backgroundColor: '#fff', borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: '#E5E7EB',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          {/* Big average */}
          <View style={{ alignItems: 'center', marginRight: 24 }}>
            <Text style={{ fontSize: 52, fontWeight: '800', color: '#11181C', lineHeight: 56 }}>
              {total > 0 ? avgRating.toFixed(1) : '—'}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <AppIcon key={s} name={s <= Math.round(avgRating) ? 'star.fill' : 'star'} size={18} color={s <= Math.round(avgRating) ? '#E65100' : '#D1D5DB'} />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: '#687076', marginTop: 4 }}>
              {total} review{total !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Breakdown bars */}
          <View style={{ flex: 1 }}>
            {([5, 4, 3, 2, 1] as const).map((s) => (
              <StarRow key={s} stars={s} count={breakdown[s]} total={total} />
            ))}
          </View>
        </View>

        {total === 0 && (
          <Text style={{ fontSize: 13, color: '#687076', textAlign: 'center' }}>
            No reviews yet. Complete jobs to start receiving ratings from customers.
          </Text>
        )}
      </View>

      {total > 0 && (
        <Text
          style={{
            fontSize: 13, fontWeight: '600', color: '#687076',
            textTransform: 'uppercase', letterSpacing: 0.8,
            paddingHorizontal: 20, marginBottom: 12,
          }}
        >
          All Reviews
        </Text>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Full-screen photo gallery modal */}
      <Modal
        visible={galleryVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setGalleryVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => setGalleryVisible(false)}
            style={{ position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 }}
          >
            <AppIcon name="xmark" size={24} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: galleryIndex * SCREEN_WIDTH, y: 0 }}
          >
            {galleryPhotos.map((uri, idx) => (
              <View key={idx} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={{ uri }}
                  style={{ width: SCREEN_WIDTH - 32, height: SCREEN_HEIGHT * 0.7, borderRadius: 12 }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 12, fontSize: 13, opacity: 0.7 }}>
            {galleryIndex + 1} / {galleryPhotos.length}
          </Text>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 20 }}>
              {artisanId && (
                <ReviewCard
                  review={item}
                  artisanId={artisanId}
                  artisanName={artisanName}
                  onReplySubmitted={() => fetchReviews(artisanId)}
                  onPhotoPress={openGallery}
                />
              )}
            </View>
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#11181C', marginBottom: 8, textAlign: 'center' }}>
                No Reviews Yet
              </Text>
              <Text style={{ fontSize: 14, color: '#687076', textAlign: 'center', lineHeight: 20 }}>
                Complete jobs and deliver great service to start earning reviews from customers.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1B5E20"
              colors={['#1B5E20']}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
