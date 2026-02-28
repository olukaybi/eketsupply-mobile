import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Conversation = {
  id: string;
  bookingId: string;
  otherPersonName: string;
  otherPersonInitial: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  serviceType: string;
  bookingStatus: "confirmed" | "in_progress" | "completed";
};

// Placeholder data — will be replaced with real DB data
const PLACEHOLDER_CONVERSATIONS: Conversation[] = [];

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(PLACEHOLDER_CONVERSATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // TODO: Fetch conversations from DB
    setLoading(false);
  }, [user]);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${item.bookingId}` as any)}
      style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 }}
      className="border-border bg-background"
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#1B5E20" }}
        >
          <Text className="text-white text-lg font-bold">{item.otherPersonInitial}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-semibold text-foreground">{item.otherPersonName}</Text>
            <Text className="text-xs text-muted">{item.lastMessageTime}</Text>
          </View>
          <Text className="text-xs text-muted mb-1">{item.serviceType}</Text>
          <Text className="text-sm text-muted" numberOfLines={1}>{item.lastMessage}</Text>
        </View>

        {/* Unread badge */}
        {item.unreadCount > 0 && (
          <View
            className="ml-2 rounded-full items-center justify-center"
            style={{ backgroundColor: "#1B5E20", minWidth: 20, height: 20, paddingHorizontal: 5 }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
              {item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <IconSymbol name="message.fill" size={48} color="#D4E0D4" />
        <Text className="text-xl font-bold text-foreground mt-4 mb-2">Your Messages</Text>
        <Text className="text-muted text-center mb-6">
          Sign in to view your conversations with artisans
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/sign-in" as any)}
          className="rounded-full px-8 py-3"
          style={{ backgroundColor: "#1B5E20" }}
        >
          <Text className="text-white font-semibold text-base">Sign In</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Messages</Text>
        <Text className="text-sm text-muted mt-1">Chat with your artisans</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <IconSymbol name="message.fill" size={56} color="#D4E0D4" />
          <Text className="text-lg font-semibold text-foreground mt-4 mb-2">No Messages Yet</Text>
          <Text className="text-muted text-center text-sm">
            Once you book a service, you can chat directly with your artisan here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/" as any)}
            className="mt-6 rounded-full px-6 py-3"
            style={{ backgroundColor: "#1B5E20" }}
          >
            <Text className="text-white font-semibold">Browse Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
