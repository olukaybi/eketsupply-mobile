import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import * as Haptics from "expo-haptics";

type Message = {
  id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function ChatScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherPersonName, setOtherPersonName] = useState("User");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user && bookingId) {
      fetchMessages();
      fetchBookingDetails();
      subscribeToMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookingId]);

  async function fetchBookingDetails() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          customer_id,
          artisan_id,
          customer:profiles!bookings_customer_id_fkey(full_name),
          artisan:artisans!bookings_artisan_id_fkey(
            profiles!artisans_profile_id_fkey(full_name)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error || !data) return;

      // Determine if current user is customer or artisan
      const isCustomer = data.customer_id === user?.id;
      const name = isCustomer 
        ? ((data.artisan as any)?.profiles?.full_name || 'Artisan')
        : ((data.customer as any)?.full_name || 'Customer');
      
      setOtherPersonName(name);
    } catch (err) {
      console.error('Error fetching booking details:', err);
    }
  }

  async function fetchMessages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      
      // Mark messages as read
      await supabase.rpc('mark_messages_as_read', {
        p_booking_id: bookingId,
        p_user_id: user?.id
      });
    } catch (err) {
      console.error('Error in fetchMessages:', err);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollViewRef.current?.scrollToEnd({ animated: true });
          
          // Mark new message as read if not from current user
          if (payload.new.sender_id !== user?.id) {
            supabase.rpc('mark_messages_as_read', {
              p_booking_id: bookingId,
              p_user_id: user?.id
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user?.id,
          message: newMessage.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage("");
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Error in sendMessage:', err);
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-lg text-foreground">Please sign in to chat</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center p-4 bg-surface border-b border-border">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
            <Text className="text-lg">{otherPersonName[0]}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{otherPersonName}</Text>
            <Text className="text-xs text-muted">Booking Chat</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center p-8">
              <ActivityIndicator size="large" color="#0a7ea4" />
            </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">Start the conversation</Text>
              <Text className="text-muted text-center">Send a message to discuss booking details</Text>
            </View>
          ) : (
            <View className="gap-3">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.sender_id === String(user?.id);
                const showDate = index === 0 || 
                  new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                return (
                  <View key={msg.id}>
                    {showDate && (
                      <View className="items-center my-4">
                        <View className="bg-surface px-3 py-1 rounded-full">
                          <Text className="text-xs text-muted">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    )}
                    <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <View className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        isOwnMessage 
                          ? 'bg-primary rounded-br-sm' 
                          : 'bg-surface rounded-bl-sm'
                      }`}>
                        <Text className={`text-base ${isOwnMessage ? 'text-background' : 'text-foreground'}`}>
                          {msg.message}
                        </Text>
                        <Text className={`text-xs mt-1 ${isOwnMessage ? 'text-background/70' : 'text-muted'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="p-4 bg-surface border-t border-border">
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-background px-4 py-3 rounded-full text-foreground"
              placeholder="Type a message..."
              placeholderTextColor="#9BA1A6"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                newMessage.trim() && !sending ? 'bg-primary' : 'bg-muted/20'
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-2xl">↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
