import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const SERVICE_CATEGORIES = [
  { id: 'plumber', name: 'Plumber', icon: '🔧', description: 'Burst pipe, leak, blocked drain' },
  { id: 'electrician', name: 'Electrician', icon: '⚡', description: 'Power outage, faulty wiring' },
  { id: 'carpenter', name: 'Carpenter', icon: '🪚', description: 'Broken door, furniture damage' },
  { id: 'mechanic', name: 'Mechanic', icon: '🔩', description: 'Vehicle breakdown, engine fault' },
  { id: 'painter', name: 'Painter', icon: '🎨', description: 'Urgent touch-up or damage repair' },
  { id: 'welder', name: 'Welder', icon: '🔥', description: 'Gate, fence, metal structure' },
];

const PREMIUM_MULTIPLIER = 1.5;

interface EmergencyArtisan {
  id: string;
  name: string;
  avatar_url: string | null;
  category: string;
  rating: number | null;
  review_count: number | null;
  hourly_rate: number | null;
  response_time_minutes: number | null;
  is_available: boolean;
}

export default function EmergencyBookingScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const [step, setStep] = useState<'form' | 'artisans' | 'done'>('form');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [searching, setSearching] = useState(false);
  const [availableArtisans, setAvailableArtisans] = useState<EmergencyArtisan[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<EmergencyArtisan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detectLocation = async () => {
    try {
      setDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enter your location manually.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (address) {
        const parts = [address.street, address.district, address.city].filter(Boolean);
        setLocationText(parts.join(', '));
      }
    } catch {
      Alert.alert('Location Error', 'Could not detect location. Please enter manually.');
    } finally {
      setDetectingLocation(false);
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
    if (!locationText.trim()) {
      Alert.alert('Location Required', 'Please enter or detect your location.');
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('artisans')
        .select('id, name, avatar_url, category, rating, review_count, hourly_rate, response_time_minutes, is_available')
        .ilike('category', `%${selectedCategory}%`)
        .eq('is_available', true)
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAvailableArtisans(data ?? []);
      setStep('artisans');
    } catch (err) {
      console.error('Error finding artisans:', err);
      Alert.alert('Error', 'Could not find available artisans. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectArtisan = (artisan: EmergencyArtisan) => {
    setSelectedArtisan(artisan);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmBooking = async () => {
    if (!selectedArtisan) {
      Alert.alert('Select Artisan', 'Please select an artisan to continue.');
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book a service.');
      router.push('/auth/sign-in');
      return;
    }

    Alert.alert(
      'Confirm Emergency Booking',
      `Book ${selectedArtisan.name} for emergency service?\n\n⚠️ Emergency bookings carry a 50% premium fee.\n\nThe artisan will aim to arrive within 2 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking',
          onPress: async () => {
            setSubmitting(true);
            try {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.openId)
                .single();

              if (!profile) throw new Error('Profile not found');

              const emergencyRate = selectedArtisan.hourly_rate
                ? Math.round(selectedArtisan.hourly_rate * PREMIUM_MULTIPLIER)
                : null;

              const { data: booking, error } = await supabase
                .from('bookings')
                .insert({
                  customer_id: profile.id,
                  artisan_id: selectedArtisan.id,
                  booking_type: 'instant',
                  service_description: `🚨 EMERGENCY: ${description}`,
                  preferred_date: new Date().toISOString(),
                  location: locationText,
                  payment_method: 'paystack_split',
                  estimated_price: emergencyRate,
                  customer_notes: `Emergency booking — Category: ${selectedCategory}. Premium rate applies (${PREMIUM_MULTIPLIER}×).`,
                  status: 'pending',
                })
                .select('id')
                .single();

              if (error) throw error;

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              setStep('done');

              setTimeout(() => {
                if (booking?.id) {
                  router.replace(`/booking/confirmation?bookingId=${booking.id}` as never);
                } else {
                  router.replace('/(tabs)/bookings');
                }
              }, 3000);
            } catch (err) {
              console.error('Emergency booking error:', err);
              Alert.alert('Error', 'Failed to submit emergency booking. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // handleBookArtisan replaced by handleConfirmBooking above

  // ─── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ fontSize: 72 }}>🚨</Text>
          <Text className="text-2xl font-bold text-foreground text-center">Request Sent!</Text>
          <Text className="text-base text-muted text-center">
            Your emergency request has been sent to {selectedArtisan?.name}.{' '}
            They have been notified and should respond within 30 minutes.
          </Text>
          <View style={{ backgroundColor: '#FFF3E0', borderRadius: 16, padding: 16, width: '100%' }}>
            <Text style={{ color: '#E65100', fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
              ⏱ Expected Response: Within 30 minutes
            </Text>
            <Text style={{ color: '#E65100', textAlign: 'center', fontSize: 13 }}>
              Premium rate applies: 1.5× standard pricing
            </Text>
          </View>
          <ActivityIndicator color="#1B5E20" style={{ marginTop: 16 }} />
          <Text className="text-sm text-muted">Redirecting to booking details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Artisan selection ─────────────────────────────────────────────────────
  if (step === 'artisans') {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setStep('form')} style={{ marginRight: 12, padding: 4 }}>
              <Text style={{ fontSize: 22 }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-foreground">Available Now</Text>
              <Text className="text-sm text-muted">Select an artisan for immediate help</Text>
            </View>
          </View>

          <View style={{ backgroundColor: '#FFF3E0', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
            <Text style={{ color: '#E65100', fontSize: 13, fontWeight: '600', flex: 1 }}>
              Emergency rate: 1.5× standard pricing applies. Artisans are notified instantly.
            </Text>
          </View>

          {availableArtisans.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Text style={{ fontSize: 48 }}>😔</Text>
              <Text className="text-lg font-semibold text-foreground mt-3 mb-2">No Artisans Available</Text>
              <Text className="text-muted text-center mb-6">
                No specialists are currently available. Try a different category or check back shortly.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#1B5E20', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                onPress={() => setStep('form')}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Try Another Category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text className="text-sm text-muted mb-3">
                {availableArtisans.length} artisan{availableArtisans.length !== 1 ? 's' : ''} available
              </Text>

              {availableArtisans.map(artisan => {
                const isSelected = selectedArtisan?.id === artisan.id;
                const emergencyRate = artisan.hourly_rate
                  ? Math.round(artisan.hourly_rate * PREMIUM_MULTIPLIER)
                  : null;

                return (
                  <TouchableOpacity
                    key={artisan.id}
                    onPress={() => handleSelectArtisan(artisan)}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#1B5E20' : colors.border,
                      backgroundColor: isSelected ? '#F0F7F0' : colors.surface,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {artisan.avatar_url ? (
                        <Image
                          source={{ uri: artisan.avatar_url }}
                          style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 52, height: 52, borderRadius: 26, marginRight: 12,
                            backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                            {artisan.name?.[0] ?? '?'}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text className="font-bold text-foreground text-base">{artisan.name}</Text>
                          {isSelected && (
                            <View style={{ backgroundColor: '#1B5E20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>SELECTED</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                          <Text style={{ color: '#E65100', fontSize: 13 }}>
                            ★ {artisan.rating?.toFixed(1) ?? 'New'} ({artisan.review_count ?? 0})
                          </Text>
                          <Text className="text-muted text-xs">•</Text>
                          <Text className="text-muted text-xs">
                            ~{artisan.response_time_minutes ?? 30} min response
                          </Text>
                        </View>
                        {emergencyRate ? (
                          <Text style={{ color: '#E65100', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                            Emergency rate: ₦{emergencyRate.toLocaleString()}/hr
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={handleConfirmBooking}
                disabled={!selectedArtisan || submitting}
                style={{
                  backgroundColor: selectedArtisan ? '#E65100' : colors.muted,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    🚨 Send Emergency Request
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-foreground">Emergency Booking</Text>
            <Text className="text-sm text-muted">Get help within 2 hours</Text>
          </View>
        </View>

        {/* Urgent Banner */}
        <View style={{ backgroundColor: '#FFF3E0', borderRadius: 16, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 28 }}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#E65100', fontWeight: '700', fontSize: 15 }}>Emergency Service</Text>
            <Text style={{ color: '#E65100', fontSize: 12 }}>
              Verified artisans notified instantly. Premium rate: 1.5× standard pricing.
            </Text>
          </View>
        </View>

        {/* Category Selection */}
        <Text className="text-sm font-semibold text-foreground mb-3">What do you need help with?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {SERVICE_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                style={{
                  width: '47%',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 2,
                  borderColor: isSelected ? '#E65100' : colors.border,
                  backgroundColor: isSelected ? '#FFF3E0' : colors.surface,
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 6 }}>{category.icon}</Text>
                <Text style={{ fontWeight: '700', color: isSelected ? '#E65100' : colors.foreground, fontSize: 14 }}>
                  {category.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Problem Description */}
        <Text className="text-sm font-semibold text-foreground mb-2">Briefly describe the problem</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Burst pipe under kitchen sink, water flooding floor..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          maxLength={200}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            color: colors.foreground,
            minHeight: 80,
            textAlignVertical: 'top',
            backgroundColor: colors.surface,
            marginBottom: 20,
          }}
        />

        {/* Location */}
        <Text className="text-sm font-semibold text-foreground mb-2">Your location</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <TextInput
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Enter your address or area"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 14,
              color: colors.foreground,
              backgroundColor: colors.surface,
            }}
          />
          <TouchableOpacity
            onPress={detectLocation}
            disabled={detectingLocation}
            style={{
              backgroundColor: '#1B5E20',
              borderRadius: 12,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            {detectingLocation ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontSize: 18 }}>📍</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Find Artisans Button */}
        <TouchableOpacity
          onPress={handleFindArtisans}
          disabled={searching || !selectedCategory || !description.trim() || !locationText.trim()}
          style={{
            backgroundColor:
              !searching && selectedCategory && description.trim() && locationText.trim()
                ? '#E65100'
                : colors.muted,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          {searching ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="white" size="small" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Finding Available Artisans...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              🔍 Find Available Artisans
            </Text>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text className="text-xs text-muted text-center mt-4">
          Emergency bookings carry a 1.5× premium rate. Standard EketSupply 85/15 payment split applies.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
