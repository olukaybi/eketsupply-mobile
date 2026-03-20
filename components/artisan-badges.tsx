import { View, Text } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import type { IconSymbolName } from "@/components/ui/icon-symbol";

type IconName = IconSymbolName;

export type BadgeType =
  | "jobs_milestone_50"
  | "jobs_milestone_100"
  | "jobs_milestone_500"
  | "rating_5_star"
  | "rating_top_rated"
  | "response_fast"
  | "response_instant"
  | "verified_pro"
  | "customer_favorite"
  | "quality_expert";

interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  iconName: IconName;
  color: string;
}

const BADGE_CONFIG: Record<BadgeType, Omit<Badge, "type">> = {
  jobs_milestone_50: {
    name: "50 Jobs",
    description: "Completed 50+ jobs",
    iconName: "target" as const,
    color: "#10B981",
  },
  jobs_milestone_100: {
    name: "100 Jobs",
    description: "Completed 100+ jobs",
    iconName: "checkmark.seal.fill" as const,
    color: "#8B5CF6",
  },
  jobs_milestone_500: {
    name: "500 Jobs",
    description: "Completed 500+ jobs",
    iconName: "trophy.fill" as const,
    color: "#F59E0B",
  },
  rating_5_star: {
    name: "5-Star Pro",
    description: "Perfect 5.0 rating",
    iconName: "star.fill" as const,
    color: "#EAB308",
  },
  rating_top_rated: {
    name: "Top Rated",
    description: "4.8+ rating with 50+ reviews",
    iconName: "star.circle.fill" as const,
    color: "#F59E0B",
  },
  response_fast: {
    name: "Fast Responder",
    description: "Responds within 1 hour",
    iconName: "bolt.fill" as const,
    color: "#3B82F6",
  },
  response_instant: {
    name: "Instant Reply",
    description: "Responds within 15 minutes",
    iconName: "bubble.left.fill" as const,
    color: "#06B6D4",
  },
  verified_pro: {
    name: "Verified Pro",
    description: "Identity and skills verified",
    iconName: "checkmark.shield.fill" as const,
    color: "#0EA5E9",
  },
  customer_favorite: {
    name: "Customer Favorite",
    description: "Highly recommended by customers",
    iconName: "heart.fill" as const,
    color: "#EF4444",
  },
  quality_expert: {
    name: "Quality Expert",
    description: "Consistently excellent work",
    iconName: "sparkles" as const,
    color: "#8B5CF6",
  },
};

interface ArtisanBadgesProps {
  badges: BadgeType[];
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
}

const SIZE_PX: Record<"small" | "medium" | "large", number> = {
  small: 14,
  medium: 18,
  large: 24,
};

const CONTAINER_SIZE: Record<"small" | "medium" | "large", number> = {
  small: 24,
  medium: 32,
  large: 48,
};

export function ArtisanBadges({
  badges,
  size = "medium",
  showDescription = false,
}: ArtisanBadgesProps) {
  if (badges.length === 0) return null;

  const iconSize = SIZE_PX[size];
  const containerSize = CONTAINER_SIZE[size];

  return (
    <View className="flex-row flex-wrap gap-2">
      {badges.map((badgeType) => {
        const badge = BADGE_CONFIG[badgeType];
        if (!badge) return null;

        return (
          <View
            key={badgeType}
            className={`${showDescription ? "flex-col" : "flex-row"} items-center gap-1`}
          >
            <View
              style={{
                width: containerSize,
                height: containerSize,
                borderRadius: containerSize / 2,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: badge.color + "20",
              }}
            >
              <AppIcon name={badge.iconName} size={iconSize} color={badge.color} />
            </View>
            {showDescription && (
              <View className="items-center">
                <Text className="text-xs font-semibold text-foreground">
                  {badge.name}
                </Text>
                <Text className="text-xs text-muted">{badge.description}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface BadgeProgressProps {
  currentJobs: number;
  currentRating: number;
  totalReviews: number;
}

export function BadgeProgress({
  currentJobs,
  currentRating,
  totalReviews,
}: BadgeProgressProps) {
  const progress = [];

  if (currentJobs < 50) {
    progress.push({ badge: BADGE_CONFIG.jobs_milestone_50, progress: currentJobs, target: 50, unit: "jobs" });
  } else if (currentJobs < 100) {
    progress.push({ badge: BADGE_CONFIG.jobs_milestone_100, progress: currentJobs, target: 100, unit: "jobs" });
  } else if (currentJobs < 500) {
    progress.push({ badge: BADGE_CONFIG.jobs_milestone_500, progress: currentJobs, target: 500, unit: "jobs" });
  }

  if (currentRating < 5.0 && totalReviews >= 10) {
    progress.push({ badge: BADGE_CONFIG.rating_5_star, progress: currentRating, target: 5.0, unit: "rating" });
  } else if (currentRating < 4.8 && totalReviews >= 50) {
    progress.push({ badge: BADGE_CONFIG.rating_top_rated, progress: currentRating, target: 4.8, unit: "rating" });
  }

  if (progress.length === 0) {
    return (
      <View className="bg-success/10 rounded-xl p-4 items-center">
        <AppIcon name="checkmark.circle.fill" size={36} color="#22C55E" />
        <Text className="text-success font-semibold mt-2">All badges earned!</Text>
        <Text className="text-muted text-sm mt-1">Keep up the great work!</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {progress.map((item, index) => {
        const percentage =
          item.unit === "jobs"
            ? (item.progress / item.target) * 100
            : ((item.progress - 4.0) / (item.target - 4.0)) * 100;

        return (
          <View key={index} className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center gap-3 mb-2">
              <View
                style={{
                  width: 40, height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: item.badge.color + "20",
                }}
              >
                <AppIcon name={item.badge.iconName} size={22} color={item.badge.color} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item.badge.name}</Text>
                <Text className="text-muted text-xs">{item.badge.description}</Text>
              </View>
            </View>

            <View className="bg-border rounded-full h-2 overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: item.badge.color }}
              />
            </View>

            <Text className="text-xs text-muted mt-2 text-center">
              {item.unit === "jobs"
                ? `${item.progress} / ${item.target} jobs completed`
                : `${item.progress.toFixed(1)} / ${item.target.toFixed(1)} rating`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export { BADGE_CONFIG };
