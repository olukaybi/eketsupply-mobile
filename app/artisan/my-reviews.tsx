import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  photo_urls: string[] | null;
  created_at: string;
  reviewer: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  booking: {
    service_type: string | null;
  } | null;
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
      <Text style={{ fontSize: 12, color: '#E65100', marginLeft: 4, marginRight: 8 }}>★</Text>
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

function ReviewCard({ review }: { review: Review }) {
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
            <Text key={s} style={{ fontSize: 14, color: s <= review.rating ? '#E65100' : '#D1D5DB' }}>★</Text>
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

      {/* Photos */}
      {review.photo_urls && review.photo_urls.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {review.photo_urls.map((uri, idx) => (
            <Image
              key={idx}
              source={{ uri }}
              style={{ width: 72, height: 72, borderRadius: 10 }}
            />
          ))}
        </View>
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

  const fetchReviews = useCallback(async (aid: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, tags, photo_urls, created_at,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url),
          booking:bookings!reviews_booking_id_fkey(service_type)
        `)
        .eq('artisan_id', aid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data as unknown as Review[]) ?? []);
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
        .select('id')
        .eq('user_id', String(user.id))
        .single();
      if (!profile) { setLoading(false); return; }

      const { data: artisan } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', (profile as { id: string }).id)
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
                <Text
                  key={s}
                  style={{ fontSize: 18, color: s <= Math.round(avgRating) ? '#E65100' : '#D1D5DB' }}
                >
                  ★
                </Text>
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
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <ReviewCard review={item} />
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
    </ScreenContainer>
  );
}
