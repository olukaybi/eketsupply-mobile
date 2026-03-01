/**
 * EketSupply Booking Confirmation Screen
 *
 * Shown after a successful Paystack payment.
 * Displays booking reference, artisan contact details, ETA, and next steps.
 *
 * Route: /booking/confirmation?bookingId=xxx
 */

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingDetails {
  id: string;
  booking_reference: string;
  service_name: string;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  total_amount: number;
  artisan_amount: number;
  platform_fee: number;
  payment_status: string;
  payment_reference: string;
  status: string;
  notes: string | null;
  artisan: {
    full_name: string;
    phone: string;
    rating: number;
    skills: string[];
    location: string;
  } | null;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepItem({
  number,
  title,
  description,
  done,
}: {
  number: number;
  title: string;
  description: string;
  done?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 16 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: done ? "#1B5E20" : "#E8F5E9",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          marginTop: 2,
        }}
      >
        {done ? (
          <Text style={{ color: "#fff", fontSize: 16 }}>✓</Text>
        ) : (
          <Text style={{ color: "#1B5E20", fontSize: 14, fontWeight: "700" }}>{number}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#11181C" }}>{title}</Text>
        <Text style={{ fontSize: 13, color: "#687076", marginTop: 2, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
    </View>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
      }}
    >
      <Text style={{ fontSize: 13, color: "#687076", flex: 1 }}>{label}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: highlight ? "700" : "500",
          color: highlight ? "#1B5E20" : "#11181C",
          flex: 1.5,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BookingConfirmation() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function loadBooking() {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_reference,
          service_name,
          scheduled_date,
          scheduled_time,
          address,
          total_amount,
          artisan_amount,
          platform_fee,
          payment_status,
          payment_reference,
          status,
          notes,
          artisans!bookings_artisan_id_fkey (
            full_name,
            phone,
            rating,
            skills,
            location
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      setBooking({
        ...data,
        artisan: (data as any).artisans ?? null,
      } as BookingDetails);
    } catch (err) {
      console.error("[Confirmation] Failed to load booking:", err);
      Alert.alert("Error", "Could not load booking details. Please check your bookings tab.");
    } finally {
      setLoading(false);
    }
  }

  function callArtisan() {
    if (!booking?.artisan?.phone) return;
    Linking.openURL(`tel:${booking.artisan.phone}`);
  }

  function whatsappArtisan() {
    if (!booking?.artisan?.phone) return;
    const phone = booking.artisan.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hello, I'm your customer on EketSupply. My booking reference is ${booking.booking_reference}. I'm looking forward to your service!`
    );
    Linking.openURL(`https://wa.me/234${phone.slice(-10)}?text=${message}`);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "TBD";
    try {
      return new Date(dateStr).toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function formatCurrency(amount: number) {
    return `₦${(amount ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={{ marginTop: 12, color: "#687076" }}>Loading booking details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!booking) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#11181C", textAlign: "center" }}>
            Booking Not Found
          </Text>
          <Text style={{ fontSize: 14, color: "#687076", textAlign: "center", marginTop: 8 }}>
            Your payment was successful. Check your bookings tab for details.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/bookings" as never)}
            style={{
              backgroundColor: "#1B5E20",
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
              marginTop: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const ref = booking.booking_reference ?? booking.id.slice(0, 8).toUpperCase();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Success banner */}
        <View
          style={{
            backgroundColor: "#1B5E20",
            paddingTop: 24,
            paddingBottom: 32,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 36 }}>✅</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" }}>
            Booking Confirmed!
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 6, textAlign: "center" }}>
            Your payment was successful and your booking is confirmed.
          </Text>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              paddingHorizontal: 20,
              paddingVertical: 10,
              marginTop: 16,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center" }}>
              BOOKING REFERENCE
            </Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center", letterSpacing: 2 }}>
              {ref}
            </Text>
          </View>
        </View>

        {/* Artisan card */}
        {booking.artisan && (
          <View style={{ margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 13, color: "#687076", marginBottom: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Your Artisan
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
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
                  {booking.artisan.full_name?.charAt(0) ?? "A"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#11181C" }}>
                  {booking.artisan.full_name}
                </Text>
                <Text style={{ fontSize: 13, color: "#687076" }}>
                  {booking.artisan.skills?.slice(0, 2).join(" · ") ?? "Artisan"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <Text style={{ fontSize: 13, color: "#E65100" }}>★ {booking.artisan.rating?.toFixed(1) ?? "New"}</Text>
                  <Text style={{ fontSize: 12, color: "#9BA1A6", marginLeft: 6 }}>
                    {booking.artisan.location}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={callArtisan}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#1B5E20",
                  borderRadius: 10,
                  paddingVertical: 12,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16 }}>📞</Text>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={whatsappArtisan}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#25D366",
                  borderRadius: 10,
                  paddingVertical: 12,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16 }}>💬</Text>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/chat/${booking.id}` as never)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#E8F5E9",
                  borderRadius: 10,
                  paddingVertical: 12,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16 }}>✉️</Text>
                <Text style={{ color: "#1B5E20", fontWeight: "700", fontSize: 14 }}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Booking details */}
        <View style={{ marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
          <Text style={{ fontSize: 13, color: "#687076", marginBottom: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Booking Details
          </Text>
          <InfoRow label="Service" value={booking.service_name ?? "Home Service"} />
          <InfoRow label="Date" value={formatDate(booking.scheduled_date)} />
          <InfoRow label="Time" value={booking.scheduled_time ?? "To be confirmed"} />
          <InfoRow label="Location" value={booking.address ?? "Address on file"} />
          {booking.notes && <InfoRow label="Notes" value={booking.notes} />}
        </View>

        {/* Payment breakdown */}
        <View style={{ marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
          <Text style={{ fontSize: 13, color: "#687076", marginBottom: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Payment Summary
          </Text>
          <InfoRow label="Total Paid" value={formatCurrency(booking.total_amount)} highlight />
          <InfoRow label="Artisan Payment (85%)" value={formatCurrency(booking.artisan_amount)} />
          <InfoRow label="Platform Fee (15%)" value={formatCurrency(booking.platform_fee)} />
          <InfoRow label="Payment Reference" value={booking.payment_reference ?? "Processing"} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 }}>
            <Text style={{ fontSize: 13, color: "#687076" }}>Payment Status</Text>
            <View style={{ backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 12, color: "#065F46", fontWeight: "700" }}>
                {booking.payment_status === "paid" ? "✓ PAID" : booking.payment_status?.toUpperCase() ?? "PROCESSING"}
              </Text>
            </View>
          </View>
        </View>

        {/* What happens next */}
        <View style={{ marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
          <Text style={{ fontSize: 13, color: "#687076", marginBottom: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
            What Happens Next
          </Text>
          <StepItem
            number={1}
            title="Payment Confirmed"
            description="Your payment has been processed securely via Paystack."
            done
          />
          <StepItem
            number={2}
            title="Artisan Notified"
            description={`${booking.artisan?.full_name ?? "Your artisan"} has been notified and will confirm shortly.`}
            done
          />
          <StepItem
            number={3}
            title="Artisan Arrives"
            description={`On ${formatDate(booking.scheduled_date)} at ${booking.scheduled_time ?? "the agreed time"}, the artisan will arrive at your location.`}
          />
          <StepItem
            number={4}
            title="Job Completed"
            description="Once the job is done, confirm completion in the app to release payment to the artisan."
          />
          <StepItem
            number={5}
            title="Leave a Review"
            description="Help other customers by rating your experience with the artisan."
          />
        </View>

        {/* Actions */}
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/bookings" as never)}
            style={{
              backgroundColor: "#1B5E20",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)" as never)}
            style={{
              backgroundColor: "#F5F5F5",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#687076", fontWeight: "600", fontSize: 15 }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
