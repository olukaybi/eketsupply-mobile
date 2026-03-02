/**
 * EketSupply What's New Screen
 *
 * Displays a chronological changelog of app updates and new features.
 *
 * Route: /whats-new
 */

import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedLogo } from "@/components/themed-logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// ─── Changelog data ───────────────────────────────────────────────────────────
const CHANGELOG: Array<{
  version: string;
  date: string;
  badge?: "new" | "improved" | "fixed";
  highlights: Array<{ emoji: string; title: string; description: string }>;
}> = [
  {
    version: "1.4",
    date: "March 2026",
    badge: "new",
    highlights: [
      {
        emoji: "📊",
        title: "Referral Dashboard",
        description: "Track your personal referral code, share it with friends, and see your rewards in one place.",
      },
      {
        emoji: "🔔",
        title: "Notification Preferences",
        description: "Choose exactly which alerts you want — booking updates, messages, payments, and more.",
      },
      {
        emoji: "📋",
        title: "Copy Booking Reference",
        description: "Tap the new Copy button on your booking confirmation to instantly copy your reference number.",
      },
      {
        emoji: "📤",
        title: "Share Booking",
        description: "Share your confirmed booking details and referral code via WhatsApp, SMS, or any app.",
      },
    ],
  },
  {
    version: "1.3",
    date: "February 2026",
    badge: "improved",
    highlights: [
      {
        emoji: "🌙",
        title: "Dark Mode Toggle",
        description: "Switch between light and dark themes directly from your Profile without changing device settings.",
      },
      {
        emoji: "🎨",
        title: "Branded App Icon",
        description: "The EketSupply wrench emblem is now your app icon and splash screen for instant recognition.",
      },
      {
        emoji: "🖼️",
        title: "Logo Across All Screens",
        description: "The EketSupply logo now appears on the Home, Onboarding, Auth, Artisan Dashboard, and Admin screens.",
      },
      {
        emoji: "⭐",
        title: "In-App Store Review",
        description: "After submitting a 4 or 5 star review, you'll be prompted to rate EketSupply on the App Store.",
      },
    ],
  },
  {
    version: "1.2",
    date: "January 2026",
    badge: "improved",
    highlights: [
      {
        emoji: "💬",
        title: "Real-Time Chat",
        description: "Message your artisan directly from the booking detail screen with live updates.",
      },
      {
        emoji: "📍",
        title: "Artisan Location Map",
        description: "See your artisan's location on a live map while they're on the way to your address.",
      },
      {
        emoji: "💳",
        title: "Paystack Payment Integration",
        description: "Pay securely with card, bank transfer, or USSD via Paystack's trusted payment gateway.",
      },
    ],
  },
  {
    version: "1.1",
    date: "December 2025",
    badge: "fixed",
    highlights: [
      {
        emoji: "🔍",
        title: "Improved Artisan Search",
        description: "Search now filters by skill, location, and rating simultaneously for faster discovery.",
      },
      {
        emoji: "📅",
        title: "Booking Calendar",
        description: "Pick your preferred date and time from an interactive calendar when booking a service.",
      },
      {
        emoji: "🛡️",
        title: "Artisan Verification Badges",
        description: "Verified artisans now display a badge on their profile so you can book with confidence.",
      },
    ],
  },
  {
    version: "1.0",
    date: "November 2025",
    highlights: [
      {
        emoji: "🚀",
        title: "EketSupply Launches!",
        description: "Find and book skilled artisans — plumbers, electricians, carpenters, and more — in minutes.",
      },
      {
        emoji: "👷",
        title: "Artisan Profiles",
        description: "Browse detailed artisan profiles with skills, ratings, reviews, and portfolio photos.",
      },
      {
        emoji: "📱",
        title: "Artisan App",
        description: "Artisans can register, manage bookings, upload portfolios, and track earnings from the same app.",
      },
    ],
  },
];

// ─── Badge component ──────────────────────────────────────────────────────────
function Badge({ type }: { type: "new" | "improved" | "fixed" }) {
  const config = {
    new: { bg: "#E8F5E9", text: "#1B5E20", label: "NEW" },
    improved: { bg: "#E3F2FD", text: "#1565C0", label: "IMPROVED" },
    fixed: { bg: "#FFF3E0", text: "#E65100", label: "FIXED" },
  }[type];
  return (
    <View style={{ backgroundColor: config.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: "800", color: config.text, letterSpacing: 0.8 }}>
        {config.label}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WhatsNewScreen() {
  const colors = useColors();

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
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>What's New</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>Latest features and updates</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 20 }}>
          <ThemedLogo width={200} />
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>
            Version history and release notes
          </Text>
        </View>

        {/* Changelog entries */}
        {CHANGELOG.map((release, index) => (
          <View
            key={release.version}
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            {/* Version header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: index === 0 ? "#1B5E20" : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: index === 0 ? "#fff" : colors.muted }}>
                  v{release.version}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    Version {release.version}
                  </Text>
                  {release.badge && <Badge type={release.badge} />}
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{release.date}</Text>
              </View>
            </View>

            {/* Highlights */}
            {release.highlights.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: i < release.highlights.length - 1 ? 0.5 : 0,
                  borderBottomColor: colors.border,
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 22, marginTop: 1 }}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 2 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginHorizontal: 24,
            lineHeight: 18,
          }}
        >
          Have feedback or found a bug? Contact us at{" "}
          <Text style={{ color: "#1B5E20", fontWeight: "600" }}>support@eketsupply.com</Text>
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
