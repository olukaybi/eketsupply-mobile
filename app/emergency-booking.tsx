import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const SERVICE_CATEGORIES = [
  { id: 'plumber', name: 'Plumber', icon: '🔧' },
  { id: 'electrician', name: 'Electrician', icon: '⚡' },
  { id: 'carpenter', name: 'Carpenter', icon: '🪚' },
  { id: 'mechanic', name: 'Mechanic', icon: '🔩' },
  { id: 'painter', name: 'Painter', icon: '🎨' },
  { id: 'welder', name: 'Welder', icon: '🔥' },
];

interface EmergencyArtisan {
  id: string;
  name: string;
  business_name: string;
  rating: number;
  distance_km: number;
  avg_response_minutes: number | null;
  phone: string;
}

export default function EmergencyBookingScreen() {
  const colors = useColors();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [availableArtisans, setAvailableArtisans] = useState<EmergencyArtisan[]>([]);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to find nearby artisans.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
  };

  const handleFindArtisans = async () => {
    if (!selectedCategory) {
      Alert.alert('Select Service', 'Please select the type of service you need.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Describe Issue', 'Please describe your emergency briefly.');
      return;
    }

    if (!location) {
      Alert.alert('Location Required', 'Getting your location...');
      await getLocation();
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSearching(true);

    try {
      // Call API to find emergency artisans
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/emergency/find-artisans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          description,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableArtisans(data.artisans || []);
        
        if (data.artisans && data.artisans.length > 0) {
          Alert.alert(
            'Artisans Found!',
            `Found ${data.artisans.length} available artisan${data.artisans.length > 1 ? 's' : ''} nearby. They will be notified of your emergency request.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'No Artisans Available',
            'No artisans are currently available for emergency service in your area. Try expanding your search radius or try again later.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error finding emergency artisans:', error);
      Alert.alert('Error', 'Could not find available artisans. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleBookArtisan = async (artisan: EmergencyArtisan) => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      'Confirm Emergency Booking',
      `Book ${artisan.business_name || artisan.name} for emergency service?\n\n⚠️ Emergency bookings have a 50% premium fee.\n\nThe artisan will arrive within 2 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking',
          onPress: async () => {
            setLoading(true);
            try {
              // Create emergency booking
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/emergency/create-booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  artisan_id: artisan.id,
                  category: selectedCategory,
                  description,
                  latitude: location?.coords.latitude,
                  longitude: location?.coords.longitude,
                }),
              });

              if (response.ok) {
                Alert.alert(
                  'Emergency Booking Confirmed!',
                  `${artisan.business_name || artisan.name} has been notified and will arrive within 2 hours.\n\nYou can track their arrival in your bookings.`,
                  [
                    {
                      text: 'View Bookings',
                      onPress: () => router.replace('/(tabs)'),
                    },
                  ]
                );
              }
            } catch (error) {
              console.error('Error creating emergency booking:', error);
              Alert.alert('Error', 'Could not create booking. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="items-center mb-6">
          <View 
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <Text className="text-4xl">🚨</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Need Help Now?
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            Get an artisan within 2 hours (+50% emergency fee)
          </Text>
        </View>

        {/* Service Category Selection */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">
            What do you need?
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {SERVICE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: selectedCategory === category.id 
                    ? colors.primary 
                    : colors.surface,
                  borderWidth: 1,
                  borderColor: selectedCategory === category.id 
                    ? colors.primary 
                    : colors.border,
                }}
              >
                <Text className="text-xl mr-2">{category.icon}</Text>
                <Text
                  className="font-semibold"
                  style={{
                    color: selectedCategory === category.id 
                      ? 'white' 
                      : colors.foreground,
                  }}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">
            Describe the emergency
          </Text>
          <TextInput
            className="rounded-xl p-4 text-base"
            style={{
              backgroundColor: colors.surface,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
            placeholder="E.g., Burst pipe flooding kitchen, need immediate help"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Find Artisans Button */}
        <TouchableOpacity
          onPress={handleFindArtisans}
          disabled={searching || loading}
          className="rounded-full py-4 items-center mb-6"
          style={{
            backgroundColor: searching || loading ? colors.muted : colors.error,
            opacity: searching || loading ? 0.6 : 1,
          }}
        >
          {searching ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold ml-2">Finding Available Artisans...</Text>
            </View>
          ) : (
            <Text className="text-white text-lg font-semibold">
              Find Available Artisans
            </Text>
          )}
        </TouchableOpacity>

        {/* Available Artisans */}
        {availableArtisans.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">
              Available Now ({availableArtisans.length})
            </Text>
            {availableArtisans.map((artisan) => (
              <View
                key={artisan.id}
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">
                      {artisan.business_name || artisan.name}
                    </Text>
                    <View className="flex-row items-center mt-1 gap-3">
                      <View className="flex-row items-center">
                        <Text className="text-base mr-1">⭐</Text>
                        <Text className="text-sm font-semibold text-foreground">
                          {artisan.rating.toFixed(1)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-base mr-1">📍</Text>
                        <Text className="text-sm font-semibold text-foreground">
                          {artisan.distance_km.toFixed(1)}km
                        </Text>
                      </View>
                      {artisan.avg_response_minutes && artisan.avg_response_minutes <= 60 && (
                        <View 
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: colors.success + '20' }}
                        >
                          <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                            Fast Response
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleBookArtisan(artisan)}
                  disabled={loading}
                  className="rounded-full py-3 items-center"
                  style={{
                    backgroundColor: loading ? colors.muted : colors.primary,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <Text className="text-white font-semibold">
                    Book for Emergency
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
