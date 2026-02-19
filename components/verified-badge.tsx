import { View, Text } from 'react-native';

interface VerifiedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function VerifiedBadge({ size = 'medium', showLabel = true }: VerifiedBadgeProps) {
  const sizeMap = {
    small: {
      container: 'px-2 py-1',
      icon: 'text-sm',
      text: 'text-xs',
    },
    medium: {
      container: 'px-3 py-1.5',
      icon: 'text-base',
      text: 'text-sm',
    },
    large: {
      container: 'px-4 py-2',
      icon: 'text-lg',
      text: 'text-base',
    },
  };

  const styles = sizeMap[size];

  return (
    <View
      className={`bg-primary/20 rounded-full flex-row items-center border border-primary ${styles.container}`}
    >
      <Text className={`${styles.icon} mr-1`}>✓</Text>
      {showLabel && (
        <Text className={`text-primary font-semibold ${styles.text}`}>
          Verified
        </Text>
      )}
    </View>
  );
}
