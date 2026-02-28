import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useState } from "react";

type MenuItemProps = {
  icon: any;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
};

function MenuItem({ icon, label, sublabel, onPress, danger, rightElement }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}
      className="border-b border-border bg-background"
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: danger ? "#FEF2F2" : "#F0F7F0" }}
      >
        <IconSymbol name={icon} size={20} color={danger ? "#EF4444" : "#1B5E20"} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-medium ${danger ? "text-error" : "text-foreground"}`}>
          {label}
        </Text>
        {sublabel && <Text className="text-xs text-muted mt-0.5">{sublabel}</Text>}
      </View>
      {rightElement ?? <IconSymbol name="chevron.right" size={18} color="#9BA1A6" />}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="px-4 pt-5 pb-2">
      <Text className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: "#F0F7F0" }}
        >
          <IconSymbol name="person.fill" size={40} color="#1B5E20" />
        </View>
        <Text className="text-xl font-bold text-foreground mb-2">Welcome to EketSupply</Text>
        <Text className="text-muted text-center mb-8 text-sm">
          Sign in to manage your bookings, messages, and profile settings.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/sign-in" as any)}
          className="w-full rounded-full py-4 items-center mb-3"
          style={{ backgroundColor: "#1B5E20" }}
        >
          <Text className="text-white font-semibold text-base">Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/auth/sign-up" as any)}
          className="w-full rounded-full py-4 items-center border border-border"
        >
          <Text className="text-foreground font-semibold text-base">Create Account</Text>
        </TouchableOpacity>

        <View className="mt-10 items-center">
          <Text className="text-muted text-sm mb-2">Are you an artisan?</Text>
          <TouchableOpacity onPress={() => router.push("/onboarding" as any)}>
            <Text className="text-base font-semibold" style={{ color: "#E65100" }}>
              Join as an Artisan →
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const displayName = user.name ?? user.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View
          className="items-center pt-8 pb-6 px-4"
          style={{ backgroundColor: "#1B5E20" }}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Text className="text-white text-2xl font-bold">{initials}</Text>
          </View>
          <Text className="text-white text-xl font-bold">{displayName}</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>
            {user.email}
          </Text>
          <TouchableOpacity
            onPress={() => {}}
            className="mt-3 rounded-full px-5 py-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Text className="text-white text-sm font-medium">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <SectionHeader title="Account" />
        <MenuItem
          icon="person.fill"
          label="Personal Information"
          sublabel="Name, phone, address"
          onPress={() => {}}
        />
        <MenuItem
          icon="shield.fill"
          label="Verification Status"
          sublabel="ID verified"
          onPress={() => {}}
        />
        <MenuItem
          icon="creditcard.fill"
          label="Payment Methods"
          sublabel="Cards and bank accounts"
          onPress={() => {}}
        />

        {/* Artisan Section */}
        <SectionHeader title="Artisan Tools" />
        <MenuItem
          icon="wrench.fill"
          label="Artisan Dashboard"
          sublabel="Manage your jobs and earnings"
          onPress={() => router.push("/artisan/dashboard" as any)}
        />
        <MenuItem
          icon="photo.fill"
          label="My Portfolio"
          sublabel="Showcase your work"
          onPress={() => router.push("/portfolio-manager" as any)}
        />
        <MenuItem
          icon="banknote.fill"
          label="Bank Details & Earnings"
          sublabel="Link account for Paystack payments"
          onPress={() => router.push("/artisan/bank-details" as any)}
        />

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <MenuItem
          icon="bell.fill"
          label="Notifications"
          sublabel="Booking alerts and updates"
          onPress={() => {}}
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#D4E0D4", true: "#1B5E20" }}
              thumbColor="#fff"
            />
          }
        />
        <MenuItem
          icon="lock.fill"
          label="Privacy & Security"
          onPress={() => {}}
        />

        {/* Support Section */}
        <SectionHeader title="Support" />
        <MenuItem
          icon="info.circle.fill"
          label="Help Centre"
          onPress={() => {}}
        />
        <MenuItem
          icon="doc.text.fill"
          label="Payment Policy"
          sublabel="How payments work"
          onPress={() => {}}
        />
        <MenuItem
          icon="doc.fill"
          label="Terms & Privacy Policy"
          onPress={() => {}}
        />

        {/* Sign Out */}
        <SectionHeader title="" />
        <MenuItem
          icon="arrow.left"
          label="Sign Out"
          onPress={logout}
          danger
        />

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
