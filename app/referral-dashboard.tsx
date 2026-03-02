/**
 * EketSupply Referral Dashboard Screen
 *
 * Shows the user's personal referral code, allows sharing it,
 * and displays stats on how many people have used it.
 *
 * Route: /referral-dashboard
 */

import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
const DARK_LOGO = require("@/assets/images/eketsupply-logo-dark.png");
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

function makeReferralCode(userId: number | string): string {
  const str = String(userId).replace(/-/g, "").toUpperCase().padStart(6, "0");
  return "EKT" + str.slice(0, 6);
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 8,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: "800", color: "#1B5E20" }}>{value}</Text>
      <Text style={{ fontSize: 12, color: "#687076", textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── How it works step ────────────────────────────────────────────────────────
function HowItWorksStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#1B5E20",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>{step}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#11181C", marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontSize: 13, color: "#687076", lineHeight: 18 }}>{description}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ReferralDashboardScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id ? makeReferralCode(user.id) : "EKT------";
  const referralLink = `eketsupply.com/ref/${referralCode}`;

  async function copyCode() {
    await Clipboard.setStringAsync(referralCode);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function shareCode() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message =
      `🔧 I use EketSupply to book skilled artisans — plumbers, electricians, and more!\n\n` +
      `Use my referral code *${referralCode}* to get started:\n` +
      `${referralLink}\n\n` +
      `Fix it Right, The First Time.`;
    try {
      await Share.share({ message, title: "Join EketSupply" });
    } catch {
      // User cancelled
    }
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Referral Dashboard</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>Invite friends and earn rewards</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero banner */}
        <View
          style={{
            margin: 16,
            backgroundColor: "#1B5E20",
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
          }}
        >
          <Image source={DARK_LOGO} style={{ width: 180, height: Math.round(180 * (338 / 1365)), resizeMode: "contain" }} accessibilityLabel="EketSupply" />
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginTop: 12, lineHeight: 20 }}>
            Share EketSupply with friends and family. Every successful referral earns you rewards!
          </Text>
        </View>

        {/* Referral code card */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 0.5,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
            YOUR REFERRAL CODE
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#F0F7F0",
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 14,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#1B5E20", letterSpacing: 4 }}>
              {referralCode}
            </Text>
            <TouchableOpacity
              onPress={copyCode}
              style={{
                backgroundColor: copied ? "#1B5E20" : "#E8F5E9",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: copied ? "#fff" : "#1B5E20", fontWeight: "700", fontSize: 13 }}>
                {copied ? "✓ Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>{referralLink}</Text>

          {/* Share button */}
          <TouchableOpacity
            onPress={shareCode}
            style={{
              backgroundColor: "#1B5E20",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
              marginTop: 16,
              width: "100%",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>📤</Text>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Share My Code</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.foreground,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Your Referral Stats
          </Text>
          <View style={{ flexDirection: "row", borderTopWidth: 0.5, borderTopColor: colors.border }}>
            <StatCard emoji="👥" value="0" label="Friends Invited" />
            <View style={{ width: 0.5, backgroundColor: colors.border }} />
            <StatCard emoji="✅" value="0" label="Joined" />
            <View style={{ width: 0.5, backgroundColor: colors.border }} />
            <StatCard emoji="🎁" value="₦0" label="Rewards Earned" />
          </View>
          <View
            style={{
              backgroundColor: "#FFF8E1",
              margin: 12,
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>⏳</Text>
            <Text style={{ fontSize: 12, color: "#795548", flex: 1, lineHeight: 17 }}>
              Referral tracking is coming soon! Your code is active — start sharing now and your stats will appear here once the feature launches.
            </Text>
          </View>
        </View>

        {/* How it works */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            How It Works
          </Text>
          <HowItWorksStep
            step={1}
            title="Share your code"
            description="Send your unique referral code to friends via WhatsApp, SMS, or any messaging app."
          />
          <HowItWorksStep
            step={2}
            title="They sign up"
            description="Your friend downloads EketSupply and enters your code during registration."
          />
          <HowItWorksStep
            step={3}
            title="They book a service"
            description="Once they complete their first booking, your referral is confirmed."
          />
          <HowItWorksStep
            step={4}
            title="You both earn rewards"
            description="You receive a reward credit and your friend gets a discount on their first booking."
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
