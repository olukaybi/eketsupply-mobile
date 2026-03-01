import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface ServicePackage {
  id: string;
  package_name: string;
  description: string | null;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  is_active: boolean;
  services: Service[];
}

export default function PackageManagerScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [packageName, setPackageName] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState("10");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
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
        Alert.alert("Error", "You must be an artisan to manage packages");
        router.back();
        return;
      }

      setArtisanId(artisanData.id);

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("artisan_id", artisanData.id);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Load packages
      await loadPackages(artisanData.id);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function loadPackages(artisan_id: string) {
    try {
      const { data: packagesData, error } = await supabase
        .from("service_packages")
        .select(`
          id,
          package_name,
          description,
          original_price,
          discounted_price,
          discount_percentage,
          is_active
        `)
        .eq("artisan_id", artisan_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load services for each package
      const packagesWithServices = await Promise.all(
        (packagesData || []).map(async (pkg) => {
          const { data: packageServices } = await supabase
            .from("package_services")
            .select(`
              service_id,
              services (id, name, price, duration)
            `)
            .eq("package_id", pkg.id);

          return {
            ...pkg,
            services: packageServices?.map((ps: any) => ps.services) || [],
          };
        })
      );

      setPackages(packagesWithServices);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  }

  function calculatePackagePrice() {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const discount = parseInt(discountPercentage) || 0;
    const discounted = total * (1 - discount / 100);

    return { original: total, discounted, discount };
  }

  async function createPackage() {
    if (!artisanId) return;

    if (!packageName.trim()) {
      Alert.alert("Missing Information", "Please enter a package name");
      return;
    }

    if (selectedServices.length < 2) {
      Alert.alert("Missing Services", "Please select at least 2 services");
      return;
    }

    const discount = parseInt(discountPercentage);
    if (isNaN(discount) || discount < 5 || discount > 50) {
      Alert.alert("Invalid Discount", "Discount must be between 5% and 50%");
      return;
    }

    try {
      setSubmitting(true);

      const { original, discounted } = calculatePackagePrice();

      // Create package
      const { data: packageData, error: packageError } = await supabase
        .from("service_packages")
        .insert({
          artisan_id: artisanId,
          package_name: packageName.trim(),
          description: packageDescription.trim() || null,
          original_price: original,
          discounted_price: discounted,
          discount_percentage: discount,
          is_active: true,
        })
        .select()
        .single();

      if (packageError) throw packageError;

      // Add services to package
      const packageServices = selectedServices.map((serviceId) => ({
        package_id: packageData.id,
        service_id: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from("package_services")
        .insert(packageServices);

      if (servicesError) throw servicesError;

      // Reload packages
      await loadPackages(artisanId);

      // Reset form
      setPackageName("");
      setPackageDescription("");
      setSelectedServices([]);
      setDiscountPercentage("10");
      setShowCreateModal(false);

      Alert.alert("Success", "Package created successfully!");
    } catch (error) {
      console.error("Error creating package:", error);
      Alert.alert("Error", "Failed to create package");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePackageStatus(packageId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("service_packages")
        .update({ is_active: !currentStatus })
        .eq("id", packageId);

      if (error) throw error;

      // Update local state
      setPackages(
        packages.map((pkg) =>
          pkg.id === packageId ? { ...pkg, is_active: !currentStatus } : pkg
        )
      );

      Alert.alert(
        "Success",
        `Package ${!currentStatus ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Error toggling package:", error);
      Alert.alert("Error", "Failed to update package");
    }
  }

  async function deletePackage(packageId: string) {
    Alert.alert(
      "Delete Package",
      "Are you sure you want to delete this package?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("service_packages")
                .delete()
                .eq("id", packageId);

              if (error) throw error;

              setPackages(packages.filter((pkg) => pkg.id !== packageId));
              Alert.alert("Success", "Package deleted");
            } catch (error) {
              console.error("Error deleting package:", error);
              Alert.alert("Error", "Failed to delete package");
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

  const { original, discounted, discount } = calculatePackagePrice();

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">
            Service Packages
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Create Button */}
          <TouchableOpacity
            onPress={() => {
              if (services.length < 2) {
                Alert.alert(
                  "Not Enough Services",
                  "You need at least 2 services to create a package"
                );
              } else {
                setShowCreateModal(true);
              }
            }}
            className="bg-primary rounded-xl p-4 mb-6 items-center"
          >
            <IconSymbol name="plus" size={32} color="#fff" />
            <Text className="text-white font-semibold mt-2">
              Create Service Package
            </Text>
            <Text className="text-white text-xs mt-1 opacity-80">
              Bundle services with discounts
            </Text>
          </TouchableOpacity>

          {/* Info Card */}
          <View className="bg-surface rounded-xl p-4 mb-6">
            <Text className="text-sm text-foreground font-semibold mb-2">
              Package Benefits
            </Text>
            <Text className="text-xs text-muted leading-5">
              • Increase booking value with bundles{"\n"}
              • Attract customers with discounts{"\n"}
              • Showcase service combinations{"\n"}
              • Boost revenue per customer
            </Text>
          </View>

          {/* Packages List */}
          {packages.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">📦</Text>
              <Text className="text-muted text-center">
                No packages yet.{"\n"}Create your first bundle!
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {packages.map((pkg) => (
                <View
                  key={pkg.id}
                  className="bg-surface rounded-xl overflow-hidden border border-border"
                >
                  {/* Package Header */}
                  <View className="p-4 border-b border-border">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-foreground font-bold text-lg">
                          {pkg.package_name}
                        </Text>
                        {pkg.description && (
                          <Text className="text-muted text-sm mt-1">
                            {pkg.description}
                          </Text>
                        )}
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${
                          pkg.is_active ? "bg-success/20" : "bg-muted/20"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            pkg.is_active ? "text-success" : "text-muted"
                          }`}
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>

                    {/* Pricing */}
                    <View className="flex-row items-center gap-2">
                      <Text className="text-muted text-sm line-through">
                        ₦{pkg.original_price.toLocaleString()}
                      </Text>
                      <Text className="text-primary text-2xl font-bold">
                        ₦{pkg.discounted_price.toLocaleString()}
                      </Text>
                      <View className="bg-error/20 px-2 py-1 rounded">
                        <Text className="text-error text-xs font-bold">
                          {pkg.discount_percentage}% OFF
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Services List */}
                  <View className="p-4 bg-background/50">
                    <Text className="text-xs font-semibold text-muted mb-2">
                      INCLUDED SERVICES
                    </Text>
                    {pkg.services.map((service, _index) => (
                      <View
                        key={service.id}
                        className="flex-row items-center justify-between py-2"
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="text-primary">✓</Text>
                          <Text className="text-foreground">{service.name}</Text>
                        </View>
                        <Text className="text-muted text-sm">
                          ₦{service.price.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View className="flex-row border-t border-border">
                    <TouchableOpacity
                      onPress={() => togglePackageStatus(pkg.id, pkg.is_active)}
                      className="flex-1 p-3 items-center border-r border-border"
                    >
                      <Text className="text-primary font-medium text-sm">
                        {pkg.is_active ? "Deactivate" : "Activate"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deletePackage(pkg.id)}
                      className="flex-1 p-3 items-center"
                    >
                      <Text className="text-error font-medium text-sm">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Package Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ScreenContainer>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">
              Create Package
            </Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-primary font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            <View className="p-4">
              {/* Package Name */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Package Name *
                </Text>
                <TextInput
                  value={packageName}
                  onChangeText={setPackageName}
                  placeholder="e.g., Complete Home Service Bundle"
                  placeholderTextColor={colors.muted}
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  value={packageDescription}
                  onChangeText={setPackageDescription}
                  placeholder="Describe what's included..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                />
              </View>

              {/* Select Services */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Select Services * (min. 2)
                </Text>
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedServices(
                            selectedServices.filter((id) => id !== service.id)
                          );
                        } else {
                          setSelectedServices([...selectedServices, service.id]);
                        }
                      }}
                      className={`flex-row items-center justify-between p-4 rounded-xl mb-2 border ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      <View className="flex-1">
                        <Text
                          className={`font-semibold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {service.name}
                        </Text>
                        <Text className="text-muted text-sm">{service.duration}</Text>
                      </View>
                      <Text
                        className={`font-semibold ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        ₦{service.price.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Discount Percentage */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Discount Percentage * (5-50%)
                </Text>
                <TextInput
                  value={discountPercentage}
                  onChangeText={setDiscountPercentage}
                  placeholder="10"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                />
              </View>

              {/* Price Preview */}
              {selectedServices.length >= 2 && (
                <View className="bg-primary/10 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Price Preview
                  </Text>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-muted">Original Price:</Text>
                    <Text className="text-foreground font-semibold">
                      ₦{original.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-muted">Discount ({discount}%):</Text>
                    <Text className="text-error font-semibold">
                      -₦{(original - discounted).toLocaleString()}
                    </Text>
                  </View>
                  <View className="h-px bg-border my-2" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-bold">Package Price:</Text>
                    <Text className="text-primary text-xl font-bold">
                      ₦{discounted.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={createPackage}
                disabled={submitting}
                className="bg-primary rounded-xl p-4 items-center"
                style={{ opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Create Package</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
