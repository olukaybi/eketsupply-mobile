import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface BeforeAfterProject {
  id: string;
  project_title: string;
  project_description: string | null;
  before_photo_url: string;
  after_photo_url: string;
}

interface BeforeAfterViewerProps {
  visible: boolean;
  projects: BeforeAfterProject[];
  initialIndex: number;
  onClose: () => void;
}

export function BeforeAfterViewer({
  visible,
  projects,
  initialIndex,
  onClose,
}: BeforeAfterViewerProps) {
  const _colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showBefore, setShowBefore] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const translateX = useSharedValue(0);

  const currentProject = projects[currentIndex];

  // Swipe gesture for navigation between projects
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > screenWidth * 0.3) {
        // Swipe threshold: 30% of screen width
        if (event.translationX > 0 && currentIndex > 0) {
          // Swipe right - previous project
          runOnJS(setCurrentIndex)(currentIndex - 1);
        } else if (event.translationX < 0 && currentIndex < projects.length - 1) {
          // Swipe left - next project
          runOnJS(setCurrentIndex)(currentIndex + 1);
        }
      }
      translateX.value = withTiming(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!currentProject) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 pb-4 bg-black/80">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-white font-bold text-lg">
                {currentProject.project_title}
              </Text>
              {currentProject.project_description && (
                <Text className="text-white/70 text-sm mt-1">
                  {currentProject.project_description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
            >
              <Text className="text-white text-2xl">×</Text>
            </TouchableOpacity>
          </View>

          {/* Project Counter */}
          <Text className="text-white/70 text-xs mt-2">
            {currentIndex + 1} of {projects.length}
          </Text>
        </View>

        {/* Image Container */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            className="flex-1 items-center justify-center"
            style={animatedStyle}
          >
            <Pressable
              onPress={() => setShowBefore(!showBefore)}
              className="w-full h-full items-center justify-center"
            >
              <Image
                source={{
                  uri: showBefore
                    ? currentProject.before_photo_url
                    : currentProject.after_photo_url,
                }}
                className="w-full h-full"
                resizeMode="contain"
              />

              {/* Before/After Label */}
              <View className="absolute top-1/2 left-4 bg-black/70 px-3 py-2 rounded-lg">
                <Text
                  className={`font-bold text-sm ${
                    showBefore ? "text-warning" : "text-success"
                  }`}
                >
                  {showBefore ? "BEFORE" : "AFTER"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 pb-8 px-4 bg-black/80">
          {/* Toggle Button */}
          <TouchableOpacity
            onPress={() => setShowBefore(!showBefore)}
            className="bg-primary rounded-full py-3 px-6 items-center mb-4"
          >
            <Text className="text-white font-semibold">
              {showBefore ? "Show After →" : "← Show Before"}
            </Text>
          </TouchableOpacity>

          {/* Navigation Arrows */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex-row items-center gap-2"
              style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}
            >
              <IconSymbol name="chevron.left" size={24} color="#fff" />
              <Text className="text-white font-medium">Previous</Text>
            </TouchableOpacity>

            <Text className="text-white/70 text-sm">
              Swipe to navigate • Tap to toggle
            </Text>

            <TouchableOpacity
              onPress={() =>
                currentIndex < projects.length - 1 && setCurrentIndex(currentIndex + 1)
              }
              disabled={currentIndex === projects.length - 1}
              className="flex-row items-center gap-2"
              style={{ opacity: currentIndex === projects.length - 1 ? 0.3 : 1 }}
            >
              <Text className="text-white font-medium">Next</Text>
              <IconSymbol name="chevron.right" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
