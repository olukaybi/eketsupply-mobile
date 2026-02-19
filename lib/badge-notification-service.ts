import { supabase } from './supabase';
import { BADGE_CONFIG, type BadgeType } from '@/components/artisan-badges';

interface BadgeAward {
  badge_type: BadgeType;
  newly_awarded: boolean;
}

/**
 * Service for handling badge notifications and auto-awarding
 */
export class BadgeNotificationService {
  /**
   * Check and award badges for an artisan
   * This is called automatically by database triggers after bookings/reviews
   */
  static async checkAndAwardBadges(artisanId: string): Promise<BadgeAward[]> {
    try {
      const { data, error } = await supabase.rpc('check_and_award_badges', {
        p_artisan_id: artisanId,
      });

      if (error) {
        console.error('Error checking badges:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in checkAndAwardBadges:', error);
      return [];
    }
  }

  /**
   * Send push notification for newly awarded badge
   */
  static async sendBadgeNotification(
    artisanId: string,
    badgeType: BadgeType
  ): Promise<void> {
    try {
      // Get artisan's profile to get push token
      const { data: artisanData } = await supabase
        .from('artisans')
        .select('profile_id')
        .eq('id', artisanId)
        .single();

      if (!artisanData) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', artisanData.profile_id)
        .single();

      if (!profileData?.push_token) return;

      const badge = BADGE_CONFIG[badgeType];
      if (!badge) return;

      // Send push notification
      const message = {
        to: profileData.push_token,
        sound: 'default',
        title: '🎉 New Badge Earned!',
        body: `Congratulations! You've earned the "${badge.name}" badge - ${badge.description}`,
        data: {
          type: 'badge_earned',
          badge_type: badgeType,
          artisan_id: artisanId,
        },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error('Failed to send badge notification:', await response.text());
      }

      // Mark notification as sent in badge_award_log
      await supabase
        .from('badge_award_log')
        .update({ notification_sent: true })
        .eq('artisan_id', artisanId)
        .eq('badge_type', badgeType)
        .is('notification_sent', false);
    } catch (error) {
      console.error('Error sending badge notification:', error);
    }
  }

  /**
   * Get recent badge awards for an artisan
   */
  static async getRecentBadgeAwards(
    artisanId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('badge_award_log')
        .select('*')
        .eq('artisan_id', artisanId)
        .order('awarded_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching badge awards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentBadgeAwards:', error);
      return [];
    }
  }

  /**
   * Process pending badge notifications
   * This can be called periodically to send notifications for badges
   * that were awarded but notifications weren't sent
   */
  static async processPendingNotifications(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('badge_award_log')
        .select('artisan_id, badge_type')
        .eq('notification_sent', false)
        .order('awarded_at', { ascending: true })
        .limit(50);

      if (error || !data) {
        console.error('Error fetching pending notifications:', error);
        return 0;
      }

      let sentCount = 0;
      for (const award of data) {
        await this.sendBadgeNotification(award.artisan_id, award.badge_type);
        sentCount++;
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return sentCount;
    } catch (error) {
      console.error('Error processing pending notifications:', error);
      return 0;
    }
  }

  /**
   * Get badge statistics for an artisan
   */
  static async getBadgeStatistics(artisanId: string): Promise<{
    total_badges: number;
    recent_awards: number;
    next_milestone: string | null;
  }> {
    try {
      // Get total badges
      const { data: badgesData } = await supabase
        .from('artisan_badges')
        .select('badge_type')
        .eq('artisan_id', artisanId);

      const totalBadges = badgesData?.length || 0;

      // Get recent awards (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentData } = await supabase
        .from('badge_award_log')
        .select('id')
        .eq('artisan_id', artisanId)
        .gte('awarded_at', thirtyDaysAgo.toISOString());

      const recentAwards = recentData?.length || 0;

      // Get milestones to determine next milestone
      const { data: milestonesData } = await supabase
        .from('artisan_milestones')
        .select('completed_jobs, average_rating, total_reviews')
        .eq('artisan_id', artisanId)
        .single();

      let nextMilestone: string | null = null;
      if (milestonesData) {
        const { completed_jobs, average_rating, total_reviews } = milestonesData;

        if (completed_jobs < 50) {
          nextMilestone = `${50 - completed_jobs} more jobs for 50 Jobs badge`;
        } else if (completed_jobs < 100) {
          nextMilestone = `${100 - completed_jobs} more jobs for 100 Jobs badge`;
        } else if (completed_jobs < 500) {
          nextMilestone = `${500 - completed_jobs} more jobs for 500 Jobs badge`;
        } else if (average_rating < 4.8 && total_reviews >= 50) {
          nextMilestone = `Maintain 4.8+ rating for Top Rated badge`;
        } else if (average_rating < 5.0 && total_reviews >= 10) {
          nextMilestone = `Maintain 5.0 rating for 5-Star Pro badge`;
        }
      }

      return {
        total_badges: totalBadges,
        recent_awards: recentAwards,
        next_milestone: nextMilestone,
      };
    } catch (error) {
      console.error('Error getting badge statistics:', error);
      return {
        total_badges: 0,
        recent_awards: 0,
        next_milestone: null,
      };
    }
  }
}
