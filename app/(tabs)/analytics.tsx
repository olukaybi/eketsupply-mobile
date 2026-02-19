import { useState, useEffect } from 'react';
import { ScrollView, Text, View, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

type AnalyticsData = {
  totalBookings: number;
  completedJobs: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  popularServices: { name: string; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  ratingTrend: { month: string; rating: number }[];
};

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user]);

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // Get artisan profile
      const { data: artisan } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (!artisan) {
        setLoading(false);
        return;
      }

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('artisan_id', artisan.id);

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .eq('artisan_id', artisan.id);

      // Fetch payments
      const { data: payments } = await supabase
        .from('escrow')
        .select('amount, released_at')
        .eq('artisan_id', artisan.id)
        .eq('status', 'released');

      // Calculate metrics
      const totalBookings = bookings?.length || 0;
      const completedJobs = bookings?.filter(b => b.status === 'completed').length || 0;
      const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      const averageRating = reviews?.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      const completionRate = totalBookings > 0 ? (completedJobs / totalBookings) * 100 : 0;

      // Popular services
      const serviceCount: Record<string, number> = {};
      bookings?.forEach(b => {
        const service = b.service_description || 'Other';
        serviceCount[service] = (serviceCount[service] || 0) + 1;
      });
      const popularServices = Object.entries(serviceCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly revenue (last 6 months)
      const monthlyRevenue = calculateMonthlyData(
        payments || [],
        'released_at',
        'amount',
        6
      );

      // Rating trend (last 6 months)
      const ratingTrend = calculateMonthlyRatings(reviews || [], 6);

      setAnalytics({
        totalBookings,
        completedJobs,
        totalRevenue,
        averageRating,
        totalReviews: reviews?.length || 0,
        completionRate,
        popularServices,
        monthlyRevenue,
        ratingTrend,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateMonthlyData(
    data: any[],
    dateField: string,
    valueField: string,
    months: number
  ) {
    const result: { month: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const monthData = data.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return (
          itemDate.getMonth() === date.getMonth() &&
          itemDate.getFullYear() === date.getFullYear()
        );
      });

      const revenue = monthData.reduce(
        (sum, item) => sum + parseFloat(item[valueField]?.toString() || '0'),
        0
      );

      result.push({ month: monthName, revenue });
    }

    return result;
  }

  function calculateMonthlyRatings(reviews: any[], months: number) {
    const result: { month: string; rating: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const monthReviews = reviews.filter(review => {
        const reviewDate = new Date(review.created_at);
        return (
          reviewDate.getMonth() === date.getMonth() &&
          reviewDate.getFullYear() === date.getFullYear()
        );
      });

      const avgRating = monthReviews.length
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length
        : 0;

      result.push({ month: monthName, rating: avgRating });
    }

    return result;
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted mt-2">Loading analytics...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!analytics) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-semibold mb-2">No Analytics Available</Text>
          <Text className="text-muted text-center">
            Analytics are only available for artisan accounts.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Analytics Dashboard</Text>
              <Text className="text-muted mt-1">Track your performance and insights</Text>
            </View>
          </View>
          
          {/* Portfolio Management Button */}
          <TouchableOpacity
            onPress={() => router.push('/portfolio-manager')}
            className="bg-primary rounded-xl p-4 mt-4 flex-row items-center justify-center"
          >
            <IconSymbol name="photo" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Manage Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%] bg-primary/10 rounded-xl p-4">
              <Text className="text-primary text-3xl font-bold">
                ₦{analytics.totalRevenue.toLocaleString()}
              </Text>
              <Text className="text-foreground text-sm mt-1">Total Revenue</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-success/10 rounded-xl p-4">
              <Text className="text-success text-3xl font-bold">{analytics.completedJobs}</Text>
              <Text className="text-foreground text-sm mt-1">Completed Jobs</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-warning/10 rounded-xl p-4">
              <Text className="text-warning text-3xl font-bold">
                {analytics.averageRating.toFixed(1)}★
              </Text>
              <Text className="text-foreground text-sm mt-1">Average Rating</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground text-3xl font-bold">
                {analytics.completionRate.toFixed(0)}%
              </Text>
              <Text className="text-foreground text-sm mt-1">Completion Rate</Text>
            </View>
          </View>
        </View>

        {/* Popular Services */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Popular Services</Text>
          {analytics.popularServices.length > 0 ? (
            analytics.popularServices.map((service, index) => (
              <View
                key={index}
                className="bg-surface rounded-xl p-4 mb-2 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{service.name}</Text>
                  <Text className="text-muted text-xs mt-1">{service.count} bookings</Text>
                </View>
                <View className="bg-primary/20 rounded-lg px-3 py-1">
                  <Text className="text-primary font-bold">{service.count}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Text className="text-muted">No service data yet</Text>
            </View>
          )}
        </View>

        {/* Monthly Revenue Chart */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Revenue Trend (Last 6 Months)</Text>
          <View className="bg-surface rounded-xl p-4">
            <View className="flex-row justify-between items-end h-40">
              {analytics.monthlyRevenue.map((item, index) => {
                const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1);
                const height = (item.revenue / maxRevenue) * 100;

                return (
                  <View key={index} className="flex-1 items-center">
                    <View className="flex-1 justify-end items-center w-full px-1">
                      <View
                        className="bg-primary rounded-t-lg w-full"
                        style={{ height: `${height}%`, minHeight: item.revenue > 0 ? 8 : 0 }}
                      />
                    </View>
                    <Text className="text-muted text-xs mt-2">{item.month}</Text>
                    <Text className="text-foreground text-xs font-medium">
                      ₦{item.revenue.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Rating Trend */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Rating Trend (Last 6 Months)</Text>
          <View className="bg-surface rounded-xl p-4">
            <View className="flex-row justify-between items-end h-32">
              {analytics.ratingTrend.map((item, index) => {
                const height = (item.rating / 5) * 100;

                return (
                  <View key={index} className="flex-1 items-center">
                    <View className="flex-1 justify-end items-center w-full px-1">
                      <View
                        className="bg-warning rounded-t-lg w-full"
                        style={{ height: `${height}%`, minHeight: item.rating > 0 ? 8 : 0 }}
                      />
                    </View>
                    <Text className="text-muted text-xs mt-2">{item.month}</Text>
                    <Text className="text-foreground text-xs font-medium">
                      {item.rating > 0 ? item.rating.toFixed(1) : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="px-6 pb-6">
          <View className="bg-surface rounded-xl p-4">
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted">Total Bookings</Text>
              <Text className="text-foreground font-semibold">{analytics.totalBookings}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted">Completed Jobs</Text>
              <Text className="text-foreground font-semibold">{analytics.completedJobs}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted">Total Reviews</Text>
              <Text className="text-foreground font-semibold">{analytics.totalReviews}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-muted">Completion Rate</Text>
              <Text className="text-foreground font-semibold">
                {analytics.completionRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
