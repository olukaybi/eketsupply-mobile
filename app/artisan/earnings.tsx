/**
 * Artisan Earnings Dashboard
 *
 * Shows:
 * - Total earnings (lifetime, this month, this week)
 * - Pending payout amount
 * - Transaction history list (completed bookings)
 * - Platform fee breakdown (15% EketSupply, 85% artisan)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";
import { AppIcon } from "@/components/ui/app-icon";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EarningsTransaction {
  id: string;
  customerName: string;
  service: string;
  date: string;
  grossAmount: number;
  netAmount: number;
  platformFee: number;
  status: "completed" | "pending" | "cancelled";
  paymentStatus: string;
}

interface EarningsSummary {
  lifetimeNet: number;
  thisMonthNet: number;
  thisWeekNet: number;
  pendingPayout: number;
  completedCount: number;
  pendingCount: number;
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        margin: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${color}20`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <AppIcon name={icon as any} size={16} color={color} />
        </View>
        <Text style={{ fontSize: 11, color: "#687076", fontWeight: "600", flex: 1 }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#11181C" }}>{value}</Text>
      {sub && <Text style={{ fontSize: 11, color: "#9BA1A6", marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TransactionRow({ tx }: { tx: EarningsTransaction }) {
  const statusColor =
    tx.status === "completed" ? "#22C55E" :
    tx.status === "pending" ? "#F59E0B" : "#9BA1A6";

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Left: icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: tx.status === "completed" ? "#DCFCE7" : "#FEF3C7",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <AppIcon
          name={tx.status === "completed" ? "checkmark.circle.fill" : "clock.fill"}
          size={20}
          color={statusColor}
        />
      </View>

      {/* Middle: details */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#11181C" }} numberOfLines={1}>
          {tx.service}
        </Text>
        <Text style={{ fontSize: 12, color: "#687076", marginTop: 1 }} numberOfLines={1}>
          {tx.customerName} · {tx.date}
        </Text>
        <Text style={{ fontSize: 11, color: "#9BA1A6", marginTop: 1 }}>
          Gross ₦{tx.grossAmount.toLocaleString()} · Fee ₦{tx.platformFee.toLocaleString()}
        </Text>
      </View>

      {/* Right: net amount */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: statusColor }}>
          +₦{tx.netAmount.toLocaleString()}
        </Text>
        <View
          style={{
            backgroundColor: `${statusColor}20`,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: statusColor, textTransform: "uppercase" }}>
            {tx.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EarningsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<EarningsSummary>({
    lifetimeNet: 0,
    thisMonthNet: 0,
    thisWeekNet: 0,
    pendingPayout: 0,
    completedCount: 0,
    pendingCount: 0,
  });
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

  const PLATFORM_FEE_RATE = 0.15; // 15% platform fee
  const ARTISAN_RATE = 1 - PLATFORM_FEE_RATE;

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get artisan record
      const { data: artisan } = await supabase
        .from("artisans")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!artisan) return;

      // Fetch all bookings for this artisan
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, service_type, scheduled_date, status, total_amount, payment_amount, payment_status, profiles!bookings_customer_id_fkey(full_name)")
        .eq("artisan_id", artisan.id)
        .order("scheduled_date", { ascending: false });

      const rows = (bookings as any[]) ?? [];

      // Build transaction list
      const txList: EarningsTransaction[] = rows.map((b) => {
        const gross = b.total_amount || b.payment_amount || 0;
        const fee = Math.round(gross * PLATFORM_FEE_RATE);
        const net = Math.round(gross * ARTISAN_RATE);
        const dateStr = b.scheduled_date
          ? new Date(b.scheduled_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
          : "TBD";
        return {
          id: b.id,
          customerName: b.profiles?.full_name ?? "Customer",
          service: b.service_type ?? "Service",
          date: dateStr,
          grossAmount: gross,
          netAmount: net,
          platformFee: fee,
          status: b.status as "completed" | "pending" | "cancelled",
          paymentStatus: b.payment_status ?? "unknown",
        };
      });

      setTransactions(txList);

      // Calculate summary
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const completed = txList.filter((t) => t.status === "completed");
      const pending = txList.filter((t) => t.status === "pending");

      const lifetimeNet = completed.reduce((s, t) => s + t.netAmount, 0);
      const thisMonthNet = completed
        .filter((t) => {
          const row = rows.find((r) => r.id === t.id);
          return row?.scheduled_date && new Date(row.scheduled_date) >= startOfMonth;
        })
        .reduce((s, t) => s + t.netAmount, 0);
      const thisWeekNet = completed
        .filter((t) => {
          const row = rows.find((r) => r.id === t.id);
          return row?.scheduled_date && new Date(row.scheduled_date) >= startOfWeek;
        })
        .reduce((s, t) => s + t.netAmount, 0);
      const pendingPayout = pending.reduce((s, t) => s + t.netAmount, 0);

      setSummary({
        lifetimeNet,
        thisMonthNet,
        thisWeekNet,
        pendingPayout,
        completedCount: completed.length,
        pendingCount: pending.length,
      });
    } catch (err) {
      console.error("[Earnings] Load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredTx = transactions.filter((t) => {
    if (filter === "all") return t.status !== "cancelled";
    return t.status === filter;
  });

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
      <View style={{ backgroundColor: "#1B5E20", padding: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <AppIcon name="chevron.left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", flex: 1 }}>My Earnings</Text>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: "#fff", fontWeight: "700" }}>85% PAYOUT</Text>
          </View>
        </View>

        {/* Hero total */}
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Lifetime Earnings</Text>
          <Text style={{ fontSize: 36, fontWeight: "900", color: "#fff" }}>
            ₦{summary.lifetimeNet.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
            {summary.completedCount} completed job{summary.completedCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredTx}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            {/* Summary cards */}
            <View style={{ flexDirection: "row", marginHorizontal: -4, marginBottom: 4 }}>
              <SummaryCard
                label="This Month"
                value={`₦${summary.thisMonthNet.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}
                color="#1B5E20"
                icon="calendar"
              />
              <SummaryCard
                label="This Week"
                value={`₦${summary.thisWeekNet.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}
                color="#0a7ea4"
                icon="clock.fill"
              />
            </View>
            <View style={{ flexDirection: "row", marginHorizontal: -4, marginBottom: 16 }}>
              <SummaryCard
                label="Pending Payout"
                value={`₦${summary.pendingPayout.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}
                sub={`${summary.pendingCount} job${summary.pendingCount !== 1 ? "s" : ""} in progress`}
                color="#F59E0B"
                icon="banknote.fill"
              />
              <SummaryCard
                label="Platform Fee"
                value="15%"
                sub="85% goes to you"
                color="#687076"
                icon="percent"
              />
            </View>

            {/* Fee breakdown info */}
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#BBF7D0",
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <AppIcon name="info.circle.fill" size={18} color="#1B5E20" style={{ marginRight: 10, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1B5E20", marginBottom: 2 }}>
                  How payouts work
                </Text>
                <Text style={{ fontSize: 12, color: "#166534", lineHeight: 18 }}>
                  EketSupply retains 15% as a platform fee. Your 85% is settled to your registered bank account within 24–48 hours of payment confirmation via Paystack.
                </Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={{ flexDirection: "row", backgroundColor: "#F5F5F5", borderRadius: 12, padding: 4, marginBottom: 12 }}>
              {(["all", "completed", "pending"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 9,
                    alignItems: "center",
                    backgroundColor: filter === f ? "#fff" : "transparent",
                    shadowColor: filter === f ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: filter === f ? 1 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: filter === f ? "700" : "500",
                      color: filter === f ? "#1B5E20" : "#687076",
                      textTransform: "capitalize",
                    }}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 14, fontWeight: "700", color: "#11181C", marginBottom: 8 }}>
              Transaction History
            </Text>
          </>
        }
        renderItem={({ item }) => <TransactionRow tx={item} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <AppIcon name="banknote.fill" size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C" }}>No transactions yet</Text>
            <Text style={{ fontSize: 14, color: "#687076", textAlign: "center", marginTop: 4 }}>
              {filter === "all"
                ? "Complete your first booking to see earnings here."
                : `No ${filter} transactions found.`}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
