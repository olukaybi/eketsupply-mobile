import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';
import { trpc as _trpc } from '@/lib/trpc';

interface ArtisanMarker {
  id: string;
  name: string;
  business_name: string;
  category: string;
  rating: number;
  latitude: number;
  longitude: number;
  distance_km: number;
  avg_response_minutes: number | null;
}

const RADIUS_OPTIONS = [1, 5, 10, 25]; // kilometers

export default function MapViewScreen() {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [artisans, setArtisans] = useState<ArtisanMarker[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<ArtisanMarker | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyArtisans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, selectedRadius]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to find nearby artisans.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
      setLoading(false);
    }
  };

  const fetchNearbyArtisans = async () => {
    if (!location) return;

    try {
      // This would call your tRPC endpoint or Supabase function
      // For now, using mock data structure
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/artisans/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radius_km: selectedRadius,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setArtisans(data.artisans || []);
      }
    } catch (error) {
      console.error('Error fetching nearby artisans:', error);
      // For demo, set empty array
      setArtisans([]);
    }
  };

  const handleRadiusChange = async (radius: number) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedRadius(radius);
  };

  const handleMarkerPress = (artisan: ArtisanMarker) => {
    setSelectedArtisan(artisan);
    
    // Animate to marker
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: artisan.latitude,
        longitude: artisan.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const handleViewProfile = () => {
    if (selectedArtisan) {
      router.push(`/artisan/${selectedArtisan.id}`);
    }
  };

  const getResponseBadge = (minutes: number | null) => {
    if (!minutes) return null;
    
    if (minutes <= 60) return { text: '< 1hr', color: colors.success };
    if (minutes <= 1440) return { text: '< 24hrs', color: colors.warning };
    return { text: '< 48hrs', color: colors.muted };
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-muted">Getting your location...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!location) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-2xl font-bold text-foreground mb-4">Location Required</Text>
          <Text className="text-center text-muted mb-8">
            Enable location access to find nearby artisans on the map.
          </Text>
          <TouchableOpacity
            onPress={requestLocationPermission}
            className="rounded-full py-4 px-8"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">Enable Location</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const responseBadge = selectedArtisan ? getResponseBadge(selectedArtisan.avg_response_minutes) : null;

  return (
    <View className="flex-1">
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Radius circle */}
        <Circle
          center={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          radius={selectedRadius * 1000} // Convert km to meters
          strokeColor={colors.primary + '40'}
          fillColor={colors.primary + '10'}
        />

        {/* Artisan markers */}
        {artisans.map((artisan) => (
          <Marker
            key={artisan.id}
            coordinate={{
              latitude: artisan.latitude,
              longitude: artisan.longitude,
            }}
            title={artisan.business_name || artisan.name}
            description={`${artisan.category} • ${artisan.distance_km.toFixed(1)}km away`}
            onPress={() => handleMarkerPress(artisan)}
            pinColor={colors.accent}
          />
        ))}
      </MapView>

      {/* Radius selector */}
      <View 
        className="absolute top-4 left-4 right-4 rounded-2xl p-4"
        style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
      >
        <Text className="text-sm font-semibold text-foreground mb-3">Search Radius</Text>
        <View className="flex-row gap-2">
          {RADIUS_OPTIONS.map((radius) => (
            <TouchableOpacity
              key={radius}
              onPress={() => handleRadiusChange(radius)}
              className="flex-1 py-2 rounded-full items-center"
              style={{
                backgroundColor: selectedRadius === radius ? colors.primary : colors.surface,
              }}
            >
              <Text
                className="font-semibold"
                style={{ color: selectedRadius === radius ? 'white' : colors.muted }}
              >
                {radius}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text className="text-xs text-muted mt-2 text-center">
          {artisans.length} artisan{artisans.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Selected artisan card */}
      {selectedArtisan && (
        <View 
          className="absolute bottom-4 left-4 right-4 rounded-2xl p-4"
          style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                {selectedArtisan.business_name || selectedArtisan.name}
              </Text>
              <Text className="text-sm text-muted mt-1">{selectedArtisan.category}</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setSelectedArtisan(null)}
              className="p-2"
            >
              <Text className="text-muted text-xl">×</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-4 mb-4">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-1">⭐</Text>
              <Text className="font-semibold text-foreground">{selectedArtisan.rating.toFixed(1)}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Text className="text-2xl mr-1">📍</Text>
              <Text className="font-semibold text-foreground">{selectedArtisan.distance_km.toFixed(1)}km</Text>
            </View>

            {responseBadge && (
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: responseBadge.color + '20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: responseBadge.color }}>
                  {responseBadge.text}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleViewProfile}
            className="rounded-full py-3 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">View Profile & Book</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
