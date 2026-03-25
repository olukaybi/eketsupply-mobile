/**
 * EketSupply Go Live Compliance Checklist
 *
 * Internal admin screen for tracking pre-launch compliance requirements.
 * Checklist items are persisted in AsyncStorage so progress is saved across sessions.
 *
 * Access: Admin users only (role === 'admin' in profiles table)
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  critical: boolean; // Must be done before going live
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Legal & Corporate
  {
    id: "cac_registration",
    category: "Legal & Corporate",
    title: "CAC Business Registration",
    description:
      "Register EketSupply with the Corporate Affairs Commission (CAC) as a business name or limited liability company. Obtain Certificate of Incorporation.",
    critical: true,
  },
  {
    id: "tin_registration",
    category: "Legal & Corporate",
    title: "Tax Identification Number (TIN)",
    description:
      "Obtain a TIN from the Federal Inland Revenue Service (FIRS). Required for Paystack KYC and business bank account.",
    critical: true,
  },
  {
    id: "terms_privacy",
    category: "Legal & Corporate",
    title: "Terms of Service & Privacy Policy",
    description:
      "Publish legally reviewed Terms of Service and Privacy Policy pages on the website. Ensure they are linked from the app onboarding flow.",
    critical: true,
  },
  // Data Protection
  {
    id: "ndpc_filing",
    category: "Data Protection (NDPA 2023)",
    title: "NDPC Data Protection Compliance Filing",
    description:
      "File a Data Protection Compliance Audit with the Nigeria Data Protection Commission (NDPC). Appoint a Data Protection Officer (DPO) if processing data of 1,000+ users.",
    critical: true,
  },
  {
    id: "data_processing_agreement",
    category: "Data Protection (NDPA 2023)",
    title: "Data Processing Agreements with Third Parties",
    description:
      "Execute Data Processing Agreements (DPAs) with Supabase, Paystack, Sentry, and any other processors of Nigerian personal data.",
    critical: true,
  },
  {
    id: "cookie_consent",
    category: "Data Protection (NDPA 2023)",
    title: "Cookie Consent & Data Collection Notice",
    description:
      "Implement a cookie consent banner on the website. Add an in-app data collection notice during onboarding explaining what data is collected and why.",
    critical: false,
  },
  // Payments
  {
    id: "paystack_kyc",
    category: "Payments (Paystack)",
    title: "Paystack Business KYC Verification",
    description:
      "Complete Paystack's business KYC process: submit CAC certificate, TIN, director ID, and business bank account details. Required to activate live keys.",
    critical: true,
  },
  {
    id: "paystack_live_keys",
    category: "Payments (Paystack)",
    title: "Switch to Paystack Live Keys",
    description:
      "Replace PAYSTACK_SECRET_KEY and EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY in Secrets with live keys (sk_live_... / pk_live_...). Remove the TEST MODE banner from the payment modal.",
    critical: true,
  },
  {
    id: "paystack_webhook_live",
    category: "Payments (Paystack)",
    title: "Configure Paystack Live Webhook",
    description:
      "In the Paystack dashboard, set the live webhook URL to https://[your-domain]/api/webhooks/paystack and verify the webhook secret matches PAYSTACK_WEBHOOK_SECRET in Secrets.",
    critical: true,
  },
  {
    id: "artisan_subaccounts",
    category: "Payments (Paystack)",
    title: "Create Paystack Subaccounts for Artisans",
    description:
      "Each verified artisan must have a Paystack subaccount linked to their bank account for automatic revenue splitting. Run the subaccount creation script for all approved artisans.",
    critical: false,
  },
  // App Store
  {
    id: "google_play_listing",
    category: "App Distribution",
    title: "Google Play Store Listing",
    description:
      "Create a Google Play Console developer account, prepare app screenshots, description, and privacy policy URL. Submit the APK for review (typically 3–7 days).",
    critical: false,
  },
  {
    id: "apple_app_store_listing",
    category: "App Distribution",
    title: "Apple App Store Listing",
    description:
      "Enrol in the Apple Developer Program ($99/year), prepare App Store screenshots and metadata. Submit the IPA for App Store review (typically 1–3 days).",
    critical: false,
  },
  // Operations
  {
    id: "support_email_setup",
    category: "Operations",
    title: "Customer Support Email & Helpdesk",
    description:
      "Set up support@eketsupply.com with a helpdesk tool (e.g., Freshdesk free tier). Configure auto-responder with SLA: respond within 24 hours on business days.",
    critical: false,
  },
  {
    id: "sentry_alerts_live",
    category: "Operations",
    title: "Sentry Alert Rules Configured",
    description:
      "Verify Sentry alert rules are active: 'New Issue Detected' and 'High Error Rate >5/min' both notify info@eketsupply.com. Test by triggering a manual error.",
    critical: false,
  },
  {
    id: "backup_policy",
    category: "Operations",
    title: "Supabase Database Backup Policy",
    description:
      "Enable Point-in-Time Recovery (PITR) on the Supabase project (requires Pro plan). Set up weekly manual exports of the database as a fallback.",
    critical: false,
  },
];

const STORAGE_KEY = "eketsupply:go-live-checklist";

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoLiveScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Load persisted state
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setChecked(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  // Persist on every change
  const toggleItem = useCallback(
    async (id: string) => {
      const next = { ...checked, [id]: !checked[id] };
      setChecked(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [checked]
  );

  const handleReset = () => {
    Alert.alert(
      "Reset Checklist",
      "Are you sure you want to clear all completed items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setChecked({});
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  // Group items by category
  const categories = Array.from(
    new Set(CHECKLIST_ITEMS.map((i) => i.category))
  );

  const criticalItems = CHECKLIST_ITEMS.filter((i) => i.critical);
  const criticalDone = criticalItems.filter((i) => checked[i.id]).length;
  const totalDone = CHECKLIST_ITEMS.filter((i) => checked[i.id]).length;
  const allCriticalDone = criticalDone === criticalItems.length;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 12 }}
          >
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">
            Go Live Checklist
          </Text>
          <Text className="text-sm text-muted mt-1">
            Complete all critical items before switching Paystack to live mode.
          </Text>
        </View>

        {/* Progress Banner */}
        <View
          className={`mx-4 mt-3 mb-4 rounded-xl p-4 ${
            allCriticalDone ? "bg-success" : "bg-warning"
          }`}
        >
          <Text className="text-background font-bold text-base">
            {allCriticalDone
              ? "✅ All critical items complete — ready to go live!"
              : `⚠ ${criticalDone}/${criticalItems.length} critical items done`}
          </Text>
          <Text className="text-background text-sm mt-1 opacity-90">
            {totalDone}/{CHECKLIST_ITEMS.length} total items completed
          </Text>
          {/* Progress bar */}
          <View className="mt-2 h-2 bg-background rounded-full opacity-40">
            <View
              className="h-2 bg-background rounded-full"
              style={{
                width: `${(totalDone / CHECKLIST_ITEMS.length) * 100}%`,
                opacity: 1,
              }}
            />
          </View>
        </View>

        {/* Checklist by category */}
        {categories.map((category) => {
          const items = CHECKLIST_ITEMS.filter(
            (i) => i.category === category
          );
          const catDone = items.filter((i) => checked[i.id]).length;

          return (
            <View key={category} className="mb-2">
              {/* Category header */}
              <View className="px-4 py-2 flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
                  {category}
                </Text>
                <Text className="text-xs text-muted">
                  {catDone}/{items.length}
                </Text>
              </View>

              {/* Items */}
              {items.map((item) => {
                const isDone = !!checked[item.id];
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                    style={{ marginHorizontal: 16, marginBottom: 8 }}
                  >
                    <View
                      className={`rounded-xl p-4 border ${
                        isDone
                          ? "bg-surface border-success"
                          : item.critical
                          ? "bg-surface border-warning"
                          : "bg-surface border-border"
                      }`}
                    >
                      <View className="flex-row items-start">
                        {/* Checkbox */}
                        <View
                          className={`w-6 h-6 rounded-full border-2 mr-3 mt-0.5 items-center justify-center flex-shrink-0 ${
                            isDone
                              ? "bg-success border-success"
                              : "border-border"
                          }`}
                        >
                          {isDone && (
                            <Text className="text-background text-xs font-bold">
                              ✓
                            </Text>
                          )}
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <View className="flex-row items-center flex-wrap gap-2 mb-1">
                            <Text
                              className={`font-semibold text-sm ${
                                isDone ? "text-muted line-through" : "text-foreground"
                              }`}
                            >
                              {item.title}
                            </Text>
                            {item.critical && !isDone && (
                              <View className="bg-warning px-2 py-0.5 rounded-full">
                                <Text className="text-background text-xs font-bold">
                                  CRITICAL
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            className={`text-xs leading-relaxed ${
                              isDone ? "text-muted" : "text-muted"
                            }`}
                          >
                            {item.description}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Reset button */}
        <TouchableOpacity
          onPress={handleReset}
          activeOpacity={0.7}
          style={{ marginHorizontal: 16, marginTop: 8 }}
        >
          <View className="border border-error rounded-xl p-3 items-center">
            <Text className="text-error text-sm font-medium">
              Reset All Items
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
