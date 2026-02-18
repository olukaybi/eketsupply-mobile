import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, FlatList, Modal, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
};

type Service = {
  id: string;
  name: string;
  price: string;
  duration: string;
};

type ArtisanProfile = {
  id: string;
  name: string;
  service: string;
  rating: number;
  reviews: number;
  location: string;
  verified: boolean;
  bio: string;
  completedJobs: number;
  responseTime: string;
  availability: string;
};

export default function ArtisanProfileScreen() {
  const { id } = useLocalSearchParams();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch artisan data from Supabase
  useEffect(() => {
    async function fetchArtisanData() {
      try {
        setLoading(true);
        
        // Fetch artisan profile
        const { data: artisanData, error: artisanError } = await supabase
          .from('artisans')
          .select(`
            *,
            profiles!artisans_profile_id_fkey(full_name, email)
          `)
          .eq('id', id)
          .single();

        if (artisanError) {
          console.error('Error fetching artisan:', artisanError);
          return;
        }

        if (artisanData) {
          setArtisan({
            id: artisanData.id,
            name: artisanData.profiles.full_name,
            service: artisanData.service_category,
            rating: artisanData.rating,
            reviews: artisanData.total_reviews,
            location: artisanData.location,
            verified: artisanData.verified,
            bio: artisanData.bio || 'No bio available',
            completedJobs: artisanData.completed_jobs,
            responseTime: artisanData.response_time,
            availability: artisanData.availability,
          });
        }

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('artisan_id', id);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        } else if (servicesData) {
          setServices(servicesData.map(s => ({
            id: s.id,
            name: s.name,
            price: `₦${s.price_min.toLocaleString()} - ₦${s.price_max.toLocaleString()}`,
            duration: s.duration,
          })));
        }

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('artisan_id', id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else if (reviewsData) {
          setReviews(reviewsData.map(r => ({
            id: r.id,
            author: r.reviewer_name,
            rating: r.rating,
            date: new Date(r.created_at).toLocaleDateString(),
            text: r.comment,
          })));
        }
      } catch (err) {
        console.error('Error in fetchArtisanData:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchArtisanData();
    }
  }, [id]);

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted text-sm mt-4">Loading artisan profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!artisan) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-semibold mb-2">Artisan Not Found</Text>
          <Text className="text-muted text-sm text-center mb-4">The artisan profile you're looking for doesn't exist.</Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-full">
            <Text className="text-background font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const renderReview = ({ item }: { item: Review }) => (
    <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
            <Text className="text-background font-bold">{item.author.charAt(0)}</Text>
          </View>
          <View>
            <Text className="text-sm font-semibold text-foreground">{item.author}</Text>
            <Text className="text-xs text-muted">{item.date}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-warning mr-1">⭐</Text>
          <Text className="text-sm font-medium text-foreground">{item.rating}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted leading-relaxed">{item.text}</Text>
    </View>
  );

  const renderService = ({ item }: { item: Service }) => (
    <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
      <Text className="text-base font-semibold text-foreground mb-2">{item.name}</Text>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-sm text-primary font-medium">{item.price}</Text>
          <Text className="text-xs text-muted mt-1">⏱️ {item.duration}</Text>
        </View>
        <TouchableOpacity className="bg-primary px-4 py-2 rounded-full">
          <Text className="text-background text-xs font-semibold">Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View className="px-6 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mr-4">
              <Text className="text-background text-3xl font-bold">{artisan.name.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-xl font-bold text-foreground">{artisan.name}</Text>
                {artisan.verified && (
                  <View className="ml-2 bg-success rounded-full px-2 py-1">
                    <Text className="text-background text-xs font-semibold">✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-muted mb-2">{artisan.service}</Text>
              <View className="flex-row items-center">
                <Text className="text-warning mr-1">⭐</Text>
                <Text className="text-sm font-medium text-foreground">{artisan.rating}</Text>
                <Text className="text-sm text-muted ml-1">({artisan.reviews} reviews)</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row justify-between bg-surface rounded-xl p-4 border border-border mb-4">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{artisan.completedJobs}</Text>
              <Text className="text-xs text-muted mt-1">Jobs Done</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{artisan.rating}</Text>
              <Text className="text-xs text-muted mt-1">Rating</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{artisan.reviews}</Text>
              <Text className="text-xs text-muted mt-1">Reviews</Text>
            </View>
          </View>

          {/* Quick Info */}
          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-muted mr-2">📍</Text>
              <Text className="text-sm text-foreground">{artisan.location}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Text className="text-muted mr-2">⏰</Text>
              <Text className="text-sm text-foreground">{artisan.availability}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-muted mr-2">💬</Text>
              <Text className="text-sm text-foreground">Responds {artisan.responseTime}</Text>
            </View>
          </View>

          {/* Bio */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground mb-2">About</Text>
            <Text className="text-sm text-muted leading-relaxed">{artisan.bio}</Text>
          </View>
        </View>

        {/* Services */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Services Offered</Text>
          {services.length > 0 ? (
            <FlatList
              data={services}
              renderItem={renderService}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center py-8">
              <Text className="text-muted text-sm">No services listed</Text>
            </View>
          )}
        </View>

        {/* Portfolio */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Portfolio</Text>
          <View className="flex-row flex-wrap">
            {[1, 2, 3, 4].map((index) => (
              <View key={index} className="w-1/2 p-1">
                <View className="bg-surface rounded-xl overflow-hidden border border-border" style={{ height: 150 }}>
                  <View className="flex-1 bg-muted/20 items-center justify-center">
                    <Text className="text-4xl">🖼️</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-foreground">Reviews ({artisan.reviews})</Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReview}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center py-8">
              <Text className="text-muted text-sm">No reviews yet</Text>
            </View>
          )}
        </View>

        {/* Bottom Padding for Fixed Buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setShowQuoteModal(true)}
            className="flex-1 bg-surface border-2 border-primary rounded-full py-4"
          >
            <Text className="text-primary text-center font-semibold">Request Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowBookingModal(true)}
            className="flex-1 bg-primary rounded-full py-4"
          >
            <Text className="text-background text-center font-semibold">Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
