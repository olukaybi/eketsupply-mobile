import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { notifyBookingAccepted, notifyBookingRejected, notifyBookingCompleted } from "@/lib/notification-service";
import { ReviewModal } from "@/components/review-modal";

type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
type TabType = 'pending' | 'active' | 'completed';
type UserType = 'customer' | 'artisan';

type Booking = {
  id: string;
  customer_id: string;
  artisan_id: string;
  booking_type: 'quote' | 'instant';
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
  };
  artisan: {
    id: string;
    service_category: string;
    rating: number;
    profiles: {
      full_name: string;
      phone: string | null;
    };
  };
  service: {
    name: string;
    price: string;
  } | null;
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<UserType>('customer');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      checkUserType();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, activeTab, userType]);

  async function checkUserType() {
    try {
      // Check if user is an artisan
      const { data: artisanData } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      setUserType(artisanData ? 'artisan' : 'customer');
    } catch (err) {
      console.error('Error checking user type:', err);
      setUserType('customer');
    }
  }

  async function fetchBookings() {
    try {
      setLoading(true);
      
      // Determine which statuses to fetch based on active tab
      let statuses: BookingStatus[] = [];
      if (activeTab === 'pending') {
        statuses = ['pending'];
      } else if (activeTab === 'active') {
        statuses = ['accepted'];
      } else {
        statuses = ['completed', 'rejected', 'cancelled'];
      }

      if (userType === 'artisan') {
        // Fetch bookings for artisan
        const { data: artisanData } = await supabase
          .from('artisans')
          .select('id')
          .eq('profile_id', user?.id)
          .single();

        if (!artisanData) {
          setBookings([]);
          return;
        }

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            customer:profiles!bookings_customer_id_fkey(full_name, phone, avatar_url),
            service:services(name, price)
          `)
          .eq('artisan_id', artisanData.id)
          .in('status', statuses)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching artisan bookings:', error);
          return;
        }

        setBookings(data || []);
      } else {
        // Fetch bookings for customer
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            artisan:artisans!bookings_artisan_id_fkey(
              id,
              service_category,
              rating,
              profiles!artisans_profile_id_fkey(full_name, phone)
            ),
            service:services(name, price)
          `)
          .eq('customer_id', user?.id)
          .in('status', statuses)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching customer bookings:', error);
          return;
        }

        setBookings(data || []);
      }
    } catch (err) {
      console.error('Error in fetchBookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchUnreadCounts() {
    try {
      if (!bookings.length) return;

      const counts: Record<string, number> = {};
      
      for (const booking of bookings) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .eq('read', false)
          .neq('sender_id', user?.id);

        if (count && count > 0) {
          counts[booking.id] = count;
        }
      }

      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  }

  useEffect(() => {
    if (bookings.length > 0) {
      fetchUnreadCounts();
    }
  }, [bookings]);

  async function handleCancelBooking(bookingId: string) {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ 
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

              if (error) {
                Alert.alert('Error', 'Failed to cancel booking');
                return;
              }

              Alert.alert('Cancelled', 'Your booking has been cancelled.');
              fetchBookings();
            } catch (err) {
              console.error('Error cancelling booking:', err);
            }
          }
        }
      ]
    );
  }

  // Artisan-only functions
  async function handleAcceptBooking(bookingId: string) {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        Alert.alert('Error', 'Failed to accept booking');
        return;
      }

      const { data: artisanData } = await supabase
        .from('artisans')
        .select('profiles!artisans_profile_id_fkey(full_name)')
        .eq('profile_id', user?.id)
        .single();

      const artisanName = (artisanData?.profiles as any)?.full_name || 'Artisan';

      await notifyBookingAccepted(
        booking.customer_id,
        artisanName,
        booking.service_description,
        bookingId
      );

      Alert.alert('Success', 'Booking accepted! Customer has been notified.');
      fetchBookings();
    } catch (err) {
      console.error('Error accepting booking:', err);
      Alert.alert('Error', 'Something went wrong');
    }
  }

  async function handleRejectBooking(bookingId: string) {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const booking = bookings.find(b => b.id === bookingId);
              if (!booking) return;

              const { error } = await supabase
                .from('bookings')
                .update({ 
                  status: 'rejected',
                  updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

              if (error) {
                Alert.alert('Error', 'Failed to reject booking');
                return;
              }

              const { data: artisanData } = await supabase
                .from('artisans')
                .select('profiles!artisans_profile_id_fkey(full_name)')
                .eq('profile_id', user?.id)
                .single();

              const artisanName = (artisanData?.profiles as any)?.full_name || 'Artisan';

              await notifyBookingRejected(
                booking.customer_id,
                artisanName,
                booking.service_description,
                bookingId
              );

              Alert.alert('Booking Rejected', 'The customer has been notified.');
              fetchBookings();
            } catch (err) {
              console.error('Error rejecting booking:', err);
            }
          }
        }
      ]
    );
  }

  async function handleCompleteBooking(bookingId: string) {
    Alert.alert(
      'Complete Booking',
      'Mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const booking = bookings.find(b => b.id === bookingId);
              if (!booking) return;

              const { error } = await supabase
                .from('bookings')
                .update({ 
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

              if (error) {
                Alert.alert('Error', 'Failed to complete booking');
                return;
              }

              const { data: artisanData } = await supabase
                .from('artisans')
                .select('profiles!artisans_profile_id_fkey(full_name)')
                .eq('profile_id', user?.id)
                .single();

              const artisanName = (artisanData?.profiles as any)?.full_name || 'Artisan';

              await notifyBookingCompleted(
                booking.customer_id,
                artisanName,
                booking.service_description,
                bookingId
              );

              Alert.alert('Success', 'Job marked as completed! Customer has been notified.');
              fetchBookings();
            } catch (err) {
              console.error('Error completing booking:', err);
            }
          }
        }
      ]
    );
  }

  function onRefresh() {
    setRefreshing(true);
    fetchBookings();
  }

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-lg text-foreground mb-4">Please sign in to view bookings</Text>
        <TouchableOpacity 
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => router.push('/auth/sign-in')}
        >
          <Text className="text-background font-semibold">Sign In</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="p-4 bg-surface border-b border-border">
        <Text className="text-2xl font-bold text-foreground">
          {userType === 'artisan' ? 'My Bookings' : 'My Requests'}
        </Text>
        <Text className="text-sm text-muted mt-1">
          {userType === 'artisan' ? 'Manage your jobs and requests' : 'Track your booking requests'}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-surface border-b border-border">
        <TouchableOpacity
          className={`flex-1 py-3 border-b-2 ${activeTab === 'pending' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('pending')}
        >
          <Text className={`text-center font-semibold ${activeTab === 'pending' ? 'text-primary' : 'text-muted'}`}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 border-b-2 ${activeTab === 'active' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('active')}
        >
          <Text className={`text-center font-semibold ${activeTab === 'active' ? 'text-primary' : 'text-muted'}`}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 border-b-2 ${activeTab === 'completed' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('completed')}
        >
          <Text className={`text-center font-semibold ${activeTab === 'completed' ? 'text-primary' : 'text-muted'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="p-8 items-center">
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="text-muted mt-4">Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className="p-8 items-center">
            <Text className="text-6xl mb-4">📭</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">No bookings yet</Text>
            <Text className="text-muted text-center">
              {activeTab === 'pending' && (userType === 'artisan' ? 'New booking requests will appear here' : 'Your pending requests will appear here')}
              {activeTab === 'active' && (userType === 'artisan' ? 'Accepted jobs will appear here' : 'Your active bookings will appear here')}
              {activeTab === 'completed' && 'Completed bookings will appear here'}
            </Text>
          </View>
        ) : (
          <View className="p-4 gap-4">
            {bookings.map((booking) => (
              <View key={booking.id} className="bg-surface rounded-2xl p-4 border border-border">
                {/* Booking Type Badge */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className={`px-3 py-1 rounded-full ${booking.booking_type === 'instant' ? 'bg-primary/20' : 'bg-warning/20'}`}>
                    <Text className={`text-xs font-semibold ${booking.booking_type === 'instant' ? 'text-primary' : 'text-warning'}`}>
                      {booking.booking_type === 'instant' ? '⚡ Instant Booking' : '💬 Quote Request'}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* Person Info (Customer for artisan, Artisan for customer) */}
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-xl">
                      {userType === 'artisan' 
                        ? ((booking.customer as any)?.full_name?.[0] || '👤')
                        : ((booking.artisan?.profiles as any)?.full_name?.[0] || '👷')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {userType === 'artisan' 
                        ? ((booking.customer as any)?.full_name || 'Customer')
                        : ((booking.artisan?.profiles as any)?.full_name || 'Artisan')}
                    </Text>
                    {userType === 'customer' && booking.artisan && (
                      <View className="flex-row items-center mt-1">
                        <Text className="text-sm text-muted mr-2">{booking.artisan.service_category}</Text>
                        <Text className="text-sm text-warning">⭐ {booking.artisan.rating}</Text>
                      </View>
                    )}
                    {userType === 'artisan' && (booking.customer as any)?.phone && (
                      <Text className="text-sm text-muted">{(booking.customer as any).phone}</Text>
                    )}
                  </View>
                </View>

                {/* Service Details */}
                <View className="bg-background rounded-xl p-3 mb-3">
                  <Text className="text-sm font-semibold text-foreground mb-1">Service Requested</Text>
                  <Text className="text-base text-foreground mb-2">{booking.service_description}</Text>
                  
                  <View className="flex-row items-center mb-1">
                    <Text className="text-sm text-muted mr-2">📅</Text>
                    <Text className="text-sm text-muted">
                      {new Date(booking.preferred_date).toLocaleDateString()} at {booking.preferred_time}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center mb-1">
                    <Text className="text-sm text-muted mr-2">📍</Text>
                    <Text className="text-sm text-muted">{booking.location}</Text>
                  </View>
                  
                  {booking.estimated_price && (
                    <View className="flex-row items-center">
                      <Text className="text-sm text-muted mr-2">💰</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        ₦{booking.estimated_price.toLocaleString()}
                      </Text>
                      <Text className="text-sm text-muted ml-2">({booking.payment_method})</Text>
                    </View>
                  )}
                </View>

                {/* Customer Notes */}
                {booking.customer_notes && (
                  <View className="bg-warning/10 rounded-xl p-3 mb-3">
                    <Text className="text-xs font-semibold text-muted mb-1">Notes</Text>
                    <Text className="text-sm text-foreground">{booking.customer_notes}</Text>
                  </View>
                )}

                {/* Chat Button - Available for all bookings */}
                <View className="relative">
                  <TouchableOpacity
                    className="bg-surface border border-primary py-3 rounded-xl mt-2 flex-row items-center justify-center gap-2"
                    onPress={() => router.push(`/chat/${booking.id}`)}
                  >
                    <Text className="text-2xl">💬</Text>
                    <Text className="font-semibold text-primary">Chat</Text>
                  </TouchableOpacity>
                  {unreadCounts[booking.id] > 0 && (
                    <View className="absolute -top-1 -right-1 bg-error w-6 h-6 rounded-full items-center justify-center">
                      <Text className="text-xs font-bold text-background">
                        {unreadCounts[booking.id] > 9 ? '9+' : unreadCounts[booking.id]}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {userType === 'artisan' && activeTab === 'pending' && (
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                      className="flex-1 bg-error/10 py-3 rounded-xl"
                      onPress={() => handleRejectBooking(booking.id)}
                    >
                      <Text className="text-center font-semibold text-error">Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-primary py-3 rounded-xl"
                      onPress={() => handleAcceptBooking(booking.id)}
                    >
                      <Text className="text-center font-semibold text-background">Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {userType === 'artisan' && activeTab === 'active' && (
                  <TouchableOpacity
                    className="bg-success py-3 rounded-xl mt-2"
                    onPress={() => handleCompleteBooking(booking.id)}
                  >
                    <Text className="text-center font-semibold text-background">Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                {userType === 'customer' && activeTab === 'pending' && (
                  <TouchableOpacity
                    className="bg-error/10 py-3 rounded-xl mt-2"
                    onPress={() => handleCancelBooking(booking.id)}
                  >
                    <Text className="text-center font-semibold text-error">Cancel Request</Text>
                  </TouchableOpacity>
                )}

                {activeTab === 'completed' && (
                  <View>
                    <View className={`py-2 px-3 rounded-xl mt-2 ${
                      booking.status === 'completed' ? 'bg-success/20' : 
                      booking.status === 'rejected' ? 'bg-error/20' : 'bg-muted/20'
                    }`}>
                      <Text className={`text-center font-semibold ${
                        booking.status === 'completed' ? 'text-success' : 
                        booking.status === 'rejected' ? 'text-error' : 'text-muted'
                      }`}>
                        {booking.status === 'completed' && '✅ Completed'}
                        {booking.status === 'rejected' && '❌ Rejected'}
                        {booking.status === 'cancelled' && '🚫 Cancelled'}
                      </Text>
                    </View>
                    {userType === 'customer' && booking.status === 'completed' && (
                      <TouchableOpacity
                        className="bg-primary py-3 rounded-xl mt-2"
                        onPress={() => {
                          setSelectedBooking(booking);
                          setReviewModalVisible(true);
                        }}
                      >
                        <Text className="text-center font-semibold text-background">⭐ Leave a Review</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedBooking(null);
            fetchBookings(); // Refresh to show review was submitted
          }}
          bookingId={selectedBooking.id}
          artisanId={selectedBooking.artisan_id}
          customerId={selectedBooking.customer_id}
          artisanName={(selectedBooking.artisan?.profiles as any)?.full_name || 'Artisan'}
          serviceDescription={selectedBooking.service_description}
        />
      )}
    </ScreenContainer>
  );
}
