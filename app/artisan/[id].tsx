import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, FlatList, Modal } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

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

const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    author: "Ngozi Eze",
    rating: 5,
    date: "2 days ago",
    text: "Excellent work! Very professional and completed the job on time. Highly recommended!",
  },
  {
    id: "2",
    author: "Emeka Johnson",
    rating: 4,
    date: "1 week ago",
    text: "Good service, but took a bit longer than expected. Overall satisfied with the quality.",
  },
  {
    id: "3",
    author: "Fatima Bello",
    rating: 5,
    date: "2 weeks ago",
    text: "Amazing craftsmanship! Will definitely hire again for future projects.",
  },
];

const MOCK_SERVICES: Service[] = [
  { id: "1", name: "Pipe Repair", price: "₦5,000 - ₦10,000", duration: "2-3 hours" },
  { id: "2", name: "Toilet Installation", price: "₦8,000 - ₦15,000", duration: "3-4 hours" },
  { id: "3", name: "Water Heater Repair", price: "₦10,000 - ₦20,000", duration: "4-5 hours" },
  { id: "4", name: "Drain Cleaning", price: "₦3,000 - ₦8,000", duration: "1-2 hours" },
];

const MOCK_PORTFOLIO = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400",
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400",
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400",
];

export default function ArtisanProfileScreen() {
  const { id } = useLocalSearchParams();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Mock artisan data
  const artisan = {
    id: id as string,
    name: "Chidi Okafor",
    service: "Plumbing",
    rating: 4.8,
    reviews: 127,
    location: "Lagos, Nigeria",
    verified: true,
    bio: "Professional plumber with 10+ years of experience. Specializing in residential and commercial plumbing services. Licensed and insured.",
    completedJobs: 245,
    responseTime: "Within 2 hours",
    availability: "Mon-Sat, 8AM-6PM",
  };

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
          <FlatList
            data={MOCK_SERVICES}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Portfolio */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Portfolio</Text>
          <View className="flex-row flex-wrap">
            {MOCK_PORTFOLIO.map((uri, index) => (
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
          <FlatList
            data={MOCK_REVIEWS}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
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
