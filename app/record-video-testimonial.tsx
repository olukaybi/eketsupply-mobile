import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

const MAX_DURATION = 30; // 30 seconds

export default function RecordVideoTestimonialScreen() {
  const { bookingId, artisanId, rating } = useLocalSearchParams();
  const { user } = useAuth();
  const colors = useColors();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!permission) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-6xl mb-4">📹</Text>
        <Text className="text-xl font-bold text-foreground mb-2 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-muted text-center mb-6">
          We need access to your camera to record video testimonials
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  async function startRecording() {
    if (Platform.OS === "web") {
      Alert.alert("Not Supported", "Video recording is not available on web");
      return;
    }

    try {
      const camera = cameraRef.current;
      if (!camera) return;

      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      const video = await camera.recordAsync({
        maxDuration: MAX_DURATION,
      });

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);

      // Upload video
      if (video) {
        await uploadVideo(video.uri);
      }
    } catch (error) {
      console.error("Error recording video:", error);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      Alert.alert("Error", "Failed to record video");
    }
  }

  function stopRecording() {
    cameraRef.current?.stopRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  }

  async function uploadVideo(videoUri: string) {
    if (!user || !bookingId || !artisanId || !rating) {
      Alert.alert("Error", "Missing required information");
      return;
    }

    try {
      setUploading(true);

      // Get customer profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        Alert.alert("Error", "Profile not found");
        return;
      }

      // Upload video to storage
      const response = await fetch(videoUri);
      const blob = await response.blob();
      const fileName = `${artisanId}/${Date.now()}.mp4`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("video-testimonials")
        .upload(fileName, blob, {
          contentType: "video/mp4",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("video-testimonials").getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("video_testimonials")
        .insert({
          booking_id: bookingId,
          customer_id: profileData.id,
          artisan_id: artisanId,
          video_url: publicUrl,
          duration_seconds: recordingDuration,
          rating: parseInt(rating as string),
        });

      if (dbError) throw dbError;

      Alert.alert(
        "Success",
        "Video testimonial submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error uploading video:", error);
      Alert.alert("Error", "Failed to upload video testimonial");
    } finally {
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Uploading video...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View className="absolute top-12 left-0 right-0 z-10 px-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
        >
          <IconSymbol name="xmark" size={20} color="#fff" />
        </TouchableOpacity>

        <View className="bg-black/50 rounded-full px-4 py-2">
          <Text className="text-white font-semibold">
            {recordingDuration}s / {MAX_DURATION}s
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
          className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
        >
          <IconSymbol name="arrow.triangle.2.circlepath.camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        mode="video"
      >
        {/* Recording Indicator */}
        {isRecording && (
          <View className="absolute top-20 left-1/2 -ml-12 bg-error rounded-full px-4 py-2 flex-row items-center gap-2">
            <View className="w-3 h-3 bg-white rounded-full" />
            <Text className="text-white font-semibold">Recording</Text>
          </View>
        )}

        {/* Instructions */}
        {!isRecording && (
          <View className="absolute top-32 left-0 right-0 px-6">
            <View className="bg-black/70 rounded-xl p-4">
              <Text className="text-white font-semibold text-center mb-2">
                Video Testimonial Tips
              </Text>
              <Text className="text-white/80 text-sm text-center">
                • Keep it under 30 seconds{"\n"}
                • Share your honest experience{"\n"}
                • Speak clearly and naturally{"\n"}
                • Good lighting helps!
              </Text>
            </View>
          </View>
        )}

        {/* Controls */}
        <View className="absolute bottom-12 left-0 right-0 items-center">
          {isRecording ? (
            <TouchableOpacity
              onPress={stopRecording}
              className="w-20 h-20 bg-error rounded-full items-center justify-center border-4 border-white"
            >
              <View className="w-8 h-8 bg-white rounded" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={startRecording}
              className="w-20 h-20 bg-error rounded-full items-center justify-center border-4 border-white"
            >
              <View className="w-16 h-16 bg-error rounded-full" />
            </TouchableOpacity>
          )}

          <Text className="text-white text-sm mt-4">
            {isRecording ? "Tap to stop recording" : "Tap to start recording"}
          </Text>
        </View>
      </CameraView>
    </ScreenContainer>
  );
}
