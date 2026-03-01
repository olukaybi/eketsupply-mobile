import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";

type UserType = "seeker" | "artisan";

export default function SignUpScreen() {
  const [userType, setUserType] = useState<UserType>("seeker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp(email, password, name, userType);
      // Artisans go to onboarding flow; customers go straight to the home tab
      if (userType === "artisan") {
        router.replace("/artisan/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6">
          {/* Logo/Header */}
          <View className="items-center mb-6 mt-4">
            <Text className="text-4xl font-bold mb-1" style={{ color: '#1B5E20' }}>Eket<Text style={{ color: '#E65100' }}>Supply</Text></Text>
            <Text className="text-sm text-muted mb-2">Fix it Right, The First Time</Text>
            <Text className="text-xl font-bold text-foreground">Create Account</Text>
          </View>

          {/* User Type Tabs */}
          <View className="flex-row mb-6 bg-surface rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setUserType("seeker")}
              className={`flex-1 py-3 rounded-md ${userType === "seeker" ? "bg-primary" : ""}`}
              disabled={loading}
            >
              <Text
                className={`text-center font-semibold ${
                  userType === "seeker" ? "text-background" : "text-muted"
                }`}
              >
                I need help
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUserType("artisan")}
              className={`flex-1 py-3 rounded-md ${userType === "artisan" ? "bg-primary" : ""}`}
              disabled={loading}
            >
              <Text
                className={`text-center font-semibold ${
                  userType === "artisan" ? "text-background" : "text-muted"
                }`}
              >
                I am a Pro
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Full Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Enter your full name"
              placeholderTextColor="#9BA1A6"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Enter your email"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          {/* Phone Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Phone Number</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Enter your phone number"
              placeholderTextColor="#9BA1A6"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className="relative">
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 pr-12 text-foreground"
                placeholder="Create a password"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
                disabled={loading}
              >
                <Text className="text-muted text-xl">{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">Confirm Password</Text>
            <View className="relative">
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 pr-12 text-foreground"
                placeholder="Confirm your password"
                placeholderTextColor="#9BA1A6"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3"
                disabled={loading}
              >
                <Text className="text-muted text-xl">{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className="rounded-full py-4 mb-4"
            style={{ backgroundColor: '#1B5E20', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-background text-center font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-muted text-sm">Already have an account? </Text>
            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: '#1B5E20' }}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
