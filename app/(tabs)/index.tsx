import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

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

type ArtisanData = {
  id: string;
  profile_id: string;
  service_category: string;
  bio: string | null;
  location: string;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  response_time: string;
  availability: string;
  verified: boolean;
  profiles: {
    full_name: string;
    email: string;
  };
  services: Array<{
    price: string;
  }>;
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [filteredArtisans, setFilteredArtisans] = useState<Artisan[]>([]);
  const [loadingArtisans, setLoadingArtisans] = useState(true);

  // Fetch artisans from Supabase
  useEffect(() => {
    async function fetchArtisans() {
      try {
        setLoadingArtisans(true);
        const { data, error } = await supabase
          .from('artisans')
          .select(`
            *,
            profiles!artisans_profile_id_fkey(full_name, email),
            services(price)
          `)
          .eq('verified', true)
          .order('rating', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching artisans:', error);
          return;
        }

        if (data) {
          const formattedArtisans: Artisan[] = data.map((artisan: ArtisanData) => {
            const price = artisan.services[0]?.price || '₦5,000 - ₦15,000';
            return {
              id: artisan.id,
              name: artisan.profiles.full_name,
              service: artisan.service_category,
              rating: artisan.rating,
              reviews: artisan.total_reviews,
              location: artisan.location,
              price: price,
              verified: artisan.verified,
            };
          });
          setArtisans(formattedArtisans);
          setFilteredArtisans(formattedArtisans);
        }
      } catch (err) {
        console.error('Error in fetchArtisans:', err);
      } finally {
        setLoadingArtisans(false);
      }
    }

    fetchArtisans();
  }, []);

  // Filter artisans based on search, category, and location
  useEffect(() => {
    let filtered = [...artisans];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(artisan =>
        artisan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artisan.service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(artisan =>
        artisan.service.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(artisan =>
        artisan.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredArtisans(filtered);
  }, [searchQuery, selectedCategory, selectedLocation, artisans]);

  const handleCategoryPress = (category: ServiceCategory) => {
    if (selectedCategory === category.name) {
      setSelectedCategory(null); // Deselect if already selected
    } else {
      setSelectedCategory(category.name);
    }
  };

  const handleArtisanPress = (artisan: Artisan) => {
    // TODO: Navigate to artisan profile screen
    console.log("Artisan pressed:", artisan.name);
  };

  const renderCategoryItem = ({ item }: { item: ServiceCategory }) => {
    const isSelected = selectedCategory === item.name;
    return (
      <TouchableOpacity
        onPress={() => handleCategoryPress(item)}
        className="items-center mr-4"
      >
        <View className={`w-20 h-20 rounded-2xl items-center justify-center mb-2 border-2 ${
          isSelected ? 'bg-primary border-primary' : 'bg-surface border-border'
        }`}>
          <Text className="text-4xl">{item.icon}</Text>
        </View>
        <Text className={`text-xs font-medium text-center ${
          isSelected ? 'text-primary' : 'text-foreground'
        }`}>{item.name}</Text>
        <Text className="text-xs text-muted">{item.count}</Text>
      </TouchableOpacity>
    );
  };

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

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push('/emergency-booking')}
              className="flex-1 rounded-xl p-4 flex-row items-center justify-center"
              style={{ backgroundColor: '#EF4444' }}
            >
              <Text className="text-2xl mr-2">🚨</Text>
              <View>
                <Text className="text-white font-bold text-sm">Emergency</Text>
                <Text className="text-white text-xs opacity-90">Within 2hrs</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/map-view')}
              className="flex-1 rounded-xl p-4 flex-row items-center justify-center"
              style={{ backgroundColor: '#2D5F3F' }}
            >
              <Text className="text-2xl mr-2">🗺️</Text>
              <View>
                <Text className="text-white font-bold text-sm">Map View</Text>
                <Text className="text-white text-xs opacity-90">Find nearby</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Location Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedLocation(null)}
              className={`px-4 py-2 rounded-full border ${
                !selectedLocation ? 'bg-primary border-primary' : 'bg-surface border-border'
              }`}
            >
              <Text className={`text-sm font-medium ${
                !selectedLocation ? 'text-background' : 'text-foreground'
              }`}>
                All Locations
              </Text>
            </TouchableOpacity>
            {['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'].map((location) => (
              <TouchableOpacity
                key={location}
                onPress={() => setSelectedLocation(location)}
                className={`px-4 py-2 rounded-full border ${
                  selectedLocation === location ? 'bg-primary border-primary' : 'bg-surface border-border'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  selectedLocation === location ? 'text-background' : 'text-foreground'
                }`}>
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
            <Text className="text-lg font-bold text-foreground">
              {selectedCategory || selectedLocation || searchQuery ? 'Search Results' : 'Featured Artisans'}
            </Text>
            {(selectedCategory || selectedLocation) && (
              <TouchableOpacity onPress={() => {
                setSelectedCategory(null);
                setSelectedLocation(null);
                setSearchQuery('');
              }}>
                <Text className="text-sm text-error font-medium">Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
          {(selectedCategory || selectedLocation || searchQuery) && (
            <View className="px-6 mb-2">
              <Text className="text-sm text-muted">
                {filteredArtisans.length} artisan{filteredArtisans.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}
          {loadingArtisans ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#0a7ea4" />
              <Text className="text-muted text-sm mt-2">Loading artisans...</Text>
            </View>
          ) : filteredArtisans.length > 0 ? (
            <FlatList
              horizontal
              data={filteredArtisans}
              renderItem={renderArtisanCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          ) : (
            <View className="items-center justify-center py-8 px-6">
              <Text className="text-muted text-sm text-center">No artisans found. Please check your database setup.</Text>
            </View>
          )}
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
