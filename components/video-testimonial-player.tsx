import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

interface VideoTestimonialPlayerProps {
  videoUrl: string;
  customerName: string;
  rating: number;
  duration: number;
}

function VideoHeader({ customerName, rating, duration }: { customerName: string; rating: number; duration: number }) {
  return (
    <View className="p-3 border-b border-border flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{customerName}</Text>
        <View className="flex-row items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Text key={i} className="text-xs">
              {i < rating ? "⭐" : "☆"}
            </Text>
          ))}
          <Text className="text-xs text-muted ml-1">{duration}s</Text>
        </View>
      </View>
      <View className="bg-primary/10 px-2 py-1 rounded">
        <Text className="text-primary text-xs font-semibold">VIDEO</Text>
      </View>
    </View>
  );
}

function WebFallback({ customerName, rating, duration }: VideoTestimonialPlayerProps) {
  return (
    <View className="bg-surface rounded-xl overflow-hidden border border-border">
      <VideoHeader customerName={customerName} rating={rating} duration={duration} />
      <View style={{ aspectRatio: 16 / 9 }} className="items-center justify-center bg-black/10">
        <Text className="text-muted text-sm">Video playback is only available on mobile devices</Text>
      </View>
    </View>
  );
}

function NativeVideoPlayer({ videoUrl, customerName, rating, duration }: VideoTestimonialPlayerProps) {
  // Dynamic import to avoid loading expo-video on web
  const { VideoView, useVideoPlayer } = require("expo-video");
  const colors = useColors();
  const [showControls, setShowControls] = useState(true);

  const player = useVideoPlayer(videoUrl, (p: { loop: boolean; volume: number }) => {
    p.loop = false;
    p.volume = 1.0;
  });

  function togglePlayPause() {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  }

  return (
    <View className="bg-surface rounded-xl overflow-hidden border border-border">
      <VideoHeader customerName={customerName} rating={rating} duration={duration} />

      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlayPause}
        style={{ aspectRatio: 16 / 9 }}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls={false}
        />

        {/* Play/Pause Overlay */}
        {showControls && (
          <View
            style={StyleSheet.absoluteFill}
            className="items-center justify-center bg-black/30"
          >
            <View className="w-16 h-16 bg-white/90 rounded-full items-center justify-center">
              <IconSymbol
                name={player.playing ? "pause.fill" : "play.fill"}
                size={32}
                color={colors.primary}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Footer */}
      <View className="p-2 bg-primary/5">
        <Text className="text-xs text-muted text-center">
          Tap to {player.playing ? "pause" : "play"}
        </Text>
      </View>
    </View>
  );
}

export function VideoTestimonialPlayer(props: VideoTestimonialPlayerProps) {
  if (Platform.OS === "web") {
    return <WebFallback {...props} />;
  }
  return <NativeVideoPlayer {...props} />;
}
