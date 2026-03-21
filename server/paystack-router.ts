/**
 * EketSupply Paystack Server Router
 *
 * ALL Paystack API calls that require the SECRET key are handled here.
 * The secret key NEVER leaves the server. The client only receives
 * safe response data (authorization_url, reference, bank list, etc.).
 *
 * Exposed via tRPC at: trpc.paystack.*
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

// Secret key is only available server-side (no EXPO_PUBLIC prefix)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const paystackHeaders = () => ({
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

export const paystackRouter = router({
  /**
   * Initialize a Paystack transaction.
   * Returns authorization_url (web) and access_code (mobile).
   */
  initializePayment: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        amount: z.number().positive(), // kobo
        reference: z.string(),
        subaccount_code: z.string().optional(),
        settlement_delay: z.number().optional(),
        metadata: z
          .object({
            booking_id: z.string(),
            customer_id: z.string(),
            artisan_id: z.string(),
            service_name: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: paystackHeaders(),
          body: JSON.stringify({
            email: input.email,
            amount: input.amount,
            reference: input.reference,
            subaccount: input.subaccount_code,
            bearer: "account",
            settlement_delay: input.settlement_delay ?? 24,
            metadata: input.metadata,
            callback_url: "https://eketsupply.com/payment/callback",
          }),
        }
      );
      const result = await response.json();
      if (!result.status) {
        throw new Error(result.message || "Payment initialization failed");
      }
      return {
        authorization_url: result.data.authorization_url as string,
        access_code: result.data.access_code as string,
        reference: result.data.reference as string,
      };
    }),

  /**
   * Verify a Paystack transaction by reference.
   */
  verifyPayment: publicProcedure
    .input(z.object({ reference: z.string() }))
    .query(async ({ input }) => {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`,
        { method: "GET", headers: paystackHeaders() }
      );
      const result = await response.json();
      if (!result.status) {
        return { success: false, reference: input.reference, message: result.message };
      }
      const tx = result.data;
      return {
        success: tx.status === "success",
        reference: tx.reference as string,
        transaction_id: String(tx.id),
        message: tx.gateway_response as string,
      };
    }),

  /**
   * Create a Paystack subaccount for an artisan.
   */
  createSubaccount: publicProcedure
    .input(
      z.object({
        full_name: z.string().min(2),
        bank_code: z.string(),
        account_number: z.string().length(10),
      })
    )
    .mutation(async ({ input }) => {
      const response = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: paystackHeaders(),
        body: JSON.stringify({
          business_name: input.full_name,
          settlement_bank: input.bank_code,
          account_number: input.account_number,
          percentage_charge: 15.0,
          description: `Artisan subaccount for ${input.full_name}`,
        }),
      });
      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to create subaccount");
      }
      return data.data as {
        subaccount_code: string;
        business_name: string;
        settlement_bank: string;
        account_number: string;
        percentage_charge: number;
      };
    }),

  /**
   * Verify a Nigerian bank account number.
   */
  verifyBankAccount: publicProcedure
    .input(
      z.object({
        account_number: z.string().length(10),
        bank_code: z.string(),
      })
    )
    .query(async ({ input }) => {
      const url = `https://api.paystack.co/bank/resolve?account_number=${input.account_number}&bank_code=${input.bank_code}`;
      const response = await fetch(url, {
        method: "GET",
        headers: paystackHeaders(),
      });
      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to verify bank account");
      }
      return {
        account_number: data.data.account_number as string,
        account_name: data.data.account_name as string,
        bank_id: data.data.bank_id as number,
      };
    }),

  /**
   * Get list of Nigerian banks supported by Paystack.
   */
  getBankList: publicProcedure.query(async () => {
    const response = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: paystackHeaders(),
    });
    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || "Failed to fetch bank list");
    }
    return data.data as Array<{
      id: number;
      name: string;
      code: string;
      type: string;
    }>;
  }),

  /**
   * Process a refund.
   */
  processRefund: publicProcedure
    .input(
      z.object({
        transaction_reference: z.string(),
        amount: z.number().optional(),
        customer_note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: paystackHeaders(),
        body: JSON.stringify({
          transaction: input.transaction_reference,
          amount: input.amount,
          customer_note: input.customer_note ?? "Refund processed by EketSupply",
        }),
      });
      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to process refund");
      }
      return data.data;
    }),
});
