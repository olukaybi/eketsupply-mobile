import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";

// react-native-maps is native-only — guard for web
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

type BookingDetail = {
  id: string;
  service_description: string;
  location: string;
  preferred_date: string;
  preferred_time: string;
  artisan: {
    profiles: { full_name: string; phone?: string } | null;
    service_category: string;
    rating: number;
  } | null;
};

// Eket, Akwa Ibom default coords
const DEFAULT_COORDS = { latitude: 4.6527, longitude: 7.9199 };

export default function TrackArtisanScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const mapRef = useRef<any>(null);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerCoords, setCustomerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  // Simulate artisan location slightly offset from customer
  const [artisanCoords, setArtisanCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta] = useState<string>("Calculating…");
  const [status, setStatus] = useState<"en_route" | "arrived" | "started">("en_route");

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id, service_description, location, preferred_date, preferred_time,
          artisan:artisans(
            service_category, rating,
            profiles(full_name, phone)
          )
        `)
        .eq("id", bookingId)
        .single();
      if (data) setBooking(data as any);
      setLoading(false);
    })();
  }, [bookingId]);

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const customer = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCustomerCoords(customer);
        // Simulate artisan ~1.5 km away
        const artisan = {
          latitude: customer.latitude + 0.013,
          longitude: customer.longitude + 0.007,
        };
        setArtisanCoords(artisan);
        setEta("~8 min away");
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...customer,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }, 800);
        }, 500);
      } else {
        setCustomerCoords(DEFAULT_COORDS);
        setArtisanCoords({ latitude: DEFAULT_COORDS.latitude + 0.013, longitude: DEFAULT_COORDS.longitude + 0.007 });
        setEta("~8 min away");
      }
    })();
  }, []);

  // Simulate artisan moving closer every 10 seconds
  useEffect(() => {
    if (!artisanCoords || !customerCoords) return;
    const interval = setInterval(() => {
      setArtisanCoords((prev) => {
        if (!prev || !customerCoords) return prev;
        const latDiff = customerCoords.latitude - prev.latitude;
        const lngDiff = customerCoords.longitude - prev.longitude;
        const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        if (dist < 0.001) {
          setStatus("arrived");
          setEta("Arrived!");
          clearInterval(interval);
          return customerCoords;
        }
        const step = 0.002;
        const newLat = prev.latitude + (latDiff / dist) * step;
        const newLng = prev.longitude + (lngDiff / dist) * step;
        const newDist = Math.sqrt(
          (customerCoords.latitude - newLat) ** 2 + (customerCoords.longitude - newLng) ** 2
        );
        const mins = Math.max(1, Math.round(newDist * 1000 / 1.4));
        setEta(`~${mins} min away`);
        return { latitude: newLat, longitude: newLng };
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [artisanCoords, customerCoords]);

  const artisanName = (booking?.artisan?.profiles as any)?.full_name || "Your Artisan";
  const artisanPhone = (booking?.artisan?.profiles as any)?.phone;

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text className="text-muted mt-3">Loading tracking info…</Text>
      </ScreenContainer>
    );
  }

  // Web fallback
  if (Platform.OS === "web") {
    return (
      <ScreenContainer className="p-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text style={{ color: "#1B5E20", fontWeight: "600" }}>← Back</Text>
        </TouchableOpacity>
        <View className="items-center mt-12">
          <Text className="text-5xl mb-4">🗺️</Text>
          <Text className="text-xl font-bold text-foreground mb-2">Track Artisan</Text>
          <Text className="text-muted text-center mb-6">
            Live map tracking is available on the iOS and Android apps.
          </Text>
          <View className="bg-surface rounded-2xl p-5 w-full border border-border">
            <Text className="text-base font-semibold text-foreground mb-1">{artisanName}</Text>
            <Text className="text-sm text-muted mb-1">{booking?.artisan?.service_category}</Text>
            <Text className="text-sm text-muted">📅 {booking?.preferred_date} at {booking?.preferred_time}</Text>
            <Text className="text-sm text-muted mt-1">📍 {booking?.location}</Text>
          </View>
          {artisanPhone && (
            <TouchableOpacity
              className="mt-6 py-4 px-8 rounded-2xl"
              style={{ backgroundColor: "#1B5E20" }}
              onPress={() => Linking.openURL(`tel:${artisanPhone}`)}
            >
              <Text className="text-white font-semibold">📞 Call Artisan</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenContainer>
    );
  }

  const region = customerCoords
    ? { ...customerCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    : { ...DEFAULT_COORDS, latitudeDelta: 0.04, longitudeDelta: 0.04 };

  const statusColors: Record<string, string> = {
    en_route: "#F59E0B",
    arrived: "#22C55E",
    started: "#1B5E20",
  };
  const statusLabels: Record<string, string> = {
    en_route: "🚗 En Route",
    arrived: "✅ Arrived",
    started: "🔧 Job Started",
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Customer marker */}
        {customerCoords && (
          <Marker coordinate={customerCoords} title="Your Location" pinColor="#1B5E20" />
        )}
        {/* Artisan marker */}
        {artisanCoords && (
          <Marker
            coordinate={artisanCoords}
            title={artisanName}
            description={booking?.artisan?.service_category}
            pinColor="#F59E0B"
          />
        )}
        {/* Route line */}
        {customerCoords && artisanCoords && (
          <Polyline
            coordinates={[artisanCoords, customerCoords]}
            strokeColor="#1B5E20"
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* Back button overlay */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 56,
          left: 16,
          backgroundColor: "white",
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text style={{ fontWeight: "600", color: "#11181C" }}>← Back</Text>
      </TouchableOpacity>

      {/* Bottom info card */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: 36,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Status badge */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: statusColors[status] + "22",
              marginRight: 10,
            }}
          >
            <Text style={{ fontWeight: "700", color: statusColors[status], fontSize: 13 }}>
              {statusLabels[status]}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: "#687076", fontWeight: "600" }}>{eta}</Text>
        </View>

        {/* Artisan info */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#E8F5E9",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1B5E20" }}>
              {artisanName[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C" }}>{artisanName}</Text>
            <Text style={{ fontSize: 13, color: "#687076" }}>{booking?.artisan?.service_category}</Text>
          </View>
          <Text style={{ fontSize: 14, color: "#F59E0B" }}>
            ⭐ {booking?.artisan?.rating?.toFixed(1) ?? "—"}
          </Text>
        </View>

        {/* Service details */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 14,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 13, color: "#687076", marginBottom: 2 }}>Service</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#11181C" }}>
            {booking?.service_description}
          </Text>
          <Text style={{ fontSize: 13, color: "#687076", marginTop: 4 }}>
            📅 {booking?.preferred_date} at {booking?.preferred_time}
          </Text>
          <Text style={{ fontSize: 13, color: "#687076", marginTop: 2 }}>
            📍 {booking?.location}
          </Text>
        </View>

        {/* Call button */}
        {artisanPhone && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${artisanPhone}`)}
            style={{
              backgroundColor: "#1B5E20",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
              📞 Call {artisanName.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
