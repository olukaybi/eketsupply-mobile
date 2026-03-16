/**
 * EketSupply Admin Dashboard
 *
 * Allows admin users to:
 * - Review pending artisan verification applications
 * - Approve or reject artisan profiles with reason
 * - View platform stats (bookings, revenue, active artisans)
 * - Monitor recent bookings and disputes
 *
 * Access: Only users with role = 'admin' in profiles table
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";
// Push notifications are sent server-side via the webhook handler
// No direct push-sender import needed in the mobile client

// ─── Types ────────────────────────────────────────────────────────────────────
interface PendingArtisan {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  skills: string[];
  hourly_rate: number;
  location: string;
  bio: string;
  verification_status: "pending" | "approved" | "rejected";
  id_type: string;
  id_number: string;
  id_document_url: string | null;
  selfie_url: string | null;
  bank_name: string | null;
  account_name: string | null;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

interface PlatformStats {
  totalBookings: number;
  totalRevenue: number;
  activeArtisans: number;
  pendingApplications: number;
  completedBookings: number;
  pendingBookings: number;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        margin: 4,
        borderLeftWidth: 4,
        borderLeftColor: color,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#11181C" }}>{value}</Text>
      <Text style={{ fontSize: 12, color: "#687076", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Artisan application card ─────────────────────────────────────────────────
function ArtisanCard({
  artisan,
  onApprove,
  onReject,
}: {
  artisan: PendingArtisan;
  onApprove: (a: PendingArtisan) => void;
  onReject: (a: PendingArtisan) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        {artisan.selfie_url && !imgError ? (
          <Image
            source={{ uri: artisan.selfie_url }}
            style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#1B5E20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {artisan.full_name?.charAt(0) ?? "A"}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C" }}>{artisan.full_name}</Text>
          <Text style={{ fontSize: 13, color: "#687076" }}>{artisan.profiles?.email ?? artisan.phone}</Text>
          <Text style={{ fontSize: 12, color: "#9BA1A6", marginTop: 2 }}>
            Applied {new Date(artisan.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#FFF3CD",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 11, color: "#856404", fontWeight: "600" }}>PENDING</Text>
        </View>
      </View>

      {/* Details */}
      <View style={{ backgroundColor: "#F8F9FA", borderRadius: 8, padding: 10, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: "#687076", width: 100 }}>Skills:</Text>
          <Text style={{ fontSize: 12, color: "#11181C", flex: 1 }}>
            {artisan.skills?.join(", ") ?? "Not specified"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: "#687076", width: 100 }}>Rate:</Text>
          <Text style={{ fontSize: 12, color: "#11181C" }}>
            ₦{artisan.hourly_rate?.toLocaleString() ?? "0"}/hr
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: "#687076", width: 100 }}>Location:</Text>
          <Text style={{ fontSize: 12, color: "#11181C" }}>{artisan.location ?? "Not specified"}</Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: "#687076", width: 100 }}>ID Type:</Text>
          <Text style={{ fontSize: 12, color: "#11181C" }}>
            {artisan.id_type ?? "Not provided"} — {artisan.id_number ?? ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 12, color: "#687076", width: 100 }}>Bank:</Text>
          <Text style={{ fontSize: 12, color: "#11181C" }}>
            {artisan.bank_name ?? "Not provided"} — {artisan.account_name ?? ""}
          </Text>
        </View>
      </View>

      {/* ID Document preview */}
      {artisan.id_document_url && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: "#687076", marginBottom: 6 }}>ID Document:</Text>
          <Image
            source={{ uri: artisan.id_document_url }}
            style={{ width: "100%", height: 140, borderRadius: 8, backgroundColor: "#F5F5F5" }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          onPress={() => onApprove(artisan)}
          style={{
            flex: 1,
            backgroundColor: "#1B5E20",
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReject(artisan)}
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: "#EF4444",
          }}
        >
          <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PlatformStats>({
    totalBookings: 0,
    totalRevenue: 0,
    activeArtisans: 0,
    pendingApplications: 0,
    completedBookings: 0,
    pendingBookings: 0,
  });
  const [pendingArtisans, setPendingArtisans] = useState<PendingArtisan[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "bookings">("overview");
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; artisan: PendingArtisan | null }>({
    visible: false,
    artisan: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/sign-in" as never);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      Alert.alert("Access Denied", "You don't have permission to access the admin dashboard.");
      router.back();
      return;
    }

    loadData();
  }

  // ─── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      await Promise.all([loadStats(), loadPendingArtisans()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function loadStats() {
    const [bookingsResult, artisansResult] = await Promise.all([
      supabase.from("bookings").select("status, payment_amount, payment_status"),
      supabase.from("artisans").select("verification_status"),
    ]);

    const bookings = bookingsResult.data ?? [];
    const artisans = artisansResult.data ?? [];

    const paidBookings = bookings.filter((b) => b.payment_status === "paid");
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.payment_amount ?? 0) * 0.15, 0);

    setStats({
      totalBookings: bookings.length,
      totalRevenue,
      activeArtisans: artisans.filter((a) => a.verification_status === "approved").length,
      pendingApplications: artisans.filter((a) => a.verification_status === "pending").length,
      completedBookings: bookings.filter((b) => b.status === "completed").length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
    });
  }

  async function loadPendingArtisans() {
    const { data, error } = await supabase
      .from("artisans")
      .select(`
        id, user_id, full_name, phone, skills, hourly_rate, location, bio,
        verification_status, id_type, id_number, id_document_url, selfie_url,
        bank_name, account_name, created_at,
        profiles!artisans_user_id_fkey(full_name, email)
      `)
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setPendingArtisans(data as unknown as PendingArtisan[]);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ─── Approve artisan ─────────────────────────────────────────────────────────
  async function handleApprove(artisan: PendingArtisan) {
    Alert.alert(
      "Approve Artisan",
      `Approve ${artisan.full_name} as a verified artisan on EketSupply?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from("artisans")
                .update({
                  verification_status: "approved",
                  verified: true,
                  verified_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", artisan.id);

              if (error) throw error;

              // Remove from pending list
              setPendingArtisans((prev) => prev.filter((a) => a.id !== artisan.id));
              setStats((prev) => ({
                ...prev,
                activeArtisans: prev.activeArtisans + 1,
                pendingApplications: prev.pendingApplications - 1,
              }));

              Alert.alert("Approved!", `${artisan.full_name} is now a verified artisan.`);
            } catch (err) {
              Alert.alert("Error", "Failed to approve artisan. Please try again.");
              console.error("[Admin] Approve error:", err);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  // ─── Reject artisan ──────────────────────────────────────────────────────────
  function openRejectModal(artisan: PendingArtisan) {
    setRejectReason("");
    setRejectModal({ visible: true, artisan });
  }

  async function handleRejectConfirm() {
    const artisan = rejectModal.artisan;
    if (!artisan) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("artisans")
        .update({
          verification_status: "rejected",
          rejection_reason: rejectReason || "Application did not meet our requirements.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", artisan.id);

      if (error) throw error;

      // Remove from pending list
      setPendingArtisans((prev) => prev.filter((a) => a.id !== artisan.id));
      setStats((prev) => ({
        ...prev,
        pendingApplications: prev.pendingApplications - 1,
      }));

      setRejectModal({ visible: false, artisan: null });
      Alert.alert("Rejected", `${artisan.full_name}'s application has been rejected.`);
    } catch (err) {
      Alert.alert("Error", "Failed to reject artisan. Please try again.");
      console.error("[Admin] Reject error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={{ marginTop: 12, color: "#687076" }}>Loading admin dashboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#1B5E20",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>Admin Dashboard</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
              EketSupply Platform Management
            </Text>
          </View>
          {stats.pendingApplications > 0 && (
            <View
              style={{
                backgroundColor: "#E65100",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                {stats.pendingApplications} Pending
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
          {(["overview", "applications", "bookings"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: activeTab === tab ? "#fff" : "rgba(255,255,255,0.2)",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: activeTab === tab ? "#1B5E20" : "#fff",
                  textTransform: "capitalize",
                }}
              >
                {tab === "applications" ? `Applications${stats.pendingApplications > 0 ? ` (${stats.pendingApplications})` : ""}` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F5F5" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C", marginBottom: 12 }}>
              Platform Overview
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
              <StatCard label="Total Bookings" value={stats.totalBookings} color="#1B5E20" />
              <StatCard
                label="Platform Revenue"
                value={`₦${stats.totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}
                color="#E65100"
              />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: 0 }}>
              <StatCard label="Active Artisans" value={stats.activeArtisans} color="#0a7ea4" />
              <StatCard label="Pending Applications" value={stats.pendingApplications} color="#F59E0B" />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: 0 }}>
              <StatCard label="Completed Jobs" value={stats.completedBookings} color="#22C55E" />
              <StatCard label="Pending Bookings" value={stats.pendingBookings} color="#687076" />
            </View>

            {stats.pendingApplications > 0 && (
              <TouchableOpacity
                onPress={() => setActiveTab("applications")}
                style={{
                  backgroundColor: "#FFF3CD",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#FBBF24",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#856404" }}>
                    {stats.pendingApplications} artisan{stats.pendingApplications !== 1 ? "s" : ""} awaiting review
                  </Text>
                  <Text style={{ fontSize: 13, color: "#856404", marginTop: 2 }}>
                    Tap to review and approve applications
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: "#856404" }}>→</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C", marginBottom: 12 }}>
              Pending Applications ({pendingArtisans.length})
            </Text>
            {pendingArtisans.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 32,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C" }}>
                  All caught up!
                </Text>
                <Text style={{ fontSize: 14, color: "#687076", textAlign: "center", marginTop: 4 }}>
                  No pending artisan applications to review.
                </Text>
              </View>
            ) : (
              <FlatList
                data={pendingArtisans}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ArtisanCard
                    artisan={item}
                    onApprove={handleApprove}
                    onReject={openRejectModal}
                  />
                )}
                scrollEnabled={false}
              />
            )}
          </>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C" }}>Bookings Overview</Text>
            <Text style={{ fontSize: 14, color: "#687076", textAlign: "center", marginTop: 8 }}>
              Full booking management coming soon. Use Supabase Dashboard → Table Editor → bookings to manage bookings directly.
            </Text>
            <View style={{ marginTop: 16, width: "100%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                <Text style={{ color: "#687076" }}>Total Bookings</Text>
                <Text style={{ fontWeight: "700", color: "#11181C" }}>{stats.totalBookings}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                <Text style={{ color: "#687076" }}>Completed</Text>
                <Text style={{ fontWeight: "700", color: "#22C55E" }}>{stats.completedBookings}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 }}>
                <Text style={{ color: "#687076" }}>Pending</Text>
                <Text style={{ fontWeight: "700", color: "#F59E0B" }}>{stats.pendingBookings}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Reject reason modal */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModal({ visible: false, artisan: null })}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#11181C", marginBottom: 6 }}>
              Reject Application
            </Text>
            <Text style={{ fontSize: 14, color: "#687076", marginBottom: 16 }}>
              Rejecting {rejectModal.artisan?.full_name}. Please provide a reason (optional):
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. ID document unclear, please resubmit with a clearer photo"
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: "#11181C",
                textAlignVertical: "top",
                marginBottom: 16,
                minHeight: 80,
              }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRejectModal({ visible: false, artisan: null })}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: "#E5E7EB",
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#687076", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRejectConfirm}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  backgroundColor: "#EF4444",
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
