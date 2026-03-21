/**
 * EketSupply Paystack Client Service
 *
 * SECURITY NOTE:
 * All API calls that require the Paystack SECRET key are proxied through
 * the server-side tRPC router (server/paystack-router.ts).
 * Only the PUBLIC key is used client-side (for Paystack.js / React Native SDK).
 */
import { createTRPCClient as createTRPCProxyClient } from "@trpc/client";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import { supabase } from "@/lib/supabase";

/** Vanilla (non-React) tRPC client for use in plain async functions */
function getVanillaClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = await Auth.getSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

// Public key is safe to expose in the client bundle
export const PAYSTACK_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

export type PaymentData = {
  amount: number; // in kobo (₦1 = 100 kobo)
  email: string;
  reference: string;
  subaccount_code?: string;
  settlement_delay?: number;
  metadata?: {
    booking_id: string;
    customer_id: string;
    artisan_id: string;
    service_name: string;
  };
};

export interface PaystackSubaccount {
  subaccount_code: string;
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
}

export type PaymentResult = {
  success: boolean;
  reference: string;
  transaction_id?: string;
  message?: string;
};

/**
 * Initialize a Paystack payment via the server (secret key stays server-side).
 */
export async function initializePayment(data: PaymentData): Promise<{
  authorization_url?: string;
  access_code?: string;
  reference: string;
}> {
  return await getVanillaClient().paystack.initializePayment.mutate({
    email: data.email,
    amount: data.amount,
    reference: data.reference,
    subaccount_code: data.subaccount_code,
    settlement_delay: data.settlement_delay,
    metadata: data.metadata,
  });
}

/**
 * Verify a Paystack payment via the server.
 */
export async function verifyPayment(reference: string): Promise<PaymentResult> {
  return await getVanillaClient().paystack.verifyPayment.query({ reference });
}

/**
 * Create a payment record in the database.
 */
export async function createPaymentRecord(data: {
  booking_id: string;
  amount: number;
  reference: string;
  status: "pending" | "success" | "failed";
  transaction_id?: string;
}) {
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      booking_id: data.booking_id,
      amount: data.amount / 100, // Convert kobo to naira
      reference: data.reference,
      status: data.status,
      transaction_id: data.transaction_id,
      payment_method: "paystack",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return payment;
}

/**
 * Update payment status in the database.
 */
export async function updatePaymentStatus(
  reference: string,
  status: "success" | "failed",
  transaction_id?: string
) {
  const { error } = await supabase
    .from("payments")
    .update({
      status,
      transaction_id,
      updated_at: new Date().toISOString(),
    })
    .eq("reference", reference);

  if (error) throw error;

  if (status === "success") {
    const { data: payment } = await supabase
      .from("payments")
      .select("booking_id")
      .eq("reference", reference)
      .single();

    if (payment?.booking_id) {
      await supabase
        .from("bookings")
        .update({ payment_status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.booking_id);
    }
  }
}

/**
 * Generate a unique payment reference.
 */
export function generatePaymentReference(bookingId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `EKET-${bookingId.substring(0, 8)}-${timestamp}-${random}`;
}

/**
 * Calculate Paystack fees (1.5% + ₦100 for local cards).
 */
export function calculatePaystackFees(amount: number): {
  amount: number;
  fees: number;
  total: number;
} {
  const feePercentage = 0.015;
  const flatFee = 100;
  const fees = Math.ceil(amount * feePercentage + flatFee);
  return { amount, fees, total: amount + fees };
}

/**
 * Create a Paystack subaccount for an artisan via the server.
 */
export async function createArtisanSubaccount(params: {
  full_name: string;
  bank_code: string;
  account_number: string;
}): Promise<PaystackSubaccount> {
  return await getVanillaClient().paystack.createSubaccount.mutate(params);
}

/**
 * Verify a Nigerian bank account via the server.
 */
export async function verifyBankAccount(params: {
  account_number: string;
  bank_code: string;
}) {
  return await getVanillaClient().paystack.verifyBankAccount.query(params);
}

/**
 * Get list of Nigerian banks via the server.
 */
export async function getBankList() {
  return await getVanillaClient().paystack.getBankList.query();
}

/**
 * Process a refund via the server.
 */
export async function processRefund(params: {
  transaction_reference: string;
  amount?: number;
  customer_note?: string;
}) {
  return await getVanillaClient().paystack.processRefund.mutate(params);
}
