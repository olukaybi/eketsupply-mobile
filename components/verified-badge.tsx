import { View, Text } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';

interface VerifiedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function VerifiedBadge({ size = 'medium', showLabel = true }: VerifiedBadgeProps) {
  const iconSizeMap = { small: 12, medium: 14, large: 16 };
  const textSizeMap = { small: 'text-xs', medium: 'text-sm', large: 'text-base' };
  const containerMap = { small: 'px-2 py-1', medium: 'px-3 py-1.5', large: 'px-4 py-2' };

  return (
    <View
      className={`bg-primary/20 rounded-full flex-row items-center border border-primary ${containerMap[size]}`}
    >
      <AppIcon name="checkmark.shield.fill" size={iconSizeMap[size]} color="#0a7ea4" style={{ marginRight: 4 }} />
      {showLabel && (
        <Text className={`text-primary font-semibold ${textSizeMap[size]}`}>
          Verified
        </Text>
      )}
    </View>
  );
}
