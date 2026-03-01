import { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";

type Conversation = {
  id: string;          // booking id
  bookingId: string;
  otherPersonName: string;
  otherPersonInitial: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  serviceType: string;
  bookingStatus: string;
};

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Resolve profiles.id from auth user id
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", String(user.id))
      .single()
      .then(({ data }) => {
        if (data) setProfileId((data as { id: string }).id);
      });
  }, [user?.id]);

  // Fetch conversations whenever the tab is focused
  useFocusEffect(
    useCallback(() => {
      if (profileId) fetchConversations(profileId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileId]),
  );

  // Real-time: refresh when a new chat message arrives
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel("messages_tab_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => fetchConversations(profileId),
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function fetchConversations(pid: string) {
    try {
      setLoading(true);

      // Fetch all confirmed/active bookings for this user (as customer or artisan)
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          service_type,
          status,
          customer_id,
          artisan_id,
          customer:profiles!bookings_customer_id_fkey(id, full_name),
          artisan:artisans!bookings_artisan_id_fkey(
            id,
            profile:profiles!artisans_profile_id_fkey(id, full_name)
          )
        `)
        .or(`customer_id.eq.${pid},artisan_id.in.(select id from artisans where profile_id='${pid}')`)
        .in("status", ["confirmed", "in_progress", "completed"])
        .order("updated_at", { ascending: false });

      if (error || !bookings) {
        setLoading(false);
        return;
      }

      // For each booking, get the latest message and unread count
      const convos: Conversation[] = await Promise.all(
        (bookings as any[]).map(async (booking) => {
          const isCustomer = booking.customer_id === pid;

          // Other person's name
          let otherName = "Unknown";
          if (isCustomer) {
            otherName = booking.artisan?.profile?.full_name || "Artisan";
          } else {
            otherName = booking.customer?.full_name || "Customer";
          }

          // Latest message
          const { data: lastMsgData } = await supabase
            .from("chat_messages")
            .select("message, created_at, sender_id")
            .eq("booking_id", booking.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const lastMsg = lastMsgData as { message: string; created_at: string; sender_id: string } | null;

          // Unread count (messages not from me that are unread)
          const { count: unread } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("booking_id", booking.id)
            .eq("read", false)
            .neq("sender_id", pid);

          const lastTime = lastMsg?.created_at
            ? formatMessageTime(lastMsg.created_at)
            : "";

          return {
            id: booking.id,
            bookingId: booking.id,
            otherPersonName: otherName,
            otherPersonInitial: otherName[0]?.toUpperCase() || "?",
            lastMessage: lastMsg?.message || "No messages yet",
            lastMessageTime: lastTime,
            unreadCount: unread ?? 0,
            serviceType: booking.service_type || "Service",
            bookingStatus: booking.status,
          } as Conversation;
        }),
      );

      // Sort by most recent message (bookings with messages first)
      convos.sort((a, b) => (b.unreadCount - a.unreadCount));
      setConversations(convos);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatMessageTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  }

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
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            {item.otherPersonInitial}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className="text-base text-foreground"
              style={{ fontWeight: item.unreadCount > 0 ? "700" : "600" }}
            >
              {item.otherPersonName}
            </Text>
            <Text className="text-xs text-muted">{item.lastMessageTime}</Text>
          </View>
          <Text className="text-xs text-muted mb-1">{item.serviceType}</Text>
          <Text
            className="text-sm"
            style={{ color: item.unreadCount > 0 ? "#1B5E20" : "#687076", fontWeight: item.unreadCount > 0 ? "600" : "400" }}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        {/* Unread badge */}
        {item.unreadCount > 0 && (
          <View
            className="ml-2 rounded-full items-center justify-center"
            style={{ backgroundColor: "#E65100", minWidth: 20, height: 20, paddingHorizontal: 5 }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
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
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Sign In</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Messages</Text>
        <Text className="text-sm text-muted mt-1">
          {conversations.length > 0
            ? `${conversations.filter((c) => c.unreadCount > 0).length} unread conversation${conversations.filter((c) => c.unreadCount > 0).length !== 1 ? "s" : ""}`
            : "Chat with your artisans"}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text className="text-muted mt-3 text-sm">Loading conversations...</Text>
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
            <Text style={{ color: "#fff", fontWeight: "600" }}>Browse Services</Text>
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
