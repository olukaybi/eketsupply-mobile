/**
 * EketSupply Paystack Server Router
 *
 * ALL Paystack API calls that require the SECRET key are handled here.
 * The secret key NEVER leaves the server. The client only receives
 * safe response data (authorization_url, reference, bank list, etc.).
 *
 * Exposed via tRPC at: trpc.paystack.*
 *
 * Security:
 *  - All inputs are validated with Zod before touching the Paystack API
 *  - Amount is bounded: min ₦50 (5000 kobo), max ₦5,000,000 (500,000,000 kobo)
 *  - Email format is enforced
 *  - Account numbers must be exactly 10 digits
 *  - Reference strings are sanitised to prevent injection
 *  - Customer notes are capped at 500 chars
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";

// Secret key is only available server-side (no EXPO_PUBLIC prefix)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const paystackHeaders = () => ({
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

// ─── Shared Zod schemas ──────────────────────────────────────────────────────

/** Nigerian bank account number: exactly 10 digits */
const nigerianAccountNumber = z
  .string()
  .regex(/^\d{10}$/, "Account number must be exactly 10 digits");

/** Paystack bank code: 3-6 digit string */
const bankCode = z
  .string()
  .regex(/^\d{3,6}$/, "Bank code must be 3-6 digits");

/** Payment amount in kobo: ₦50 – ₦5,000,000 */
const amountKobo = z
  .number()
  .int("Amount must be a whole number of kobo")
  .min(5_000, "Minimum payment is ₦50")
  .max(500_000_000, "Maximum payment is ₦5,000,000");

/** Safe reference string: alphanumeric + hyphens only */
const safeReference = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9\-_]+$/, "Reference must be alphanumeric");

// ─── Router ──────────────────────────────────────────────────────────────────

export const paystackRouter = router({
  /**
   * Initialize a Paystack transaction.
   * Returns authorization_url (web) and access_code (mobile).
   */
  initializePayment: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address").max(254),
        amount: amountKobo,
        reference: safeReference,
        subaccount_code: z
          .string()
          .regex(/^ACCT_[A-Za-z0-9]+$/, "Invalid subaccount code format")
          .optional(),
        settlement_delay: z.number().int().min(0).max(72).optional(),
        metadata: z
          .object({
            booking_id: z.string().uuid("booking_id must be a UUID"),
            customer_id: z.string().uuid("customer_id must be a UUID"),
            artisan_id: z.string().uuid("artisan_id must be a UUID"),
            service_name: z.string().min(1).max(200),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!PAYSTACK_SECRET_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment service is not configured",
        });
      }

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

      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Paystack API error: ${response.status}`,
        });
      }

      const result = await response.json();
      if (!result.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message || "Payment initialization failed",
        });
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
    .input(z.object({ reference: safeReference }))
    .query(async ({ input }) => {
      if (!PAYSTACK_SECRET_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment service is not configured",
        });
      }

      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`,
        { method: "GET", headers: paystackHeaders() }
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Paystack API error: ${response.status}`,
        });
      }

      const result = await response.json();
      if (!result.status) {
        return {
          success: false,
          reference: input.reference,
          message: result.message as string,
        };
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
        full_name: z
          .string()
          .min(2, "Name must be at least 2 characters")
          .max(100, "Name must be at most 100 characters")
          .regex(/^[A-Za-z\s\-']+$/, "Name must contain only letters and spaces"),
        bank_code: bankCode,
        account_number: nigerianAccountNumber,
      })
    )
    .mutation(async ({ input }) => {
      if (!PAYSTACK_SECRET_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment service is not configured",
        });
      }

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

      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Paystack API error: ${response.status}`,
        });
      }

      const data = await response.json();
      if (!data.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.message || "Failed to create subaccount",
        });
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
        account_number: nigerianAccountNumber,
        bank_code: bankCode,
      })
    )
    .query(async ({ input }) => {
      if (!PAYSTACK_SECRET_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment service is not configured",
        });
      }

      const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(input.account_number)}&bank_code=${encodeURIComponent(input.bank_code)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: paystackHeaders(),
      });

      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Paystack API error: ${response.status}`,
        });
      }

      const data = await response.json();
      if (!data.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.message || "Failed to verify bank account",
        });
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
    if (!PAYSTACK_SECRET_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Payment service is not configured",
      });
    }

    const response = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: paystackHeaders(),
    });

    if (!response.ok) {
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: `Paystack API error: ${response.status}`,
      });
    }

    const data = await response.json();
    if (!data.status) {
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: data.message || "Failed to fetch bank list",
      });
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
        transaction_reference: safeReference,
        amount: amountKobo.optional(),
        customer_note: z
          .string()
          .max(500, "Customer note must be at most 500 characters")
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!PAYSTACK_SECRET_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment service is not configured",
        });
      }

      const response = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: paystackHeaders(),
        body: JSON.stringify({
          transaction: input.transaction_reference,
          amount: input.amount,
          customer_note: input.customer_note ?? "Refund processed by EketSupply",
        }),
      });

      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Paystack API error: ${response.status}`,
        });
      }

      const data = await response.json();
      if (!data.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.message || "Failed to process refund",
        });
      }

      return data.data;
    }),
});
