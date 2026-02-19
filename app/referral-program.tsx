import { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Clipboard from 'expo-clipboard';

type ReferralStats = {
  code: string;
  total_referrals: number;
  successful_referrals: number;
  total_earnings: number;
  pending_earnings: number;
};

export default function ReferralProgramScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchReferralData();
    }
  }, [user]);

  async function fetchReferralData() {
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

      // Check if referral code exists
      let { data: codeData } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('artisan_id', artisan.id)
        .eq('is_active', true)
        .single();

      // If no code exists, generate one
      if (!codeData) {
        const { data: newCode } = await supabase.rpc('generate_referral_code');

        if (newCode) {
          await supabase.from('referral_codes').insert({
            artisan_id: artisan.id,
            code: newCode,
            is_active: true,
          });

          codeData = { code: newCode };
        }
      }

      // Fetch referral statistics
      const { data: statsData } = await supabase
        .from('referral_statistics')
        .select('*')
        .eq('artisan_id', artisan.id)
        .single();

      if (statsData) {
        setStats({
          code: statsData.referral_code || codeData?.code || '',
          total_referrals: statsData.total_referrals || 0,
          successful_referrals: statsData.successful_referrals || 0,
          total_earnings: parseFloat(statsData.total_earnings || '0'),
          pending_earnings: parseFloat(statsData.pending_earnings || '0'),
        });
      } else {
        setStats({
          code: codeData?.code || '',
          total_referrals: 0,
          successful_referrals: 0,
          total_earnings: 0,
          pending_earnings: 0,
        });
      }

      // Fetch recent referrals
      const { data: referralsData } = await supabase
        .from('referral_rewards')
        .select(`
          *,
          referee:artisans!referee_id(
            business_name
          )
        `)
        .eq('referrer_id', artisan.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentReferrals(referralsData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (stats?.code) {
      await Clipboard.setStringAsync(stats.code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  }

  async function shareCode() {
    if (!stats?.code) return;

    try {
      await Share.share({
        message: `Join EketSupply and start earning! Use my referral code: ${stats.code}\n\nGet ₦3,000 bonus when you complete your first job!`,
        title: 'Join EketSupply',
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted mt-2">Loading referral data...</Text>
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
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color="#0a7ea4" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                Referral Program
              </Text>
              <Text className="text-muted mt-1">Invite artisans, earn rewards</Text>
            </View>
          </View>

          {/* Referral Code Card */}
          <View className="bg-primary rounded-2xl p-6 mb-4">
            <Text className="text-white text-lg font-semibold mb-2">
              Your Referral Code
            </Text>
            <View className="bg-white/20 rounded-xl p-4 mb-4">
              <Text className="text-white text-3xl font-bold text-center tracking-widest">
                {stats?.code || 'LOADING...'}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={copyCode}
                className="flex-1 bg-white/20 rounded-xl p-3 items-center"
              >
                <Text className="text-white font-semibold">Copy Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={shareCode}
                className="flex-1 bg-white rounded-xl p-3 items-center"
              >
                <Text className="text-primary font-semibold">Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* How It Works */}
          <View className="bg-success/10 rounded-xl p-4 border border-success/20 mb-4">
            <Text className="text-success font-semibold text-base mb-3">
              💰 How It Works
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-start mb-2">
                <Text className="text-success font-bold mr-2">1.</Text>
                <Text className="text-foreground text-sm flex-1">
                  Share your code with other artisans
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Text className="text-success font-bold mr-2">2.</Text>
                <Text className="text-foreground text-sm flex-1">
                  They sign up using your code
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Text className="text-success font-bold mr-2">3.</Text>
                <Text className="text-foreground text-sm flex-1">
                  When they complete their first job, you both get rewarded!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            Your Earnings
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
            <View className="flex-1 min-w-[45%] bg-success/10 rounded-xl p-4">
              <Text className="text-success text-2xl font-bold">
                ₦{stats?.total_earnings.toLocaleString() || '0'}
              </Text>
              <Text className="text-foreground text-sm mt-1">Total Earned</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-warning/10 rounded-xl p-4">
              <Text className="text-warning text-2xl font-bold">
                ₦{stats?.pending_earnings.toLocaleString() || '0'}
              </Text>
              <Text className="text-foreground text-sm mt-1">Pending</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-primary/10 rounded-xl p-4">
              <Text className="text-primary text-2xl font-bold">
                {stats?.total_referrals || 0}
              </Text>
              <Text className="text-foreground text-sm mt-1">Total Referrals</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground text-2xl font-bold">
                {stats?.successful_referrals || 0}
              </Text>
              <Text className="text-foreground text-sm mt-1">Successful</Text>
            </View>
          </View>
        </View>

        {/* Reward Breakdown */}
        <View className="px-6 pb-6">
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-foreground font-semibold mb-3">
              Reward Breakdown
            </Text>
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted">You receive</Text>
              <Text className="text-success font-bold">₦5,000</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-muted">Your referral receives</Text>
              <Text className="text-success font-bold">₦3,000</Text>
            </View>
          </View>
        </View>

        {/* Recent Referrals */}
        {recentReferrals.length > 0 && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-bold text-foreground mb-3">
              Recent Referrals
            </Text>
            {recentReferrals.map((referral) => (
              <View
                key={referral.id}
                className="bg-surface rounded-xl p-4 mb-3 border border-border"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">
                      {referral.referee?.business_name || 'New Artisan'}
                    </Text>
                    <Text className="text-muted text-xs mt-1">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      referral.referee_first_job_completed
                        ? 'bg-success/20'
                        : 'bg-warning/20'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        referral.referee_first_job_completed
                          ? 'text-success'
                          : 'text-warning'
                      }`}
                    >
                      {referral.referee_first_job_completed
                        ? 'Completed'
                        : 'Pending'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center pt-2 border-t border-border">
                  <Text className="text-muted text-sm">Your reward</Text>
                  <Text className="text-foreground font-semibold">
                    ₦{parseFloat(referral.referrer_reward_amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {recentReferrals.length === 0 && (
          <View className="px-6 pb-6">
            <View className="bg-surface rounded-xl p-8 items-center">
              <Text className="text-6xl mb-3">🎁</Text>
              <Text className="text-foreground font-semibold text-base mb-2">
                No Referrals Yet
              </Text>
              <Text className="text-muted text-sm text-center">
                Share your code to start earning rewards!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
