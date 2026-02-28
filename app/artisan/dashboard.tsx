import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";

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

const STATUS_COLORS: Record<JobStatus, { bg: string; text: string; label: string }> = {
  pending:     { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  accepted:    { bg: "#DBEAFE", text: "#2563EB", label: "Accepted" },
  in_progress: { bg: "#E0F2FE", text: "#0284C7", label: "In Progress" },
  completed:   { bg: "#DCFCE7", text: "#16A34A", label: "Completed" },
  cancelled:   { bg: "#FEE2E2", text: "#DC2626", label: "Cancelled" },
};

// Placeholder jobs — will be replaced with real DB data
const PLACEHOLDER_JOBS: Job[] = [];

type StatCardProps = {
  label: string;
  value: string;
  icon: any;
  color: string;
};

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View className="flex-1 bg-background rounded-2xl p-4 border border-border">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: color + "20" }}
      >
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted mt-1">{label}</Text>
    </View>
  );
}

export default function ArtisanDashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [jobs] = useState<Job[]>(PLACEHOLDER_JOBS);

  const upcomingJobs = jobs.filter(j => ["pending", "accepted", "in_progress"].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === "completed");
  const displayJobs = activeTab === "upcoming" ? upcomingJobs : completedJobs;

  const totalEarnings = completedJobs.reduce((sum, j) => sum + j.amount, 0);

  const renderJob = ({ item }: { item: Job }) => {
    const statusStyle = STATUS_COLORS[item.status];
    return (
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}` as any)}
        className="bg-background rounded-2xl p-4 mb-3 border border-border"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{item.customerName}</Text>
            <Text className="text-sm text-muted">{item.service}</Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <Text style={{ color: statusStyle.text, fontSize: 11, fontWeight: "600" }}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-1">
          <IconSymbol name="clock.fill" size={13} color="#9BA1A6" />
          <Text className="text-xs text-muted ml-1">{item.date} at {item.time}</Text>
        </View>
        <View className="flex-row items-center mb-3">
          <IconSymbol name="location.fill" size={13} color="#9BA1A6" />
          <Text className="text-xs text-muted ml-1" numberOfLines={1}>{item.address}</Text>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-border">
          <Text className="text-base font-bold" style={{ color: "#1B5E20" }}>
            ₦{item.amount.toLocaleString()}
          </Text>
          <View className="flex-row gap-2">
            {item.status === "pending" && (
              <>
                <TouchableOpacity
                  className="rounded-full px-4 py-2 border border-border"
                >
                  <Text className="text-sm text-muted font-medium">Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: "#1B5E20" }}
                >
                  <Text className="text-white text-sm font-medium">Accept</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === "accepted" && (
              <TouchableOpacity
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: "#0284C7" }}
              >
                <Text className="text-white text-sm font-medium">Start Job</Text>
              </TouchableOpacity>
            )}
            {item.status === "in_progress" && (
              <TouchableOpacity
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: "#16A34A" }}
              >
                <Text className="text-white text-sm font-medium">Mark Complete</Text>
              </TouchableOpacity>
            )}
          </View>
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
          <View className="flex-row gap-3 mb-3">
            <StatCard
              label="Total Earnings"
              value={`₦${(totalEarnings * 0.85).toLocaleString()}`}
              icon="banknote.fill"
              color="#1B5E20"
            />
            <StatCard
              label="Jobs Done"
              value={completedJobs.length.toString()}
              icon="checkmark.circle.fill"
              color="#16A34A"
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label="Pending Jobs"
              value={upcomingJobs.filter(j => j.status === "pending").length.toString()}
              icon="clock.fill"
              color="#D97706"
            />
            <StatCard
              label="Rating"
              value="—"
              icon="star.fill"
              color="#E65100"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 py-3">
          <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
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

          {displayJobs.length === 0 ? (
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
