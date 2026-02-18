import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
type TabType = 'pending' | 'active' | 'completed';

type Booking = {
  id: string;
  customer_id: string;
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
  service: {
    name: string;
    price: string;
  } | null;
};

export default function ArtisanBookingsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, activeTab]);

  async function fetchBookings() {
    try {
      setLoading(true);
      
      // First get the artisan ID for the current user
      const { data: artisanData } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (!artisanData) {
        console.log('User is not an artisan');
        setBookings([]);
        return;
      }

      // Determine which statuses to fetch based on active tab
      let statuses: BookingStatus[] = [];
      if (activeTab === 'pending') {
        statuses = ['pending'];
      } else if (activeTab === 'active') {
        statuses = ['accepted'];
      } else {
        statuses = ['completed', 'rejected', 'cancelled'];
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
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (err) {
      console.error('Error in fetchBookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAcceptBooking(bookingId: string) {
    try {
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

      Alert.alert('Success', 'Booking accepted!');
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

              Alert.alert('Success', 'Job marked as completed!');
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
        <Text className="text-2xl font-bold text-foreground">My Bookings</Text>
        <Text className="text-sm text-muted mt-1">Manage your jobs and requests</Text>
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
              {activeTab === 'pending' && 'New booking requests will appear here'}
              {activeTab === 'active' && 'Accepted jobs will appear here'}
              {activeTab === 'completed' && 'Completed jobs will appear here'}
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

                {/* Customer Info */}
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-xl">{(booking.customer as any)?.full_name?.[0] || '👤'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {(booking.customer as any)?.full_name || 'Customer'}
                    </Text>
                    {(booking.customer as any)?.phone && (
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
                    <Text className="text-xs font-semibold text-muted mb-1">Customer Notes</Text>
                    <Text className="text-sm text-foreground">{booking.customer_notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                {activeTab === 'pending' && (
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

                {activeTab === 'active' && (
                  <TouchableOpacity
                    className="bg-success py-3 rounded-xl mt-2"
                    onPress={() => handleCompleteBooking(booking.id)}
                  >
                    <Text className="text-center font-semibold text-background">Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                {activeTab === 'completed' && (
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
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
