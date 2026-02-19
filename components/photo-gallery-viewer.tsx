import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Image, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from "react-native-reanimated";

interface PhotoGalleryViewerProps {
  visible: boolean;
  onClose: () => void;
  photos: string[];
  initialIndex?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function PhotoGalleryViewer({
  visible,
  onClose,
  photos,
  initialIndex = 0,
}: PhotoGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = SCREEN_WIDTH / 3;
      
      if (event.translationX < -threshold && currentIndex < photos.length - 1) {
        // Swipe left - next photo
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateX.value = withSpring(0);
      } else if (event.translationX > threshold && currentIndex > 0) {
        // Swipe right - previous photo
        runOnJS(setCurrentIndex)(currentIndex - 1);
        translateX.value = withSpring(0);
      } else {
        // Return to center
        translateX.value = withSpring(0);
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withTiming(1);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-6 pb-4 bg-black/50">
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-semibold text-lg">
              {currentIndex + 1} / {photos.length}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center bg-white/20 rounded-full"
            >
              <Text className="text-white text-2xl font-bold">×</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo */}
        <View className="flex-1 items-center justify-center">
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={animatedStyle}>
              <Image
                source={{ uri: photos[currentIndex] }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 }}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Navigation Dots */}
        {photos.length > 1 && (
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
            {photos.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setCurrentIndex(index);
                  translateX.value = 0;
                }}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}
