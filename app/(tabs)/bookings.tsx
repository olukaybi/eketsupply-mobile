import { useState, useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { notifyBookingAccepted, notifyBookingRejected, notifyBookingCompleted } from "@/lib/notification-service";
import { ReviewModal } from "@/components/review-modal";
import type { RealtimeChannel } from "@supabase/supabase-js";

type BookingStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";
type TabType = "pending" | "active" | "completed";
type UserType = "customer" | "artisan";

type Booking = {
  id: string;
  customer_id: string;
  artisan_id: string;
  booking_type: "quote" | "instant";
  status: BookingStatus;
  service_description: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  estimated_price: number | null;
  payment_method: string;
  customer_notes: string | null;
  created_at: string;
  customer: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  artisan: {
    id: string;
    service_category: string;
    rating: number;
    profiles: {
      full_name: string;
      phone: string | null;
    } | null;
  } | null;
  service: {
    name: string;
    price_min: number;
    price_max: number;
  } | null;
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-warning/20",
  accepted: "bg-primary/20",
  completed: "bg-success/20",
  rejected: "bg-error/20",
  cancelled: "bg-muted/20",
};

const STATUS_TEXT_COLORS: Record<BookingStatus, string> = {
  pending: "text-warning",
  accepted: "text-primary",
  completed: "text-success",
  rejected: "text-error",
  cancelled: "text-muted",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "⏳ Pending",
  accepted: "✅ Accepted",
  completed: "✅ Completed",
  rejected: "❌ Rejected",
  cancelled: "🚫 Cancelled",
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<UserType>("customer");
  const [artisanRowId, setArtisanRowId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ─── Resolve profile row id and artisan row id ───────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;
      setProfileId(profile.id);

      const { data: artisan } = await supabase
        .from("artisans")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (artisan) {
        setArtisanRowId(artisan.id);
        setUserType("artisan");
      } else {
        setUserType("customer");
      }
    })();
  }, [user]);

  // ─── Fetch bookings ───────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    if (!user || !profileId) return;

    try {
      setLoading(true);

      let statuses: BookingStatus[] = [];
      if (activeTab === "pending") statuses = ["pending"];
      else if (activeTab === "active") statuses = ["accepted"];
      else statuses = ["completed", "rejected", "cancelled"];

      let query;

      if (userType === "artisan" && artisanRowId) {
        query = supabase
          .from("bookings")
          .select(`
            *,
            customer:profiles!bookings_customer_id_fkey(full_name, phone, avatar_url),
            service:services(name, price_min, price_max)
          `)
          .eq("artisan_id", artisanRowId)
          .in("status", statuses)
          .order("created_at", { ascending: false });
      } else {
        query = supabase
          .from("bookings")
          .select(`
            *,
            artisan:artisans!bookings_artisan_id_fkey(
              id,
              service_category,
              rating,
              profiles!artisans_profile_id_fkey(full_name, phone)
            ),
            service:services(name, price_min, price_max)
          `)
          .eq("customer_id", profileId)
          .in("status", statuses)
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bookings:", error.message);
        Alert.alert("Error", "Could not load bookings. Please try again.");
        return;
      }

      setBookings((data as Booking[]) || []);
    } catch (err) {
      console.error("fetchBookings error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, profileId, userType, artisanRowId, activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ─── Real-time subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!profileId) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const filter =
      userType === "artisan" && artisanRowId
        ? `artisan_id=eq.${artisanRowId}`
        : `customer_id=eq.${profileId}`;

    const channel = supabase
      .channel(`bookings:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter,
        },
        () => {
          // Re-fetch on any change (insert, update, delete)
          fetchBookings();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, userType, artisanRowId, fetchBookings]);

  // ─── Unread message counts ────────────────────────────────────────────────
  useEffect(() => {
    if (!bookings.length || !profileId) return;

    (async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        bookings.map(async (booking) => {
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("booking_id", booking.id)
            .eq("read", false)
            .neq("sender_id", profileId);
          if (count && count > 0) counts[booking.id] = count;
        })
      );
      setUnreadCounts(counts);
    })();
  }, [bookings, profileId]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function handleCancelBooking(bookingId: string) {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("bookings")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", bookingId);
          if (error) Alert.alert("Error", "Failed to cancel booking");
          else {
            Alert.alert("Cancelled", "Your booking has been cancelled.");
            fetchBookings();
          }
        },
      },
    ]);
  }

  async function handleAcceptBooking(bookingId: string) {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      const { error } = await supabase
        .from("bookings")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      if (error) { Alert.alert("Error", "Failed to accept booking"); return; }

      const artisanName = (booking.artisan?.profiles as any)?.full_name || "Your artisan";
      await notifyBookingAccepted(booking.customer_id, artisanName, booking.service_description, bookingId);
      Alert.alert("Accepted!", "Customer has been notified.");
      fetchBookings();
    } catch (err) {
      console.error("handleAcceptBooking:", err);
    }
  }

  async function handleRejectBooking(bookingId: string) {
    Alert.alert("Reject Booking", "Are you sure you want to reject this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          const booking = bookings.find((b) => b.id === bookingId);
          if (!booking) return;

          const { error } = await supabase
            .from("bookings")
            .update({ status: "rejected", updated_at: new Date().toISOString() })
            .eq("id", bookingId);

          if (error) { Alert.alert("Error", "Failed to reject booking"); return; }

          const artisanName = (booking.artisan?.profiles as any)?.full_name || "Artisan";
          await notifyBookingRejected(booking.customer_id, artisanName, booking.service_description, bookingId);
          Alert.alert("Rejected", "The customer has been notified.");
          fetchBookings();
        },
      },
    ]);
  }

  async function handleCompleteBooking(bookingId: string) {
    Alert.alert("Complete Job", "Mark this job as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          const booking = bookings.find((b) => b.id === bookingId);
          if (!booking) return;

          const { error } = await supabase
            .from("bookings")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId);

          if (error) { Alert.alert("Error", "Failed to complete booking"); return; }

          const artisanName = (booking.artisan?.profiles as any)?.full_name || "Artisan";
          await notifyBookingCompleted(booking.customer_id, artisanName, booking.service_description, bookingId);
          Alert.alert("Done!", "Job marked as completed. Customer has been notified.");
          fetchBookings();
        },
      },
    ]);
  }

  // ─── Render helpers ───────────────────────────────────────────────────────
  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function renderBookingCard({ item: booking }: { item: Booking }) {
    const personName =
      userType === "artisan"
        ? (booking.customer as any)?.full_name || "Customer"
        : (booking.artisan?.profiles as any)?.full_name || "Artisan";

    const personInitial = personName[0]?.toUpperCase() || "?";

    return (
      <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
        {/* Header row */}
        <View className="flex-row items-center justify-between mb-3">
          <View
            className={`px-3 py-1 rounded-full ${
              booking.booking_type === "instant" ? "bg-primary/20" : "bg-warning/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                booking.booking_type === "instant" ? "text-primary" : "text-warning"
              }`}
            >
              {booking.booking_type === "instant" ? "⚡ Instant" : "💬 Quote"}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${STATUS_COLORS[booking.status]}`}>
            <Text className={`text-xs font-semibold ${STATUS_TEXT_COLORS[booking.status]}`}>
              {STATUS_LABELS[booking.status]}
            </Text>
          </View>
        </View>

        {/* Person info */}
        <View className="flex-row items-center mb-3">
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
            <Text className="text-xl font-bold text-primary">{personInitial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{personName}</Text>
            {userType === "customer" && booking.artisan && (
              <View className="flex-row items-center mt-0.5">
                <Text className="text-sm text-muted mr-2">{booking.artisan.service_category}</Text>
                <Text className="text-sm text-warning">⭐ {booking.artisan.rating?.toFixed(1)}</Text>
              </View>
            )}
            {userType === "artisan" && (booking.customer as any)?.phone && (
              <Text className="text-sm text-muted">{(booking.customer as any).phone}</Text>
            )}
          </View>
          <Text className="text-xs text-muted">{formatDate(booking.created_at)}</Text>
        </View>

        {/* Service details */}
        <View className="bg-background rounded-xl p-3 mb-3">
          <Text className="text-sm font-semibold text-foreground mb-1">Service</Text>
          <Text className="text-sm text-foreground mb-2">{booking.service_description}</Text>

          <View className="flex-row items-center mb-1">
            <Text className="text-sm mr-2">📅</Text>
            <Text className="text-sm text-muted">
              {formatDate(booking.preferred_date)} at {booking.preferred_time}
            </Text>
          </View>

          <View className="flex-row items-center mb-1">
            <Text className="text-sm mr-2">📍</Text>
            <Text className="text-sm text-muted">{booking.location}</Text>
          </View>

          {booking.estimated_price ? (
            <View className="flex-row items-center">
              <Text className="text-sm mr-2">💰</Text>
              <Text className="text-sm font-semibold text-foreground">
                ₦{booking.estimated_price.toLocaleString()}
              </Text>
              <Text className="text-xs text-muted ml-2 capitalize">
                ({booking.payment_method?.replace("_", " ") || "TBD"})
              </Text>
            </View>
          ) : null}
        </View>

        {/* Customer notes */}
        {booking.customer_notes ? (
          <View className="bg-warning/10 rounded-xl p-3 mb-3">
            <Text className="text-xs font-semibold text-muted mb-1">Notes</Text>
            <Text className="text-sm text-foreground">{booking.customer_notes}</Text>
          </View>
        ) : null}

        {/* Chat button */}
        <View className="relative">
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: "#1B5E20" }}
            className="py-3 rounded-xl flex-row items-center justify-center gap-2"
            onPress={() => router.push(`/chat/${booking.id}` as any)}
          >
            <Text className="text-lg">💬</Text>
            <Text className="font-semibold" style={{ color: "#1B5E20" }}>
              Chat
            </Text>
          </TouchableOpacity>
          {unreadCounts[booking.id] > 0 && (
            <View className="absolute -top-2 -right-2 bg-error w-6 h-6 rounded-full items-center justify-center">
              <Text className="text-xs font-bold text-background">
                {unreadCounts[booking.id] > 9 ? "9+" : unreadCounts[booking.id]}
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        {userType === "artisan" && activeTab === "pending" && (
          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity
              className="flex-1 bg-error/10 py-3 rounded-xl"
              onPress={() => handleRejectBooking(booking.id)}
            >
              <Text className="text-center font-semibold text-error">Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl"
              style={{ backgroundColor: "#1B5E20" }}
              onPress={() => handleAcceptBooking(booking.id)}
            >
              <Text className="text-center font-semibold text-white">Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {userType === "artisan" && activeTab === "active" && (
          <TouchableOpacity
            className="bg-success py-3 rounded-xl mt-2"
            onPress={() => handleCompleteBooking(booking.id)}
          >
            <Text className="text-center font-semibold text-white">✅ Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {userType === "customer" && activeTab === "pending" && (
          <TouchableOpacity
            className="bg-error/10 py-3 rounded-xl mt-2"
            onPress={() => handleCancelBooking(booking.id)}
          >
            <Text className="text-center font-semibold text-error">Cancel Request</Text>
          </TouchableOpacity>
        )}

        {activeTab === "completed" && userType === "customer" && booking.status === "completed" && (
          <TouchableOpacity
            className="py-3 rounded-xl mt-2"
            style={{ backgroundColor: "#1B5E20" }}
            onPress={() => {
              setSelectedBooking(booking);
              setReviewModalVisible(true);
            }}
          >
            <Text className="text-center font-semibold text-white">⭐ Leave a Review</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ─── Not signed in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-4xl mb-4">📋</Text>
        <Text className="text-lg font-semibold text-foreground mb-2">Sign in to view bookings</Text>
        <Text className="text-sm text-muted text-center mb-6">
          Track your booking requests and manage your jobs
        </Text>
        <TouchableOpacity
          className="px-8 py-3 rounded-full"
          style={{ backgroundColor: "#1B5E20" }}
          onPress={() => router.push("/auth/sign-in")}
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-surface border-b border-border">
        <Text className="text-2xl font-bold text-foreground">
          {userType === "artisan" ? "My Jobs" : "My Bookings"}
        </Text>
        <Text className="text-sm text-muted mt-0.5">
          {userType === "artisan"
            ? "Manage incoming requests and active jobs"
            : "Track your service requests"}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-surface border-b border-border">
        {(["pending", "active", "completed"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-3"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab ? "#1B5E20" : "transparent",
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className="text-center font-semibold capitalize"
              style={{ color: activeTab === tab ? "#1B5E20" : "#687076" }}
            >
              {tab === "completed" ? "History" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text className="text-muted mt-3">Loading bookings…</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(); }}
              tintColor="#1B5E20"
            />
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-5xl mb-4">📭</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No bookings yet</Text>
              <Text className="text-sm text-muted text-center px-8">
                {activeTab === "pending" &&
                  (userType === "artisan"
                    ? "New job requests will appear here"
                    : "Your pending requests will appear here")}
                {activeTab === "active" &&
                  (userType === "artisan"
                    ? "Accepted jobs will appear here"
                    : "Your active bookings will appear here")}
                {activeTab === "completed" && "Completed bookings will appear here"}
              </Text>
              {userType === "customer" && activeTab === "pending" && (
                <TouchableOpacity
                  className="mt-6 px-6 py-3 rounded-full"
                  style={{ backgroundColor: "#1B5E20" }}
                  onPress={() => router.push("/")}
                >
                  <Text className="text-white font-semibold">Find an Artisan</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedBooking(null);
            fetchBookings();
          }}
          bookingId={selectedBooking.id}
          artisanId={selectedBooking.artisan_id}
          customerId={selectedBooking.customer_id}
          artisanName={(selectedBooking.artisan?.profiles as any)?.full_name || "Artisan"}
          serviceDescription={selectedBooking.service_description}
        />
      )}
    </ScreenContainer>
  );
}
