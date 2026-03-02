import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Animated, Easing, Platform } from 'react-native';
import { Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

const LIGHT_LOGO = require('@/assets/images/eketsupply-logo.png');
const DARK_LOGO = require('@/assets/images/eketsupply-logo-dark.png');
const ICON = require('@/assets/images/icon.png');

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const iconScale = useRef(new Animated.Value(0.4)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    // Phase 1: Icon pops in with scale + fade (0–400ms)
    Animated.parallel([
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Logo wordmark slides up + fades in (400–750ms)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 3: Hold for 600ms then navigate
        setTimeout(() => {
          checkOnboarding();
        }, 600);
      });
    });
  }, []);

  async function checkOnboarding() {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      if (completed === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  }

  const bgColor = isDark ? '#151718' : '#ffffff';
  // Logo dimensions: 1365 × 338 — at width 260, height = 64
  const logoWidth = 260;
  const logoHeight = Math.round(logoWidth * (338 / 1365));

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor }}>
      {/* Animated icon emblem */}
      <Animated.View
        style={{
          transform: [{ scale: iconScale }],
          opacity: iconOpacity,
          marginBottom: 20,
        }}
      >
        <Image
          source={ICON}
          style={{ width: 100, height: 100, borderRadius: 22 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Animated wordmark logo */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ translateY: logoTranslateY }],
        }}
      >
        <Image
          source={isDark ? DARK_LOGO : LIGHT_LOGO}
          style={{ width: logoWidth, height: logoHeight }}
          resizeMode="contain"
          accessibilityLabel="EketSupply — Fix it Right, The First Time."
        />
      </Animated.View>
    </View>
  );
}
