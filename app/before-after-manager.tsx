import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface BeforeAfterPhoto {
  id: string;
  artisan_id: string;
  project_title: string;
  project_description: string | null;
  before_photo_url: string;
  after_photo_url: string;
  display_order: number;
  created_at: string;
}

const MAX_PROJECTS = 10;

export default function BeforeAfterManagerScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<BeforeAfterPhoto[]>([]);
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [beforePhotoUri, setBeforePhotoUri] = useState<string | null>(null);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    loadArtisanData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        Alert.alert("Error", "You must be an artisan to manage before/after photos");
        router.back();
        return;
      }

      setArtisanId(artisanData.id);

      // Load before/after projects
      const { data: projectsData, error } = await supabase
        .from("before_after_photos")
        .select("*")
        .eq("artisan_id", artisanData.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error loading artisan data:", error);
      Alert.alert("Error", "Failed to load before/after projects");
    } finally {
      setLoading(false);
    }
  }

  async function pickImage(type: "before" | "after") {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === "before") {
          setBeforePhotoUri(result.assets[0].uri);
        } else {
          setAfterPhotoUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  }

  async function uploadProject() {
    if (!artisanId) return;

    if (!projectTitle.trim()) {
      Alert.alert("Missing Information", "Please enter a project title");
      return;
    }

    if (!beforePhotoUri || !afterPhotoUri) {
      Alert.alert("Missing Photos", "Please select both before and after photos");
      return;
    }

    try {
      setUploading(true);

      // Upload before photo
      const beforeResponse = await fetch(beforePhotoUri);
      const beforeBlob = await beforeResponse.blob();
      const beforeFileName = `${artisanId}/before_${Date.now()}.jpg`;

      const { data: _beforeUpload, error: beforeError } = await supabase.storage
        .from("before-after-photos")
        .upload(beforeFileName, beforeBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (beforeError) throw beforeError;

      const {
        data: { publicUrl: beforeUrl },
      } = supabase.storage.from("before-after-photos").getPublicUrl(beforeFileName);

      // Upload after photo
      const afterResponse = await fetch(afterPhotoUri);
      const afterBlob = await afterResponse.blob();
      const afterFileName = `${artisanId}/after_${Date.now()}.jpg`;

      const { data: _afterUpload, error: afterError } = await supabase.storage
        .from("before-after-photos")
        .upload(afterFileName, afterBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (afterError) throw afterError;

      const {
        data: { publicUrl: afterUrl },
      } = supabase.storage.from("before-after-photos").getPublicUrl(afterFileName);

      // Save to database
      const { data: projectData, error: dbError } = await supabase
        .from("before_after_photos")
        .insert({
          artisan_id: artisanId,
          project_title: projectTitle.trim(),
          project_description: projectDescription.trim() || null,
          before_photo_url: beforeUrl,
          after_photo_url: afterUrl,
          display_order: projects.length,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Add to local state
      setProjects([...projects, projectData]);
      
      // Reset form
      setProjectTitle("");
      setProjectDescription("");
      setBeforePhotoUri(null);
      setAfterPhotoUri(null);
      setShowAddModal(false);
      
      Alert.alert("Success", "Before/After project added successfully!");
    } catch (error) {
      console.error("Error uploading project:", error);
      Alert.alert("Error", "Failed to upload project");
    } finally {
      setUploading(false);
    }
  }

  async function deleteProject(project: BeforeAfterPhoto) {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this before/after project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Extract file paths from URLs
              const beforePath = project.before_photo_url.split("/before-after-photos/")[1];
              const afterPath = project.after_photo_url.split("/before-after-photos/")[1];

              // Delete from storage
              await supabase.storage.from("before-after-photos").remove([beforePath, afterPath]);

              // Delete from database
              const { error: dbError } = await supabase
                .from("before_after_photos")
                .delete()
                .eq("id", project.id);

              if (dbError) throw dbError;

              // Remove from local state
              setProjects(projects.filter((p) => p.id !== project.id));
              Alert.alert("Success", "Project deleted successfully");
            } catch (error) {
              console.error("Error deleting project:", error);
              Alert.alert("Error", "Failed to delete project");
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
            Before/After Projects
          </Text>
        </View>
        <Text className="text-sm text-muted">
          {projects.length}/{MAX_PROJECTS}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Add Button */}
          <TouchableOpacity
            onPress={() => {
              if (projects.length >= MAX_PROJECTS) {
                Alert.alert(
                  "Limit Reached",
                  `You can only create up to ${MAX_PROJECTS} before/after projects.`
                );
              } else {
                setShowAddModal(true);
              }
            }}
            disabled={projects.length >= MAX_PROJECTS}
            className="bg-primary rounded-xl p-4 mb-6 items-center"
            style={{
              opacity: projects.length >= MAX_PROJECTS ? 0.5 : 1,
            }}
          >
            <IconSymbol name="plus" size={32} color="#fff" />
            <Text className="text-white font-semibold mt-2">
              Add Before/After Project
            </Text>
            <Text className="text-white text-xs mt-1 opacity-80">
              Showcase your transformations
            </Text>
          </TouchableOpacity>

          {/* Info Card */}
          <View className="bg-surface rounded-xl p-4 mb-6">
            <Text className="text-sm text-foreground font-semibold mb-2">
              Before/After Tips
            </Text>
            <Text className="text-xs text-muted leading-5">
              • Take photos from the same angle{"\n"}
              • Use similar lighting conditions{"\n"}
              • Show the full scope of the transformation{"\n"}
              • Add descriptive titles and details
            </Text>
          </View>

          {/* Projects List */}
          {projects.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">🔄</Text>
              <Text className="text-muted text-center">
                No before/after projects yet.{"\n"}Add your first transformation!
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {projects.map((project) => (
                <View
                  key={project.id}
                  className="bg-surface rounded-xl overflow-hidden border border-border"
                >
                  {/* Project Title */}
                  <View className="p-4 border-b border-border">
                    <Text className="text-foreground font-semibold text-base">
                      {project.project_title}
                    </Text>
                    {project.project_description && (
                      <Text className="text-muted text-sm mt-1">
                        {project.project_description}
                      </Text>
                    )}
                  </View>

                  {/* Before/After Images */}
                  <View className="flex-row">
                    <View className="flex-1 p-2">
                      <Text className="text-xs text-muted font-semibold mb-1 text-center">
                        BEFORE
                      </Text>
                      <Image
                        source={{ uri: project.before_photo_url }}
                        className="w-full aspect-[4/3] rounded-lg"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 p-2">
                      <Text className="text-xs text-success font-semibold mb-1 text-center">
                        AFTER
                      </Text>
                      <Image
                        source={{ uri: project.after_photo_url }}
                        className="w-full aspect-[4/3] rounded-lg"
                        resizeMode="cover"
                      />
                    </View>
                  </View>

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => deleteProject(project)}
                    className="p-3 border-t border-border flex-row items-center justify-center gap-2"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      backgroundColor: pressed ? colors.error + "20" : "transparent",
                    })}
                  >
                    <IconSymbol name="trash" size={16} color={colors.error} />
                    <Text className="text-error font-medium text-sm">Delete Project</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Project Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <ScreenContainer>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">
              Add Before/After Project
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text className="text-primary font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            <View className="p-4">
              {/* Project Title */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Project Title *
                </Text>
                <TextInput
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  placeholder="e.g., Kitchen Renovation, Bathroom Repair"
                  placeholderTextColor={colors.muted}
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                />
              </View>

              {/* Project Description */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  placeholder="Describe the transformation..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                />
              </View>

              {/* Before Photo */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Before Photo *
                </Text>
                <TouchableOpacity
                  onPress={() => pickImage("before")}
                  className="bg-surface border border-border rounded-xl overflow-hidden"
                  style={{ aspectRatio: 4 / 3 }}
                >
                  {beforePhotoUri ? (
                    <Image
                      source={{ uri: beforePhotoUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <IconSymbol name="photo" size={48} color={colors.muted} />
                      <Text className="text-muted mt-2">Tap to select photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* After Photo */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  After Photo *
                </Text>
                <TouchableOpacity
                  onPress={() => pickImage("after")}
                  className="bg-surface border border-border rounded-xl overflow-hidden"
                  style={{ aspectRatio: 4 / 3 }}
                >
                  {afterPhotoUri ? (
                    <Image
                      source={{ uri: afterPhotoUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <IconSymbol name="photo" size={48} color={colors.muted} />
                      <Text className="text-muted mt-2">Tap to select photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={uploadProject}
                disabled={uploading}
                className="bg-primary rounded-xl p-4 items-center mt-4"
                style={{ opacity: uploading ? 0.5 : 1 }}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Add Project</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
