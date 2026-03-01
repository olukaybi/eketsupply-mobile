import { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_GREEN = "#1B5E20";
const BRAND_ORANGE = "#E65100";

const SERVICE_CATEGORIES = [
  { id: "plumbing", label: "Plumbing", icon: "🔧" },
  { id: "electrical", label: "Electrical", icon: "⚡" },
  { id: "painting", label: "Painting", icon: "🎨" },
  { id: "carpentry", label: "Carpentry", icon: "🪚" },
  { id: "ac_hvac", label: "AC & HVAC", icon: "❄️" },
  { id: "tiling", label: "Tiling & Flooring", icon: "🏠" },
  { id: "masonry", label: "Masonry", icon: "🧱" },
  { id: "welding", label: "Welding", icon: "🔩" },
  { id: "cleaning", label: "Cleaning", icon: "🧹" },
  { id: "landscaping", label: "Landscaping", icon: "🌿" },
  { id: "roofing", label: "Roofing", icon: "🏗️" },
  { id: "general", label: "General Repairs", icon: "🛠️" },
];

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Keystone Bank", code: "082" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

const EXPERIENCE_LEVELS = [
  { id: "0-2", label: "0 – 2 years", description: "Just starting out" },
  { id: "3-5", label: "3 – 5 years", description: "Solid experience" },
  { id: "6-10", label: "6 – 10 years", description: "Highly experienced" },
  { id: "10+", label: "10+ years", description: "Master craftsperson" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  // Step 1 — Personal Details
  fullName: string;
  phone: string;
  address: string;
  city: string;
  bio: string;
  // Step 2 — Skills
  selectedSkills: string[];
  experienceLevel: string;
  hourlyRate: string;
  // Step 3 — ID Verification
  idFrontUri: string | null;
  idBackUri: string | null;
  idType: "national_id" | "drivers_license" | "passport" | "voters_card";
  // Step 4 — Bank Details
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const STEPS = [
  { id: 1, title: "Personal Details", icon: "person.fill" as const },
  { id: 2, title: "Skills & Rates", icon: "wrench.and.screwdriver.fill" as const },
  { id: 3, title: "ID Verification", icon: "shield.fill" as const },
  { id: 4, title: "Bank Details", icon: "creditcard.fill" as const },
  { id: 5, title: "Review & Submit", icon: "checkmark.circle.fill" as const },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArtisanOnboardingScreen() {
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [data, setData] = useState<OnboardingData>({
    fullName: "",
    phone: "",
    address: "",
    city: "Eket",
    bio: "",
    selectedSkills: [],
    experienceLevel: "",
    hourlyRate: "",
    idFrontUri: null,
    idBackUri: null,
    idType: "national_id",
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  function update(fields: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, 5));
    scrollToTop();
  }

  function goBack() {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep((s) => s - 1);
      scrollToTop();
    }
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validateStep(step: number): boolean {
    switch (step) {
      case 1:
        if (!data.fullName.trim()) {
          Alert.alert("Required", "Please enter your full name.");
          return false;
        }
        if (!data.phone.trim() || data.phone.length < 10) {
          Alert.alert("Required", "Please enter a valid phone number.");
          return false;
        }
        if (!data.address.trim()) {
          Alert.alert("Required", "Please enter your address.");
          return false;
        }
        if (!data.bio.trim() || data.bio.length < 30) {
          Alert.alert("Required", "Please write a brief bio (at least 30 characters).");
          return false;
        }
        return true;
      case 2:
        if (data.selectedSkills.length === 0) {
          Alert.alert("Required", "Please select at least one skill.");
          return false;
        }
        if (!data.experienceLevel) {
          Alert.alert("Required", "Please select your experience level.");
          return false;
        }
        if (!data.hourlyRate || isNaN(Number(data.hourlyRate))) {
          Alert.alert("Required", "Please enter your hourly rate in Naira.");
          return false;
        }
        return true;
      case 3:
        if (!data.idFrontUri) {
          Alert.alert("Required", "Please upload the front of your ID.");
          return false;
        }
        return true;
      case 4:
        if (!data.accountName) {
          Alert.alert("Required", "Please verify your bank account before continuing.");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  // ─── Image Picker ────────────────────────────────────────────────────────────

  async function pickIdImage(side: "front" | "back") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (side === "front") update({ idFrontUri: result.assets[0].uri });
      else update({ idBackUri: result.assets[0].uri });
    }
  }

  async function takeIdPhoto(side: "front" | "back") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (side === "front") update({ idFrontUri: result.assets[0].uri });
      else update({ idBackUri: result.assets[0].uri });
    }
  }

  // ─── Bank Account Verification ───────────────────────────────────────────────

  async function verifyBankAccount() {
    if (!data.bankCode || data.accountNumber.length < 10) {
      Alert.alert("Error", "Please select a bank and enter a 10-digit account number.");
      return;
    }

    setVerifyingAccount(true);
    update({ accountName: "" });

    try {
      // Call backend to resolve account via Paystack API
      const response = await fetch(
        `https://eketsupply-dhjxeh3x.manus.space/api/trpc/verifyBankAccount?input=${encodeURIComponent(
          JSON.stringify({ bankCode: data.bankCode, accountNumber: data.accountNumber })
        )}`
      );

      if (response.ok) {
        const json = await response.json();
        const name = json?.result?.data?.account_name;
        if (name) {
          update({ accountName: name });
          return;
        }
      }

      // Fallback: show manual entry if API not available
      Alert.alert(
        "Verification Unavailable",
        "Automatic account verification is not available right now. Please double-check your account details are correct.",
        [
          {
            text: "Enter Manually",
            onPress: () => {
              Alert.prompt(
                "Account Name",
                "Enter your account name as it appears on your bank statement:",
                (name) => { if (name) update({ accountName: name.toUpperCase() }); }
              );
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } catch {
      Alert.alert(
        "Verification Unavailable",
        "Could not verify account automatically. Please enter your account name manually.",
        [
          {
            text: "Enter Manually",
            onPress: () => {
              Alert.prompt(
                "Account Name",
                "Enter your account name as it appears on your bank statement:",
                (name) => { if (name) update({ accountName: name.toUpperCase() }); }
              );
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setVerifyingAccount(false);
    }
  }

  // ─── Final Submission ────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!user) {
      Alert.alert("Error", "You must be logged in to complete onboarding.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Get or create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found. Please sign in again.");
      }

      // 2. Upload ID images to Supabase Storage
      let idFrontUrl = "";
      let idBackUrl = "";

      if (data.idFrontUri) {
        const frontBlob = await (await fetch(data.idFrontUri)).blob();
        const frontPath = `${profile.id}/id_front_${Date.now()}.jpg`;
        const { data: frontUpload, error: frontErr } = await supabase.storage
          .from("verification-documents")
          .upload(frontPath, frontBlob, { contentType: "image/jpeg", upsert: true });
        if (frontErr) throw frontErr;
        idFrontUrl = supabase.storage.from("verification-documents").getPublicUrl(frontUpload.path).data.publicUrl;
      }

      if (data.idBackUri) {
        const backBlob = await (await fetch(data.idBackUri)).blob();
        const backPath = `${profile.id}/id_back_${Date.now()}.jpg`;
        const { data: backUpload, error: backErr } = await supabase.storage
          .from("verification-documents")
          .upload(backPath, backBlob, { contentType: "image/jpeg", upsert: true });
        if (backErr) throw backErr;
        idBackUrl = supabase.storage.from("verification-documents").getPublicUrl(backUpload.path).data.publicUrl;
      }

      // 3. Upsert artisan record
      const { data: artisan, error: artisanError } = await supabase
        .from("artisans")
        .upsert({
          profile_id: profile.id,
          name: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          bio: data.bio,
          skills: data.selectedSkills,
          experience_years: data.experienceLevel,
          hourly_rate: Number(data.hourlyRate),
          bank_name: data.bankName,
          bank_code: data.bankCode,
          account_number: data.accountNumber,
          account_name: data.accountName,
          verification_status: "pending",
          is_available: true,
          rating: 0,
          total_reviews: 0,
        }, { onConflict: "profile_id" })
        .select("id")
        .single();

      if (artisanError || !artisan) throw artisanError ?? new Error("Failed to create artisan profile");

      // 4. Save verification documents
      if (idFrontUrl) {
        await supabase.from("verification_documents").insert({
          artisan_id: artisan.id,
          document_type: data.idType,
          document_url: idFrontUrl,
          file_name: `id_front.jpg`,
          side: "front",
        });
      }
      if (idBackUrl) {
        await supabase.from("verification_documents").insert({
          artisan_id: artisan.id,
          document_type: data.idType,
          document_url: idBackUrl,
          file_name: `id_back.jpg`,
          side: "back",
        });
      }

      // 5. Create verification request
      await supabase.from("verification_requests").upsert({
        artisan_id: artisan.id,
        status: "pending",
        submitted_at: new Date().toISOString(),
      }, { onConflict: "artisan_id" });

      // 6. Update profile role to artisan
      await supabase
        .from("profiles")
        .update({ role: "artisan" })
        .eq("id", profile.id);

      Alert.alert(
        "🎉 Application Submitted!",
        "Your artisan profile has been created and submitted for verification. We'll review your documents within 24-48 hours and notify you by email.",
        [{ text: "Go to Dashboard", onPress: () => router.replace("/artisan/dashboard") }]
      );
    } catch (error: any) {
      console.error("Onboarding error:", error);
      Alert.alert("Submission Failed", error?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render Helpers ──────────────────────────────────────────────────────────

  function ProgressBar() {
    return (
      <View className="px-6 pt-4 pb-2">
        {/* Step indicators */}
        <View className="flex-row items-center justify-between mb-2">
          {STEPS.map((step, i) => (
            <View key={step.id} className="flex-row items-center flex-1">
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: currentStep >= step.id ? BRAND_GREEN : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentStep > step.id ? (
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
                ) : (
                  <Text
                    style={{
                      color: currentStep === step.id ? "#fff" : "#9CA3AF",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {step.id}
                  </Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: currentStep > step.id ? BRAND_GREEN : "#E5E7EB",
                    marginHorizontal: 2,
                  }}
                />
              )}
            </View>
          ))}
        </View>
        {/* Current step label */}
        <Text style={{ color: BRAND_GREEN, fontWeight: "700", fontSize: 13 }}>
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
        </Text>
      </View>
    );
  }

  // ─── Step 1: Personal Details ────────────────────────────────────────────────

  function Step1() {
    return (
      <View className="px-6 pt-2 pb-4">
        <Text className="text-xl font-bold text-foreground mb-1">Tell us about yourself</Text>
        <Text className="text-muted text-sm mb-5">This information will appear on your public profile.</Text>

        <Text className="text-foreground font-semibold mb-1">Full Name *</Text>
        <TextInput
          value={data.fullName}
          onChangeText={(v) => update({ fullName: v })}
          placeholder="e.g. Emeka Okafor"
          placeholderTextColor="#9CA3AF"
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          returnKeyType="next"
        />

        <Text className="text-foreground font-semibold mb-1">Phone Number *</Text>
        <TextInput
          value={data.phone}
          onChangeText={(v) => update({ phone: v })}
          placeholder="e.g. 08012345678"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          returnKeyType="next"
          maxLength={14}
        />

        <Text className="text-foreground font-semibold mb-1">City *</Text>
        <TextInput
          value={data.city}
          onChangeText={(v) => update({ city: v })}
          placeholder="e.g. Eket"
          placeholderTextColor="#9CA3AF"
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          returnKeyType="next"
        />

        <Text className="text-foreground font-semibold mb-1">Address *</Text>
        <TextInput
          value={data.address}
          onChangeText={(v) => update({ address: v })}
          placeholder="e.g. 12 Eket Road, Akwa Ibom"
          placeholderTextColor="#9CA3AF"
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          returnKeyType="next"
        />

        <Text className="text-foreground font-semibold mb-1">
          About You * <Text className="text-muted font-normal">(min. 30 characters)</Text>
        </Text>
        <TextInput
          value={data.bio}
          onChangeText={(v) => update({ bio: v })}
          placeholder="Describe your experience, specialities, and what makes you stand out..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-1"
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Text className="text-muted text-xs mb-4">{data.bio.length} / 30 minimum</Text>
      </View>
    );
  }

  // ─── Step 2: Skills & Rates ──────────────────────────────────────────────────

  function Step2() {
    function toggleSkill(id: string) {
      const current = data.selectedSkills;
      if (current.includes(id)) {
        update({ selectedSkills: current.filter((s) => s !== id) });
      } else {
        update({ selectedSkills: [...current, id] });
      }
    }

    return (
      <View className="px-6 pt-2 pb-4">
        <Text className="text-xl font-bold text-foreground mb-1">Skills & Rates</Text>
        <Text className="text-muted text-sm mb-5">Select all services you offer.</Text>

        <Text className="text-foreground font-semibold mb-3">
          Service Categories * <Text className="text-muted font-normal">({data.selectedSkills.length} selected)</Text>
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {SERVICE_CATEGORIES.map((cat) => {
            const selected = data.selectedSkills.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => toggleSkill(cat.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: selected ? BRAND_GREEN : "#E5E7EB",
                  backgroundColor: selected ? "#E8F5E9" : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                <Text
                  style={{
                    color: selected ? BRAND_GREEN : "#374151",
                    fontWeight: selected ? "700" : "400",
                    fontSize: 13,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-foreground font-semibold mb-3">Experience Level *</Text>
        {EXPERIENCE_LEVELS.map((level) => {
          const selected = data.experienceLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              onPress={() => update({ experienceLevel: level.id })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: selected ? BRAND_GREEN : "#E5E7EB",
                backgroundColor: selected ? "#E8F5E9" : "transparent",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selected ? BRAND_GREEN : "#9CA3AF",
                  backgroundColor: selected ? BRAND_GREEN : "transparent",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
              </View>
              <View className="flex-1">
                <Text style={{ color: selected ? BRAND_GREEN : "#111827", fontWeight: "600" }}>{level.label}</Text>
                <Text className="text-muted text-xs">{level.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text className="text-foreground font-semibold mt-4 mb-1">Starting Rate (₦ per hour) *</Text>
        <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3 mb-2">
          <Text className="text-foreground font-bold mr-2 text-lg">₦</Text>
          <TextInput
            value={data.hourlyRate}
            onChangeText={(v) => update({ hourlyRate: v.replace(/[^0-9]/g, "") })}
            placeholder="e.g. 5000"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            className="flex-1 text-foreground text-base"
            returnKeyType="done"
          />
        </View>
        <Text className="text-muted text-xs mb-4">Customers see this as your minimum rate. You can quote differently per job.</Text>
      </View>
    );
  }

  // ─── Step 3: ID Verification ─────────────────────────────────────────────────

  function Step3() {
    const idTypes = [
      { id: "national_id" as const, label: "National ID Card" },
      { id: "drivers_license" as const, label: "Driver's License" },
      { id: "passport" as const, label: "International Passport" },
      { id: "voters_card" as const, label: "Voter's Card" },
    ];

    function IdUploadBox({ side, uri }: { side: "front" | "back"; uri: string | null }) {
      const label = side === "front" ? "Front of ID *" : "Back of ID (optional)";
      return (
        <View className="mb-4">
          <Text className="text-foreground font-semibold mb-2">{label}</Text>
          {uri ? (
            <View className="rounded-xl overflow-hidden border border-border">
              <Image source={{ uri }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => side === "front" ? update({ idFrontUri: null }) : update({ idBackUri: null })}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 12,
                  padding: 4,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => takeIdPhoto(side)}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: BRAND_GREEN,
                  borderStyle: "dashed",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>📷</Text>
                <Text style={{ color: BRAND_GREEN, fontWeight: "600", fontSize: 13 }}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickIdImage(side)}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: "#9CA3AF",
                  borderStyle: "dashed",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>🖼️</Text>
                <Text className="text-muted font-semibold text-sm">Upload File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    return (
      <View className="px-6 pt-2 pb-4">
        <Text className="text-xl font-bold text-foreground mb-1">ID Verification</Text>
        <Text className="text-muted text-sm mb-4">
          We verify all artisans to build customer trust. Your documents are stored securely and never shared publicly.
        </Text>

        {/* Why verify info box */}
        <View
          style={{
            backgroundColor: "#E8F5E9",
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: BRAND_GREEN,
          }}
        >
          <Text style={{ color: BRAND_GREEN, fontWeight: "700", marginBottom: 4 }}>✓ Verified Badge Benefits</Text>
          <Text className="text-foreground text-sm">• Appear first in customer searches</Text>
          <Text className="text-foreground text-sm">• Build instant trust with new customers</Text>
          <Text className="text-foreground text-sm">• Access higher-value bookings</Text>
        </View>

        <Text className="text-foreground font-semibold mb-3">ID Type *</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {idTypes.map((t) => {
            const selected = data.idType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => update({ idType: t.id })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: selected ? BRAND_GREEN : "#E5E7EB",
                  backgroundColor: selected ? "#E8F5E9" : "transparent",
                }}
              >
                <Text style={{ color: selected ? BRAND_GREEN : "#374151", fontWeight: selected ? "700" : "400", fontSize: 13 }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <IdUploadBox side="front" uri={data.idFrontUri} />
        <IdUploadBox side="back" uri={data.idBackUri} />

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-foreground font-semibold mb-2">📋 Document Guidelines</Text>
          <Text className="text-muted text-sm">• Photo must be clear and fully readable</Text>
          <Text className="text-muted text-sm">• All four corners of the ID must be visible</Text>
          <Text className="text-muted text-sm">• Accepted formats: JPG, PNG</Text>
          <Text className="text-muted text-sm">• Review takes 24-48 hours</Text>
        </View>
      </View>
    );
  }

  // ─── Step 4: Bank Details ────────────────────────────────────────────────────

  function Step4() {
    const filteredBanks = NIGERIAN_BANKS.filter((b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

    return (
      <View className="px-6 pt-2 pb-4">
        <Text className="text-xl font-bold text-foreground mb-1">Bank Details</Text>
        <Text className="text-muted text-sm mb-4">
          Your earnings (85% of each booking) will be automatically transferred to this account via Paystack.
        </Text>

        {/* How payments work */}
        <View
          style={{
            backgroundColor: "#FFF3E0",
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: BRAND_ORANGE,
          }}
        >
          <Text style={{ color: BRAND_ORANGE, fontWeight: "700", marginBottom: 4 }}>💰 How You Get Paid</Text>
          <Text className="text-foreground text-sm">Customer pays ₦10,000 → You receive ₦8,500 (85%)</Text>
          <Text className="text-foreground text-sm">EketSupply platform fee: ₦1,500 (15%)</Text>
          <Text className="text-foreground text-sm">Settlement: within 24-48 hours of job completion</Text>
        </View>

        {/* Bank selector */}
        <Text className="text-foreground font-semibold mb-2">Bank *</Text>
        <TouchableOpacity
          onPress={() => setShowBankPicker(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: data.bankName ? "#111827" : "#9CA3AF", fontSize: 15 }}>
            {data.bankName || "Select your bank"}
          </Text>
          <Text className="text-muted">▼</Text>
        </TouchableOpacity>

        {/* Bank picker modal */}
        {showBankPicker && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              marginBottom: 16,
              maxHeight: 280,
              overflow: "hidden",
            }}
          >
            <View className="px-4 pt-3 pb-2 border-b border-border">
              <TextInput
                value={bankSearch}
                onChangeText={setBankSearch}
                placeholder="Search bank..."
                placeholderTextColor="#9CA3AF"
                className="bg-surface rounded-lg px-3 py-2 text-foreground"
                autoFocus
              />
            </View>
            <ScrollView style={{ maxHeight: 220 }}>
              {filteredBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  onPress={() => {
                    update({ bankCode: bank.code, bankName: bank.name, accountName: "" });
                    setShowBankPicker(false);
                    setBankSearch("");
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#F3F4F6",
                    backgroundColor: data.bankCode === bank.code ? "#E8F5E9" : "transparent",
                  }}
                >
                  <Text style={{ color: data.bankCode === bank.code ? BRAND_GREEN : "#111827", fontWeight: data.bankCode === bank.code ? "700" : "400" }}>
                    {bank.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Account number */}
        <Text className="text-foreground font-semibold mb-2">Account Number *</Text>
        <TextInput
          value={data.accountNumber}
          onChangeText={(v) => {
            update({ accountNumber: v.replace(/[^0-9]/g, ""), accountName: "" });
          }}
          placeholder="10-digit account number"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={10}
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          returnKeyType="done"
        />

        {/* Verify button */}
        <TouchableOpacity
          onPress={verifyBankAccount}
          disabled={verifyingAccount || !data.bankCode || data.accountNumber.length < 10}
          style={{
            backgroundColor: data.bankCode && data.accountNumber.length === 10 ? BRAND_GREEN : "#9CA3AF",
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {verifyingAccount ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Verify Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Verified account name */}
        {data.accountName ? (
          <View
            style={{
              backgroundColor: "#E8F5E9",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: BRAND_GREEN,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 10 }}>✅</Text>
            <View>
              <Text style={{ color: BRAND_GREEN, fontWeight: "700" }}>Account Verified</Text>
              <Text style={{ color: "#111827", fontWeight: "600", marginTop: 2 }}>{data.accountName}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  // ─── Step 5: Review & Submit ─────────────────────────────────────────────────

  function Step5() {
    const selectedSkillLabels = SERVICE_CATEGORIES
      .filter((c) => data.selectedSkills.includes(c.id))
      .map((c) => `${c.icon} ${c.label}`)
      .join(", ");

    function ReviewRow({ label, value }: { label: string; value: string }) {
      return (
        <View style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6" }}>
          <Text style={{ color: "#6B7280", fontSize: 13, width: 110 }}>{label}</Text>
          <Text style={{ color: "#111827", fontSize: 13, flex: 1, fontWeight: "500" }}>{value || "—"}</Text>
        </View>
      );
    }

    function Section({ title, children }: { title: string; children: React.ReactNode }) {
      return (
        <View style={{ backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#E5E7EB" }}>
          <Text style={{ color: BRAND_GREEN, fontWeight: "700", fontSize: 14, marginBottom: 8 }}>{title}</Text>
          {children}
        </View>
      );
    }

    return (
      <View className="px-6 pt-2 pb-4">
        <Text className="text-xl font-bold text-foreground mb-1">Review Your Application</Text>
        <Text className="text-muted text-sm mb-5">Please confirm all details before submitting.</Text>

        <Section title="👤 Personal Details">
          <ReviewRow label="Full Name" value={data.fullName} />
          <ReviewRow label="Phone" value={data.phone} />
          <ReviewRow label="City" value={data.city} />
          <ReviewRow label="Address" value={data.address} />
          <ReviewRow label="Bio" value={data.bio.substring(0, 80) + (data.bio.length > 80 ? "..." : "")} />
        </Section>

        <Section title="🛠️ Skills & Rates">
          <ReviewRow label="Skills" value={selectedSkillLabels || "None selected"} />
          <ReviewRow label="Experience" value={data.experienceLevel} />
          <ReviewRow label="Hourly Rate" value={data.hourlyRate ? `₦${Number(data.hourlyRate).toLocaleString()}/hr` : "—"} />
        </Section>

        <Section title="🪪 ID Verification">
          <ReviewRow label="ID Type" value={data.idType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
          <ReviewRow label="Front" value={data.idFrontUri ? "✅ Uploaded" : "❌ Missing"} />
          <ReviewRow label="Back" value={data.idBackUri ? "✅ Uploaded" : "Not provided"} />
        </Section>

        <Section title="🏦 Bank Details">
          <ReviewRow label="Bank" value={data.bankName} />
          <ReviewRow label="Account No." value={data.accountNumber} />
          <ReviewRow label="Account Name" value={data.accountName} />
        </Section>

        {/* Terms */}
        <View style={{ backgroundColor: "#FFF3E0", borderRadius: 12, padding: 14, marginBottom: 8 }}>
          <Text style={{ color: BRAND_ORANGE, fontWeight: "700", marginBottom: 6 }}>📋 By submitting you agree:</Text>
          <Text className="text-foreground text-sm">• All information provided is accurate and truthful</Text>
          <Text className="text-foreground text-sm">• EketSupply may verify your identity and documents</Text>
          <Text className="text-foreground text-sm">• You will abide by the EketSupply Artisan Code of Conduct</Text>
          <Text className="text-foreground text-sm">• Platform commission of 15% applies to all bookings</Text>
        </View>
      </View>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <TouchableOpacity onPress={goBack} style={{ padding: 8, marginRight: 8 }}>
            <IconSymbol name="chevron.left" size={22} color={BRAND_GREEN} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: BRAND_GREEN }}>
              Eket<Text style={{ color: BRAND_ORANGE }}>Supply</Text>
            </Text>
            <Text style={{ fontSize: 11, color: "#6B7280" }}>Artisan Registration</Text>
          </View>
        </View>

        <ProgressBar />

        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {currentStep === 1 && <Step1 />}
          {currentStep === 2 && <Step2 />}
          {currentStep === 3 && <Step3 />}
          {currentStep === 4 && <Step4 />}
          {currentStep === 5 && <Step5 />}

          {/* Navigation Buttons */}
          <View style={{ flexDirection: "row", paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={goBack}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: BRAND_GREEN,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: BRAND_GREEN, fontWeight: "700", fontSize: 15 }}>← Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < 5 ? (
              <TouchableOpacity
                onPress={goNext}
                style={{
                  flex: 2,
                  backgroundColor: BRAND_GREEN,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  Continue →
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2,
                  backgroundColor: submitting ? "#9CA3AF" : BRAND_ORANGE,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    🚀 Submit Application
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
