import { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: '🔍',
    title: 'Find Skilled Artisans',
    description: 'Browse verified professionals across Nigeria. From carpenters to electricians, plumbers to tailors - find the right expert for your project.',
  },
  {
    id: 2,
    icon: '✓',
    title: 'Verified Professionals',
    description: 'Every artisan is verified with ID and certifications. Read reviews, see portfolios, and check ratings before booking.',
  },
  {
    id: 3,
    icon: '🔒',
    title: 'Secure Booking & Payment',
    description: 'Book services with confidence. Track your projects, communicate directly, and pay securely. Fix it Right, The First Time.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const colors = useColors();

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)');
    }
  };

  const currentSlide = onboardingData[currentIndex];
  const isLastSlide = currentIndex === onboardingData.length - 1;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <View className="flex-1 px-8 justify-between py-12">
        {/* Skip Button */}
        {!isLastSlide && (
          <View className="items-end">
            <TouchableOpacity onPress={handleSkip} className="py-2 px-4">
              <Text className="text-muted text-base">Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View className="flex-1 justify-center items-center">
          {/* Icon */}
          <View 
            className="w-32 h-32 rounded-full items-center justify-center mb-8"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-7xl">{currentSlide.icon}</Text>
          </View>

          {/* Title */}
          <Text 
            className="text-3xl font-bold text-center mb-4"
            style={{ color: colors.foreground }}
          >
            {currentSlide.title}
          </Text>

          {/* Description */}
          <Text 
            className="text-base text-center leading-relaxed px-4"
            style={{ color: colors.muted }}
          >
            {currentSlide.description}
          </Text>
        </View>

        {/* Bottom Section */}
        <View>
          {/* Pagination Dots */}
          <View className="flex-row justify-center mb-8 gap-2">
            {onboardingData.map((_, index) => (
              <View
                key={index}
                className="h-2 rounded-full"
                style={{
                  width: index === currentIndex ? 24 : 8,
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          {/* Next/Get Started Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white text-lg font-semibold">
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
