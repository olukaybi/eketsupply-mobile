import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

type JobStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

type Job = {
  id: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  address: string;
  amount: number;
  status: JobStatus;
};

type DashboardStats = {
  totalEarnings: number;
  jobsDone: number;
  pendingJobs: number;
  rating: number | null;
  ratingCount: number;
};

const STATUS_COLORS: Record<JobStatus, { bg: string; text: string; label: string }> = {
  pending:     { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  accepted:    { bg: "#DBEAFE", text: "#2563EB", label: "Accepted" },
  in_progress: { bg: "#E0F2FE", text: "#0284C7", label: "In Progress" },
  completed:   { bg: "#DCFCE7", text: "#16A34A", label: "Completed" },
  cancelled:   { bg: "#FEE2E2", text: "#DC2626", label: "Cancelled" },
};

type StatCardProps = {
  label: string;
  value: string;
  icon: any;
  color: string;
  loading?: boolean;
};

function StatCard({ label, value, icon, color, loading }: StatCardProps) {
  return (
    <View className="flex-1 bg-background rounded-2xl p-4 border border-border">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: color + "20" }}
      >
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} style={{ marginBottom: 4 }} />
      ) : (
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
      )}
      <Text className="text-xs text-muted mt-1">{label}</Text>
    </View>
  );
}

