import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface ResponseTimeBadgeProps {
  avgResponseMinutes: number | null;
  size?: 'small' | 'medium' | 'large';
}

export function ResponseTimeBadge({ avgResponseMinutes, size = 'medium' }: ResponseTimeBadgeProps) {
  const colors = useColors();

  if (!avgResponseMinutes) {
    return null;
  }

  const getBadgeInfo = () => {
    if (avgResponseMinutes <= 60) {
      return {
        text: 'Responds < 1hr',
        icon: '⚡',
        color: colors.success,
        description: 'Lightning fast response',
      };
    }
    
    if (avgResponseMinutes <= 1440) {
      return {
        text: 'Responds < 24hrs',
        icon: '✓',
        color: colors.warning,
        description: 'Quick response',
      };
    }
    
    return {
      text: 'Responds < 48hrs',
      icon: '○',
      color: colors.muted,
      description: 'Standard response time',
    };
  };

  const badge = getBadgeInfo();

  const sizeStyles = {
    small: {
      container: 'px-2 py-0.5',
      text: 'text-xs',
      icon: 'text-sm',
    },
    medium: {
      container: 'px-3 py-1',
      text: 'text-sm',
      icon: 'text-base',
    },
    large: {
      container: 'px-4 py-2',
      text: 'text-base',
      icon: 'text-lg',
    },
  };

  const styles = sizeStyles[size];

  return (
    <View 
      className={`flex-row items-center rounded-full ${styles.container}`}
      style={{ backgroundColor: badge.color + '20' }}
    >
      <Text className={styles.icon} style={{ marginRight: 4 }}>
        {badge.icon}
      </Text>
      <Text 
        className={`font-semibold ${styles.text}`}
        style={{ color: badge.color }}
      >
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
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours < 24) {
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m` 
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0
      ? `${days}d ${remainingHours}h`
      : `${days} day${days > 1 ? 's' : ''}`;
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
