import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface PortfolioPhoto {
  id: string;
  artisan_id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

const MAX_PHOTOS = 12;

export default function PortfolioManagerScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [artisanId, setArtisanId] = useState<string | null>(null);

  useEffect(() => {
    loadArtisanData();
  }, [user]);

  async function loadArtisanData() {
    if (!user) return;

    try {
      setLoading(true);

      // Get artisan profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        Alert.alert("Error", "Profile not found");
        router.back();
        return;
      }

      const { data: artisanData } = await supabase
        .from("artisans")
        .select("id")
        .eq("profile_id", profileData.id)
        .single();

      if (!artisanData) {
        Alert.alert("Error", "You must be an artisan to manage portfolio");
        router.back();
        return;
      }

      setArtisanId(artisanData.id);

      // Load portfolio photos
      const { data: photosData, error } = await supabase
        .from("portfolio_photos")
        .select("*")
        .eq("artisan_id", artisanData.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error loading artisan data:", error);
      Alert.alert("Error", "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    if (!artisanId) return;

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Limit Reached",
        `You can only upload up to ${MAX_PHOTOS} portfolio photos.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  }

  async function uploadPhoto(uri: string) {
    if (!artisanId) return;

    try {
      setUploading(true);

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const fileExt = uri.split(".").pop();
      const fileName = `${artisanId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("portfolio-photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-photos").getPublicUrl(fileName);

      // Save to database
      const { data: photoData, error: dbError } = await supabase
        .from("portfolio_photos")
        .insert({
          artisan_id: artisanId,
          photo_url: publicUrl,
          display_order: photos.length,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Add to local state
      setPhotos([...photos, photoData]);
      Alert.alert("Success", "Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photo: PortfolioPhoto) {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Extract file path from URL
              const urlParts = photo.photo_url.split("/portfolio-photos/");
              const filePath = urlParts[1];

              // Delete from storage
              const { error: storageError } = await supabase.storage
                .from("portfolio-photos")
                .remove([filePath]);

              if (storageError) throw storageError;

              // Delete from database
              const { error: dbError } = await supabase
                .from("portfolio_photos")
                .delete()
                .eq("id", photo.id);

              if (dbError) throw dbError;

              // Remove from local state
              setPhotos(photos.filter((p) => p.id !== photo.id));
              Alert.alert("Success", "Photo deleted successfully");
            } catch (error) {
              console.error("Error deleting photo:", error);
              Alert.alert("Error", "Failed to delete photo");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">
            Manage Portfolio
          </Text>
        </View>
        <Text className="text-sm text-muted">
          {photos.length}/{MAX_PHOTOS}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Upload Button */}
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading || photos.length >= MAX_PHOTOS}
            className="bg-primary rounded-xl p-4 mb-6 items-center"
            style={{
              opacity: uploading || photos.length >= MAX_PHOTOS ? 0.5 : 1,
            }}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="plus" size={32} color="#fff" />
                <Text className="text-white font-semibold mt-2">
                  Add Portfolio Photo
                </Text>
                <Text className="text-white text-xs mt-1 opacity-80">
                  Showcase your best work
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Card */}
          <View className="bg-surface rounded-xl p-4 mb-6">
            <Text className="text-sm text-foreground font-semibold mb-2">
              Portfolio Tips
            </Text>
            <Text className="text-xs text-muted leading-5">
              • Upload high-quality photos of your completed work{"\n"}
              • Show variety in your projects{"\n"}
              • Keep photos well-lit and professional{"\n"}
              • Maximum {MAX_PHOTOS} photos allowed
            </Text>
          </View>

          {/* Photo Grid */}
          {photos.length === 0 ? (
            <View className="items-center justify-center py-12">
              <IconSymbol name="photo" size={64} color={colors.muted} />
              <Text className="text-muted mt-4 text-center">
                No portfolio photos yet.{"\n"}Add photos to showcase your work!
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {photos.map((photo) => (
                <View
                  key={photo.id}
                  className="relative bg-surface rounded-xl overflow-hidden"
                  style={{ width: "48%", aspectRatio: 1 }}
                >
                  <Image
                    source={{ uri: photo.photo_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {/* Delete Button */}
                  <Pressable
                    onPress={() => deletePhoto(photo)}
                    className="absolute top-2 right-2 bg-error rounded-full p-2"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <IconSymbol name="trash" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