export default function ArtisanDashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    jobsDone: 0,
    pendingJobs: 0,
    rating: null,
    ratingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [artisanId, setArtisanId] = useState<string | null>(null);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);

  // Resolve artisan record from auth user
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", String(user.id))
      .single()
      .then(({ data: profile }) => {
        if (!profile) return;
        const pid = (profile as { id: string }).id;
        supabase
          .from("artisans")
          .select("id")
          .eq("profile_id", pid)
          .single()
          .then(({ data: artisan }) => {
            if (artisan) setArtisanId((artisan as { id: string }).id);
          });
      });
  }, [user?.id]);

  // Refresh on tab focus
  useFocusEffect(
    useCallback(() => {
      if (artisanId) fetchDashboardData(artisanId);
    }, [artisanId]),
  );

  // Real-time: refresh when bookings change
  useEffect(() => {
    if (!artisanId) return;

    const channel = supabase
      .channel(`artisan_dashboard_${artisanId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `artisan_id=eq.${artisanId}`,
        },
        () => fetchDashboardData(artisanId),
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [artisanId]);

  async function fetchDashboardData(aid: string) {
    try {
      setLoading(true);

      // Fetch all bookings for this artisan
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          service_type,
          scheduled_date,
          scheduled_time,
          address,
          total_amount,
          status,
          payment_amount,
          customer:profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq("artisan_id", aid)
        .order("scheduled_date", { ascending: false });

      if (error || !bookings) {
        setLoading(false);
        return;
      }

      const mapped: Job[] = (bookings as any[]).map((b) => ({
        id: b.id,
        customerName: b.customer?.full_name || "Customer",
        service: b.service_type || "Service",
        date: b.scheduled_date
          ? new Date(b.scheduled_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
          : "TBD",
        time: b.scheduled_time || "TBD",
        address: b.address || "Address not provided",
        amount: b.total_amount || b.payment_amount || 0,
        status: b.status as JobStatus,
      }));

      setJobs(mapped);

      // Calculate stats
      const completed = mapped.filter((j) => j.status === "completed");
      const pending = mapped.filter((j) => j.status === "pending");
      const totalEarnings = completed.reduce((sum, j) => sum + j.amount * 0.85, 0);

      // Fetch average rating
      const { data: ratingData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("artisan_id", aid);

      const ratings = (ratingData as { rating: number }[] | null) || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

      setStats({
        totalEarnings,
        jobsDone: completed.length,
        pendingJobs: pending.length,
        rating: avgRating,
        ratingCount: ratings.length,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateJobStatus(jobId: string, newStatus: JobStatus) {
    try {
      setUpdatingJob(jobId);
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) {
        Alert.alert("Error", "Could not update job status. Please try again.");
        return;
      }

      // Optimistic update
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)),
      );

      if (newStatus === "completed") {
        Alert.alert("Job Completed! 🎉", "Great work! Your payment will be settled within 24-48 hours.");
      }
    } catch (err) {
      console.error("Error updating job status:", err);
    } finally {
      setUpdatingJob(null);
    }
  }

  function confirmDecline(jobId: string) {
    Alert.alert(
      "Decline Job",
      "Are you sure you want to decline this booking?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Decline", style: "destructive", onPress: () => updateJobStatus(jobId, "cancelled") },
      ],
    );
  }

  const upcomingJobs = jobs.filter((j) => ["pending", "accepted", "in_progress"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const displayJobs = activeTab === "upcoming" ? upcomingJobs : completedJobs;

  const renderJob = ({ item }: { item: Job }) => {
    const statusStyle = STATUS_COLORS[item.status];
    const isUpdating = updatingJob === item.id;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}` as any)}
        className="bg-background rounded-2xl p-4 mb-3 border border-border"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-base font-semibold text-foreground">{item.customerName}</Text>
            <Text className="text-sm text-muted">{item.service}</Text>
          </View>
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusStyle.bg }}>
            <Text style={{ color: statusStyle.text, fontSize: 11, fontWeight: "600" }}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <IconSymbol name="clock.fill" size={13} color="#9BA1A6" />
          <Text className="text-xs text-muted ml-1">{item.date} at {item.time}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <IconSymbol name="location.fill" size={13} color="#9BA1A6" />
          <Text className="text-xs text-muted ml-1" numberOfLines={1}>{item.address}</Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#E5E7EB" }}>
          <View>
            <Text className="text-base font-bold" style={{ color: "#1B5E20" }}>
              ₦{(item.amount * 0.85).toLocaleString()}
            </Text>
            <Text className="text-xs text-muted">Your share (85%)</Text>
          </View>

          {isUpdating ? (
            <ActivityIndicator size="small" color="#1B5E20" />
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {item.status === "pending" && (
                <>
                  <TouchableOpacity
                    onPress={() => confirmDecline(item.id)}
                    className="rounded-full px-4 py-2 border border-border"
                  >
                    <Text className="text-sm text-muted font-medium">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateJobStatus(item.id, "accepted")}
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: "#1B5E20" }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>Accept</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === "accepted" && (
                <TouchableOpacity
                  onPress={() => updateJobStatus(item.id, "in_progress")}
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: "#0284C7" }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>Start Job</Text>
                </TouchableOpacity>
              )}
              {item.status === "in_progress" && (
                <TouchableOpacity
                  onPress={() => updateJobStatus(item.id, "completed")}
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: "#16A34A" }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>Mark Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-4" style={{ backgroundColor: "#1B5E20" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-3"
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <IconSymbol name="arrow.left" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Artisan Dashboard</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </Text>
        </View>

        {/* Stats */}
        <View className="px-4 pt-4 pb-2">
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <StatCard
              label="Total Earnings"
              value={`₦${stats.totalEarnings.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}
              icon="banknote.fill"
              color="#1B5E20"
              loading={loading}
            />
            <StatCard
              label="Jobs Done"
              value={stats.jobsDone.toString()}
              icon="checkmark.circle.fill"
              color="#16A34A"
              loading={loading}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard
              label="Pending Jobs"
              value={stats.pendingJobs.toString()}
              icon="clock.fill"
              color="#D97706"
              loading={loading}
            />
            <StatCard
              label="Rating"
              value={
                stats.rating !== null
                  ? `${stats.rating.toFixed(1)} ★`
                  : "—"
              }
              icon="star.fill"
              color="#E65100"
              loading={loading}
            />
          </View>
          {stats.ratingCount > 0 && (
            <Text className="text-xs text-muted mt-2 text-center">
              Based on {stats.ratingCount} review{stats.ratingCount !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-4 py-3">
          <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Quick Actions</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push("/portfolio-manager" as any)}
              className="flex-1 rounded-2xl p-4 items-center border border-border bg-background"
            >
              <IconSymbol name="photo.fill" size={24} color="#1B5E20" />
              <Text className="text-xs font-medium text-foreground mt-2 text-center">My Portfolio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/verification-upload" as any)}
              className="flex-1 rounded-2xl p-4 items-center border border-border bg-background"
            >
              <IconSymbol name="shield.fill" size={24} color="#1B5E20" />
              <Text className="text-xs font-medium text-foreground mt-2 text-center">Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/artisan/bank-details" as any)}
              className="flex-1 rounded-2xl p-4 items-center border border-border bg-background"
            >
              <IconSymbol name="banknote.fill" size={24} color="#1B5E20" />
              <Text className="text-xs font-medium text-foreground mt-2 text-center">Bank Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Jobs List */}
        <View className="px-4 pt-2 pb-6">
          {/* Tab Toggle */}
          <View className="flex-row bg-surface rounded-xl p-1 mb-4">
            <TouchableOpacity
              onPress={() => setActiveTab("upcoming")}
              className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === "upcoming" ? "bg-background" : ""}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === "upcoming" ? "text-foreground" : "text-muted"}`}>
                Upcoming ({upcomingJobs.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("completed")}
              className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === "completed" ? "bg-background" : ""}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === "completed" ? "text-foreground" : "text-muted"}`}>
                Completed ({completedJobs.length})
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#1B5E20" />
              <Text className="text-muted mt-3 text-sm">Loading jobs...</Text>
            </View>
          ) : displayJobs.length === 0 ? (
            <View className="items-center py-12">
              <IconSymbol name="calendar" size={48} color="#D4E0D4" />
              <Text className="text-base font-semibold text-foreground mt-4 mb-2">
                {activeTab === "upcoming" ? "No Upcoming Jobs" : "No Completed Jobs"}
              </Text>
              <Text className="text-sm text-muted text-center">
                {activeTab === "upcoming"
                  ? "New booking requests will appear here once customers find your profile."
                  : "Your completed jobs will be shown here."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayJobs}
              renderItem={renderJob}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
