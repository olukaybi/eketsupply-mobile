/**
 * EketSupply Notification Preferences Screen
 *
 * Lets users choose which notification types they want to receive.
 * Preferences are stored in AsyncStorage and respected by the notification service.
 *
 * Route: /notification-preferences
 */

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NotificationPreferences {
  booking_updates: boolean;
  new_messages: boolean;
  payment_alerts: boolean;
  promotional: boolean;
  artisan_status: boolean;
  review_reminders: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  booking_updates: true,
  new_messages: true,
  payment_alerts: true,
  promotional: false,
  artisan_status: true,
  review_reminders: true,
};

const STORAGE_KEY = "eketsupply_notification_prefs";

export async function getNotificationPrefs(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// ─── Preference items ─────────────────────────────────────────────────────────
const PREF_ITEMS: Array<{
  key: keyof NotificationPreferences;
  icon: any;
  label: string;
  description: string;
  critical?: boolean;
}> = [
  {
    key: "booking_updates",
    icon: "doc.text.fill",
    label: "Booking Updates",
    description: "Confirmations, cancellations, and status changes for your bookings",
    critical: true,
  },
  {
    key: "new_messages",
    icon: "paperplane.fill",
    label: "New Messages",
    description: "Chat messages from artisans and EketSupply support",
  },
  {
    key: "payment_alerts",
    icon: "lock.fill",
    label: "Payment Alerts",
    description: "Payment confirmations, receipts, and refund updates",
    critical: true,
  },
  {
    key: "artisan_status",
    icon: "house.fill",
    label: "Artisan Status",
    description: "When your artisan is on the way, has arrived, or completed the job",
  },
  {
    key: "review_reminders",
    icon: "bell.fill",
    label: "Review Reminders",
    description: "Reminders to rate your artisan after a completed job",
  },
  {
    key: "promotional",
    icon: "info.circle.fill",
    label: "Promotions & Offers",
    description: "Special deals, discounts, and new features from EketSupply",
  },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NotificationPreferencesScreen() {
  const colors = useColors();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPrefs().then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, []);

  async function togglePref(key: keyof NotificationPreferences, value: boolean) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await saveNotificationPrefs(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      </ScreenContainer>
    );
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
        >
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            Notification Preferences
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
            Choose which alerts you want to receive
          </Text>
        </View>
        {saving && <ActivityIndicator size="small" color="#1B5E20" />}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Info banner */}
        <View
          style={{
            margin: 16,
            backgroundColor: "#F0F7F0",
            borderRadius: 12,
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 18 }}>💡</Text>
          <Text style={{ fontSize: 13, color: "#1B5E20", flex: 1, lineHeight: 19 }}>
            Critical notifications (Booking Updates and Payment Alerts) are always sent to ensure you never miss important information.
          </Text>
        </View>

        {/* Preference toggles */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 0.5,
            borderColor: colors.border,
          }}
        >
          {PREF_ITEMS.map((item, index) => (
            <View
              key={item.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < PREF_ITEMS.length - 1 ? 0.5 : 0,
                borderBottomColor: colors.border,
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: item.critical ? "#E8F5E9" : "#F5F5F5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <IconSymbol
                  name={item.icon}
                  size={18}
                  color={item.critical ? "#1B5E20" : "#687076"}
                />
              </View>

              {/* Text */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                    {item.label}
                  </Text>
                  {item.critical && (
                    <View
                      style={{
                        backgroundColor: "#1B5E20",
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                      }}
                    >
                      <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700", letterSpacing: 0.5 }}>
                        CRITICAL
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 }}>
                  {item.description}
                </Text>
              </View>

              {/* Toggle */}
              <Switch
                value={prefs[item.key]}
                onValueChange={(val) => {
                  if (item.critical) return; // Critical prefs cannot be disabled
                  togglePref(item.key, val);
                }}
                disabled={item.critical}
                trackColor={{ false: colors.border, true: "#1B5E20" }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Footer note */}
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginTop: 20,
            marginHorizontal: 24,
            lineHeight: 18,
          }}
        >
          Preferences are saved automatically. You can also manage notifications in your device Settings.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
