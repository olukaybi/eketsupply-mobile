import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { Link, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";

type ServiceCategory = {
  id: string;
  name: string;
  icon: string;
  count: number;
};

type Artisan = {
  id: string;
  name: string;
  service: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  verified: boolean;
};

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "1", name: "Plumbing", icon: "🔧", count: 45 },
  { id: "2", name: "Electrical", icon: "⚡", count: 38 },
  { id: "3", name: "Carpentry", icon: "🪚", count: 52 },
  { id: "4", name: "Painting", icon: "🎨", count: 67 },
  { id: "5", name: "Cleaning", icon: "🧹", count: 89 },
  { id: "6", name: "Roofing", icon: "🏠", count: 23 },
  { id: "7", name: "Welding", icon: "🔥", count: 31 },
  { id: "8", name: "Tiling", icon: "⬜", count: 42 },
];

const FEATURED_ARTISANS: Artisan[] = [
  {
    id: "1",
    name: "Chidi Okafor",
    service: "Plumbing",
    rating: 4.8,
    reviews: 127,
    location: "Lagos, Nigeria",
    price: "₦5,000 - ₦15,000",
    verified: true,
  },
  {
    id: "2",
    name: "Amaka Nwosu",
    service: "Electrical",
    rating: 4.9,
    reviews: 203,
    location: "Abuja, Nigeria",
    price: "₦8,000 - ₦20,000",
    verified: true,
  },
  {
    id: "3",
    name: "Tunde Adeyemi",
    service: "Carpentry",
    rating: 4.7,
    reviews: 156,
    location: "Ibadan, Nigeria",
    price: "₦10,000 - ₦30,000",
    verified: true,
  },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryPress = (category: ServiceCategory) => {
    // TODO: Navigate to category detail screen
    console.log("Category pressed:", category.name);
  };

  const handleArtisanPress = (artisan: Artisan) => {
    // TODO: Navigate to artisan profile screen
    console.log("Artisan pressed:", artisan.name);
  };

  const renderCategoryItem = ({ item }: { item: ServiceCategory }) => (
    <TouchableOpacity
      onPress={() => handleCategoryPress(item)}
      className="bg-surface rounded-2xl p-4 mr-3 items-center justify-center border border-border"
      style={{ width: 110, height: 110 }}
    >
      <Text className="text-4xl mb-2">{item.icon}</Text>
      <Text className="text-sm font-semibold text-foreground text-center">{item.name}</Text>
      <Text className="text-xs text-muted mt-1">{item.count} pros</Text>
    </TouchableOpacity>
  );

  const renderArtisanCard = ({ item }: { item: Artisan }) => (
    <TouchableOpacity
      onPress={() => handleArtisanPress(item)}
      className="bg-surface rounded-2xl p-4 mr-4 border border-border"
      style={{ width: 280 }}
    >
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-3">
          <Text className="text-background text-lg font-bold">{item.name.charAt(0)}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-foreground">{item.name}</Text>
            {item.verified && <Text className="ml-1 text-success">✓</Text>}
          </View>
          <Text className="text-sm text-muted">{item.service}</Text>
        </View>
      </View>
      <View className="flex-row items-center mb-2">
        <Text className="text-warning mr-1">⭐</Text>
        <Text className="text-sm font-medium text-foreground">{item.rating}</Text>
        <Text className="text-sm text-muted ml-1">({item.reviews} reviews)</Text>
      </View>
      <Text className="text-sm text-muted mb-1">📍 {item.location}</Text>
      <Text className="text-sm font-medium text-primary">{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">EketSupply</Text>
              <Text className="text-sm text-muted">Find skilled artisans near you</Text>
            </View>
            {user ? (
              <TouchableOpacity onPress={logout} className="bg-surface rounded-full p-2">
                <Text className="text-muted">👤</Text>
              </TouchableOpacity>
            ) : (
              <Link href="/auth/sign-in" asChild>
                <TouchableOpacity className="bg-primary rounded-full px-4 py-2">
                  <Text className="text-background font-semibold text-sm">Sign In</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>

          {/* Search Bar */}
          <View className="bg-surface rounded-full px-4 py-3 flex-row items-center border border-border mb-4">
            <Text className="text-muted mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-foreground"
              placeholder="Search for services..."
              placeholderTextColor="#9BA1A6"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Location */}
          <TouchableOpacity className="flex-row items-center mb-4">
            <Text className="text-muted mr-1">📍</Text>
            <Text className="text-sm text-foreground font-medium">Lagos, Nigeria</Text>
            <Text className="text-muted ml-1">▼</Text>
          </TouchableOpacity>
        </View>

        {/* Service Categories */}
        <View className="mb-6">
          <View className="px-6 mb-3">
            <Text className="text-lg font-bold text-foreground">Service Categories</Text>
          </View>
          <FlatList
            horizontal
            data={SERVICE_CATEGORIES}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          />
        </View>

        {/* Featured Artisans */}
        <View className="mb-6">
          <View className="px-6 mb-3 flex-row justify-between items-center">
            <Text className="text-lg font-bold text-foreground">Featured Artisans</Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={FEATURED_ARTISANS}
            renderItem={renderArtisanCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          />
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">How It Works</Text>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-start mb-3">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
                <Text className="text-background font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-1">Browse Services</Text>
                <Text className="text-xs text-muted">Find the right artisan for your needs</Text>
              </View>
            </View>
            <View className="flex-row items-start mb-3">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
                <Text className="text-background font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-1">Request Quote</Text>
                <Text className="text-xs text-muted">Get estimates from verified professionals</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
                <Text className="text-background font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-1">Secure Payment</Text>
                <Text className="text-xs text-muted">Pay safely with escrow protection</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
