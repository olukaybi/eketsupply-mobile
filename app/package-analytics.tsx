import { useState, useEffect } from 'react';
import { ScrollView, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

type PackageAnalytics = {
  package_id: string;
  package_name: string;
  discount_percentage: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  total_savings_given: number;
  avg_package_price: number;
  completion_rate: number;
};

export default function PackageAnalyticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PackageAnalytics[]>([]);
  const [totalStats, setTotalStats] = useState({
    total_packages: 0,
    total_bookings: 0,
    total_revenue: 0,
    avg_completion_rate: 0,
  });

  useEffect(() => {
    if (user?.id) {
      fetchPackageAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchPackageAnalytics() {
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

      // Fetch package analytics from view
      const { data: analyticsData, error } = await supabase
        .from('package_analytics')
        .select('*')
        .eq('artisan_id', artisan.id)
        .order('total_bookings', { ascending: false });

      if (error) {
        console.error('Error fetching package analytics:', error);
        setLoading(false);
        return;
      }

      setAnalytics(analyticsData || []);

      // Calculate total stats
      const totalPackages = analyticsData?.length || 0;
      const totalBookings = analyticsData?.reduce((sum, p) => sum + p.total_bookings, 0) || 0;
      const totalRevenue = analyticsData?.reduce((sum, p) => sum + parseFloat(p.total_revenue.toString()), 0) || 0;
      const avgCompletionRate = totalPackages > 0
        ? analyticsData.reduce((sum, p) => sum + p.completion_rate, 0) / totalPackages
        : 0;

      setTotalStats({
        total_packages: totalPackages,
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        avg_completion_rate: avgCompletionRate,
      });
    } catch (error) {
      console.error('Error in fetchPackageAnalytics:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3"
            >
              <IconSymbol name="chevron.left" size={24} color="#0a7ea4" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Package Analytics</Text>
              <Text className="text-muted mt-1">Track your package performance</Text>
            </View>
          </View>

          {/* Summary Cards */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            <View className="flex-1 min-w-[45%] bg-primary/10 rounded-xl p-4">
              <Text className="text-primary text-3xl font-bold">
                {totalStats.total_packages}
              </Text>
              <Text className="text-foreground text-sm mt-1">Active Packages</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-success/10 rounded-xl p-4">
              <Text className="text-success text-3xl font-bold">
                {totalStats.total_bookings}
              </Text>
              <Text className="text-foreground text-sm mt-1">Total Bookings</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-warning/10 rounded-xl p-4">
              <Text className="text-warning text-3xl font-bold">
                ₦{totalStats.total_revenue.toLocaleString()}
              </Text>
              <Text className="text-foreground text-sm mt-1">Total Revenue</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground text-3xl font-bold">
                {totalStats.avg_completion_rate.toFixed(0)}%
              </Text>
              <Text className="text-foreground text-sm mt-1">Avg Completion</Text>
            </View>
          </View>
        </View>

        {/* Package Performance List */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Package Performance</Text>

          {analytics.length > 0 ? (
            analytics.map((pkg, index) => (
              <View
                key={pkg.package_id}
                className="bg-surface rounded-xl p-4 mb-3 border border-border"
              >
                {/* Package Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-foreground font-bold text-base">
                      {pkg.package_name}
                    </Text>
                    <Text className="text-muted text-xs mt-1">
                      {pkg.discount_percentage}% discount
                    </Text>
                  </View>
                  <View className="bg-primary/20 rounded-lg px-3 py-1">
                    <Text className="text-primary font-bold">
                      #{index + 1}
                    </Text>
                  </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-2 mb-3">
                  <View className="flex-1 min-w-[45%] bg-background rounded-lg p-3">
                    <Text className="text-muted text-xs">Total Bookings</Text>
                    <Text className="text-foreground font-bold text-lg">
                      {pkg.total_bookings}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-background rounded-lg p-3">
                    <Text className="text-muted text-xs">Completed</Text>
                    <Text className="text-success font-bold text-lg">
                      {pkg.completed_bookings}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-background rounded-lg p-3">
                    <Text className="text-muted text-xs">Revenue</Text>
                    <Text className="text-foreground font-bold text-base">
                      ₦{parseFloat(pkg.total_revenue.toString()).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-background rounded-lg p-3">
                    <Text className="text-muted text-xs">Avg Price</Text>
                    <Text className="text-foreground font-bold text-base">
                      ₦{parseFloat(pkg.avg_package_price.toString()).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Performance Metrics */}
                <View className="border-t border-border pt-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-muted text-sm">Completion Rate</Text>
                    <Text className="text-foreground font-semibold">
                      {pkg.completion_rate.toFixed(1)}%
                    </Text>
                  </View>
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View
                      className="h-full bg-success rounded-full"
                      style={{ width: `${pkg.completion_rate}%` }}
                    />
                  </View>

                  {pkg.cancelled_bookings > 0 && (
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="text-muted text-sm">Cancelled</Text>
                      <Text className="text-error font-semibold">
                        {pkg.cancelled_bookings}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-muted text-sm">Customer Savings</Text>
                    <Text className="text-warning font-semibold">
                      ₦{parseFloat(pkg.total_savings_given.toString()).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center">
              <Text className="text-6xl mb-3">📦</Text>
              <Text className="text-foreground font-semibold text-base mb-2">
                No Package Data Yet
              </Text>
              <Text className="text-muted text-sm text-center mb-4">
                Create service packages to start tracking their performance
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/package-manager')}
                className="bg-primary rounded-lg px-6 py-3"
              >
                <Text className="text-white font-semibold">Create Package</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Insights Section */}
        {analytics.length > 0 && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Insights</Text>
            <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <Text className="text-primary font-semibold mb-2">💡 Recommendations</Text>
              {analytics[0] && (
                <Text className="text-foreground text-sm mb-2">
                  • Your most popular package is {'"'}{analytics[0].package_name}{'"'}  with{' '}
                  {analytics[0].total_bookings} bookings
                </Text>
              )}
              {totalStats.avg_completion_rate < 70 && (
                <Text className="text-foreground text-sm mb-2">
                  • Consider reviewing packages with low completion rates to improve customer satisfaction
                </Text>
              )}
              {analytics.some(p => p.total_bookings === 0) && (
                <Text className="text-foreground text-sm">
                  {"• Some packages haven't been booked yet. Try adjusting pricing or promotion"}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
