import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { AppIcon } from '@/components/ui/app-icon';

interface ResponseTimeBadgeProps {
  avgResponseMinutes: number | null;
  size?: 'small' | 'medium' | 'large';
}

export function ResponseTimeBadge({ avgResponseMinutes, size = 'medium' }: ResponseTimeBadgeProps) {
  const colors = useColors();

  if (!avgResponseMinutes) return null;

  type BadgeInfo = { text: string; iconName: "bolt.fill" | "checkmark" | "clock.fill"; color: string; description: string };

  const getBadgeInfo = (): BadgeInfo => {
    if (avgResponseMinutes <= 60) {
      return { text: 'Responds < 1hr', iconName: 'bolt.fill', color: colors.success, description: 'Lightning fast response' };
    }
    if (avgResponseMinutes <= 1440) {
      return { text: 'Responds < 24hrs', iconName: 'checkmark', color: colors.warning, description: 'Quick response' };
    }
    return { text: 'Responds < 48hrs', iconName: 'clock.fill', color: colors.muted, description: 'Standard response time' };
  };

  const badge = getBadgeInfo();

  const iconSizeMap = { small: 11, medium: 13, large: 15 };
  const textSizeMap = { small: 'text-xs', medium: 'text-sm', large: 'text-base' };
  const containerMap = { small: 'px-2 py-0.5', medium: 'px-3 py-1', large: 'px-4 py-2' };

  return (
    <View
      className={`flex-row items-center rounded-full ${containerMap[size]}`}
      style={{ backgroundColor: badge.color + '20' }}
    >
      <AppIcon name={badge.iconName} size={iconSizeMap[size]} color={badge.color} style={{ marginRight: 4 }} />
      <Text className={`font-semibold ${textSizeMap[size]}`} style={{ color: badge.color }}>
        {badge.text}
      </Text>
    </View>
  );
}

interface ResponseTimeStatsProps {
  avgResponseMinutes: number;
  totalResponses: number;
}

export function ResponseTimeStats({ avgResponseMinutes, totalResponses }: ResponseTimeStatsProps) {
  const colors = useColors();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (hours < 24) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <View className="bg-surface rounded-xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-foreground">Response Time</Text>
        <ResponseTimeBadge avgResponseMinutes={avgResponseMinutes} size="small" />
      </View>
      <View className="flex-row items-baseline gap-2 mb-1">
        <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
          {formatDuration(avgResponseMinutes)}
        </Text>
        <Text className="text-sm text-muted">average</Text>
      </View>
      <Text className="text-xs text-muted">
        Based on {totalResponses} booking{totalResponses !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}
