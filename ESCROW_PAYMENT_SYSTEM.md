# EketSupply Escrow Payment System
## Complete Technical & Operational Guide

---

## Table of Contents
1. [What Is Escrow & Why It Matters](#1-what-is-escrow)
2. [How EketSupply Escrow Works](#2-how-it-works)
3. [Payment Flow (Step-by-Step)](#3-payment-flow)
4. [Technical Implementation](#4-technical-implementation)
5. [Dispute Resolution](#5-dispute-resolution)
6. [Security & Fraud Prevention](#6-security)
7. [Economics & Cash Flow](#7-economics)
8. [Regulatory Compliance](#8-compliance)

---

## 1. What Is Escrow & Why It Matters

### Definition

**Escrow** is a financial arrangement where a third party (EketSupply) holds payment from the customer until the service is completed satisfactorily, then releases funds to the artisan.

```
Traditional Payment (Risky):
Customer → Pays artisan directly → Artisan may disappear or do poor work
```

```
Escrow Payment (Safe):
Customer → Pays EketSupply → Work completed → EketSupply pays artisan
```

### The Trust Problem in Nigerian Artisan Services

#### Customer Pain Points
1. **Prepayment risk:** "I paid ₦50,000 upfront, plumber never showed up"
2. **Quality risk:** "Electrician did shoddy work, now refuses to fix it"
3. **Overcharging:** "Quoted ₦15,000, demanded ₦30,000 after job"
4. **No recourse:** "Can't get refund, artisan won't answer calls"

#### Artisan Pain Points
1. **Non-payment:** "Completed job, customer refuses to pay"
2. **Delayed payment:** "Customer said 'I'll pay next week' 3 months ago"
3. **Negotiation after work:** "Customer wants 50% discount after job done"
4. **Cash flow:** "Need money today, but customer pays in 30 days"

### How Escrow Solves Both Problems

**For Customers:**
- ✅ Money held safely until work is done
- ✅ Can dispute if work is unsatisfactory
- ✅ Automatic refund if artisan doesn't show
- ✅ Price locked in (no surprise charges)

**For Artisans:**
- ✅ Payment guaranteed (money already in escrow)
- ✅ No chasing customers for payment
- ✅ Fast payout (24-48 hours after completion)
- ✅ Protection against false disputes

**For EketSupply:**
- ✅ Builds trust in platform
- ✅ Reduces fraud and chargebacks
- ✅ Creates revenue opportunity (hold funds, earn interest)
- ✅ Differentiates from competitors

---

## 2. How EketSupply Escrow Works

### The Three-Party System

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  CUSTOMER   │         │ EKETSUPPLY  │         │   ARTISAN   │
│             │         │  (Escrow)   │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │                       │
       │  1. Books service     │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │  2. Pays ₦20,000      │                       │
       │──────────────────────>│                       │
       │                       │  3. Notifies artisan  │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │  4. Completes work    │
       │                       │<──────────────────────│
       │                       │                       │
       │  5. Confirms work OK  │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │                       │  6. Releases ₦17,000  │
       │                       │──────────────────────>│
       │                       │  (₦20K - 15% fee)     │
```

### Key Principles

1. **Customer pays upfront** → Money goes to EketSupply escrow account
2. **Artisan sees "Payment secured"** → Knows money is guaranteed
3. **Work completed** → Customer confirms or auto-confirms after 48 hours
4. **Funds released** → Artisan receives payment minus platform fee
5. **If dispute** → EketSupply investigates and decides

---

## 3. Payment Flow (Step-by-Step)

### Scenario: Customer Books Plumber for ₦20,000

#### Step 1: Booking & Quote Acceptance

**Customer Side:**
1. Searches for "plumber in Lekki"
2. Selects artisan (4.8★, 120 reviews, verified)
3. Describes job: "Fix leaking kitchen sink"
4. Receives quote: ₦20,000

**Artisan Side:**
1. Receives booking request notification
2. Reviews job details, customer location
3. Sends quote: ₦20,000 (materials + labor)
4. Waits for customer acceptance

**System:**
- Creates booking record (status: "pending_payment")
- Generates unique booking ID: #EKS-2024-001234

#### Step 2: Payment to Escrow

**Customer Side:**
1. Sees quote: ₦20,000
2. Clicks "Pay Now"
3. Chooses payment method:
   - Card (Mastercard/Visa)
   - Bank transfer
   - USSD
   - Mobile money (Opay, PalmPay)
4. Enters payment details
5. Confirms payment

**System:**
1. Processes payment via Paystack/Flutterwave
2. Deducts ₦20,000 from customer account
3. **Holds ₦20,000 in EketSupply escrow wallet** (not released yet)
4. Updates booking status: "paid" → "scheduled"
5. Sends confirmation SMS/push notification

**Artisan Side:**
1. Receives notification: "Payment secured for booking #EKS-2024-001234"
2. Sees in app: "₦17,000 pending" (₦20K - 15% platform fee)
3. Knows payment is guaranteed
4. Confirms appointment time

#### Step 3: Service Delivery

**Artisan Side:**
1. Arrives at customer location
2. Completes work (fixes sink)
3. Takes before/after photos (optional but encouraged)
4. Marks job as "completed" in app
5. Waits for customer confirmation

**Customer Side:**
1. Receives notification: "Artisan marked job as complete"
2. Inspects work
3. Has 3 options:
   - ✅ **Approve:** "Work is good, release payment"
   - ❌ **Dispute:** "Work is unsatisfactory, I have issues"
   - ⏰ **Wait:** Do nothing (auto-approves after 48 hours)

**System:**
- Booking status: "completed" → "awaiting_confirmation"
- Starts 48-hour countdown timer

#### Step 4A: Happy Path (Customer Approves)

**Customer Side:**
1. Clicks "Approve & Release Payment"
2. Optionally leaves 5-star review
3. Receives receipt via email/SMS

**System:**
1. Updates booking status: "confirmed"
2. Calculates payout:
   ```
   Gross amount: ₦20,000
   Platform fee (15%): ₦3,000
   Net to artisan: ₦17,000
   ```
3. Initiates payout to artisan's bank account
4. Sends confirmation to both parties

**Artisan Side:**
1. Receives notification: "Payment released! ₦17,000 on the way"
2. Funds arrive in bank account within 24-48 hours
3. Can see transaction in "Earnings" tab

#### Step 4B: Auto-Confirmation (Customer Does Nothing)

**System (After 48 Hours):**
1. Checks if customer confirmed → No action
2. **Automatically approves** payment release
3. Rationale: Silence = satisfaction (industry standard)
4. Releases ₦17,000 to artisan
5. Sends notification to customer: "Payment auto-released after 48 hours"

**Why 48 Hours?**
- Gives customer time to test work (e.g., check if sink still leaks)
- Prevents artisan from waiting indefinitely
- Balances customer protection with artisan cash flow

#### Step 4C: Dispute Path (Customer Rejects)

**Customer Side:**
1. Clicks "Dispute" button
2. Selects reason:
   - Work not completed
   - Poor quality
   - Damage to property
   - Artisan didn't show up
   - Other (explain)
3. Uploads evidence (photos, videos)
4. Submits dispute

**System:**
1. **Freezes escrow** (₦20,000 held, not released)
2. Updates booking status: "disputed"
3. Notifies artisan of dispute
4. Creates dispute case #DIS-2024-001234
5. Assigns to dispute resolution team

**Artisan Side:**
1. Receives notification: "Customer disputed booking #EKS-2024-001234"
2. Views customer's complaint and evidence
3. Submits response:
   - Explanation of what happened
   - Counter-evidence (photos, messages)
   - Proposed resolution (redo work, partial refund, etc.)
4. Waits for EketSupply decision

**Dispute Resolution (See Section 5 for details):**
- EketSupply reviews evidence from both sides
- Makes decision within 3-5 business days
- Possible outcomes:
  - Full refund to customer (₦20,000)
  - Partial refund (e.g., ₦10,000 to customer, ₦7,000 to artisan)
  - Full payment to artisan (₦17,000)
  - Artisan redoes work, then payment released

---

## 4. Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     EKETSUPPLY MOBILE APP                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Customer  │  │   Artisan  │  │   Admin    │            │
│  │    UI      │  │     UI     │  │  Dashboard │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
└────────┼────────────────┼────────────────┼───────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Payment Service (tRPC)                   │  │
│  │  • createEscrowPayment()                             │  │
│  │  • confirmPayment()                                  │  │
│  │  • releasePayment()                                  │  │
│  │  • refundPayment()                                   │  │
│  │  • handleDispute()                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬────────────────────┬────────────────────┬─────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   PAYSTACK API   │  │  SUPABASE DB     │  │  SUPABASE    │
│  (Payment        │  │  (Transactions)  │  │  (Escrow     │
│   Gateway)       │  │                  │  │   Wallet)    │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

### Database Schema

#### `transactions` Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES profiles(id),
  artisan_id UUID REFERENCES artisans(id),
  
  -- Amounts
  gross_amount DECIMAL(10,2) NOT NULL,  -- ₦20,000
  platform_fee DECIMAL(10,2) NOT NULL,  -- ₦3,000 (15%)
  net_amount DECIMAL(10,2) NOT NULL,    -- ₦17,000
  
  -- Payment gateway
  payment_method VARCHAR(50),  -- 'card', 'bank_transfer', 'ussd'
  payment_gateway VARCHAR(50), -- 'paystack', 'flutterwave'
  gateway_reference VARCHAR(255) UNIQUE,  -- Paystack transaction ref
  
  -- Escrow status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Possible values:
  -- 'pending' → Payment initiated but not confirmed
  -- 'held' → Payment successful, held in escrow
  -- 'released' → Payment released to artisan
  -- 'refunded' → Payment refunded to customer
  -- 'disputed' → Under dispute investigation
  
  -- Timestamps
  paid_at TIMESTAMP,
  released_at TIMESTAMP,
  refunded_at TIMESTAMP,
  
  -- Payout details
  payout_reference VARCHAR(255),  -- Bank transfer reference
  payout_status VARCHAR(50),  -- 'pending', 'processing', 'completed', 'failed'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_gateway_ref ON transactions(gateway_reference);
```

#### `escrow_wallet` Table

```sql
CREATE TABLE escrow_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Balance tracking
  total_held DECIMAL(12,2) DEFAULT 0,  -- Total in escrow
  total_released DECIMAL(12,2) DEFAULT 0,  -- Lifetime released
  total_refunded DECIMAL(12,2) DEFAULT 0,  -- Lifetime refunded
  
  -- Interest earned (from holding funds)
  interest_earned DECIMAL(12,2) DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to update wallet on transaction status change
CREATE OR REPLACE FUNCTION update_escrow_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'held' AND OLD.status != 'held' THEN
    UPDATE escrow_wallet 
    SET total_held = total_held + NEW.gross_amount;
  ELSIF NEW.status = 'released' AND OLD.status = 'held' THEN
    UPDATE escrow_wallet 
    SET total_held = total_held - NEW.gross_amount,
        total_released = total_released + NEW.net_amount;
  ELSIF NEW.status = 'refunded' AND OLD.status = 'held' THEN
    UPDATE escrow_wallet 
    SET total_held = total_held - NEW.gross_amount,
        total_refunded = total_refunded + NEW.gross_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_status_change
AFTER UPDATE OF status ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_escrow_wallet();
```

#### `disputes` Table

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id),
  booking_id UUID REFERENCES bookings(id),
  
  -- Parties
  filed_by UUID REFERENCES profiles(id),  -- Usually customer
  filed_against UUID REFERENCES artisans(id),
  
  -- Dispute details
  reason VARCHAR(100) NOT NULL,
  -- 'work_not_completed', 'poor_quality', 'property_damage', 
  -- 'no_show', 'overcharged', 'other'
  
  description TEXT NOT NULL,
  evidence_urls TEXT[],  -- Array of photo/video URLs
  
  -- Artisan response
  artisan_response TEXT,
  artisan_evidence_urls TEXT[],
  artisan_responded_at TIMESTAMP,
  
  -- Resolution
  status VARCHAR(50) DEFAULT 'open',
  -- 'open', 'under_review', 'resolved', 'escalated'
  
  resolution VARCHAR(50),
  -- 'full_refund', 'partial_refund', 'no_refund', 'redo_work'
  
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),  -- Admin who resolved
  resolved_at TIMESTAMP,
  
  -- Amounts
  refund_amount DECIMAL(10,2),  -- If partial refund
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_transaction ON disputes(transaction_id);
```

### API Endpoints (tRPC)

#### 1. Create Escrow Payment

```typescript
// server/routers/payments.ts
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import Paystack from 'paystack';

const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

export const paymentsRouter = router({
  createEscrowPayment: publicProcedure
    .input(z.object({
      bookingId: z.string().uuid(),
      amount: z.number().positive(),
      paymentMethod: z.enum(['card', 'bank_transfer', 'ussd']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { bookingId, amount, paymentMethod } = input;
      
      // 1. Get booking details
      const booking = await ctx.db
        .select()
        .from('bookings')
        .where('id', bookingId)
        .single();
      
      if (!booking) throw new Error('Booking not found');
      
      // 2. Calculate fees
      const platformFeePercent = 0.15;  // 15%
      const platformFee = amount * platformFeePercent;
      const netAmount = amount - platformFee;
      
      // 3. Initialize Paystack payment
      const paystackResponse = await paystack.transaction.initialize({
        email: ctx.user.email,
        amount: amount * 100,  // Paystack uses kobo (₦1 = 100 kobo)
        reference: `EKS-${bookingId}-${Date.now()}`,
        callback_url: `https://eketsupply.com/payment/callback`,
        metadata: {
          booking_id: bookingId,
          customer_id: ctx.user.id,
          artisan_id: booking.artisan_id,
        },
      });
      
      // 4. Create transaction record
      const transaction = await ctx.db.insert('transactions').values({
        booking_id: bookingId,
        customer_id: ctx.user.id,
        artisan_id: booking.artisan_id,
        gross_amount: amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        payment_method: paymentMethod,
        payment_gateway: 'paystack',
        gateway_reference: paystackResponse.data.reference,
        status: 'pending',
      }).returning();
      
      return {
        transactionId: transaction.id,
        paymentUrl: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      };
    }),
});
```

#### 2. Confirm Payment (Webhook)

```typescript
// server/routers/webhooks.ts
export const webhooksRouter = router({
  paystackWebhook: publicProcedure
    .input(z.object({
      event: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { event, data } = input;
      
      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(input))
        .digest('hex');
      
      if (hash !== ctx.req.headers['x-paystack-signature']) {
        throw new Error('Invalid signature');
      }
      
      if (event === 'charge.success') {
        // 1. Find transaction
        const transaction = await ctx.db
          .select()
          .from('transactions')
          .where('gateway_reference', data.reference)
          .single();
        
        if (!transaction) throw new Error('Transaction not found');
        
        // 2. Update transaction status to 'held' (in escrow)
        await ctx.db
          .update('transactions')
          .set({
            status: 'held',
            paid_at: new Date(),
          })
          .where('id', transaction.id);
        
        // 3. Update booking status
        await ctx.db
          .update('bookings')
          .set({ status: 'paid' })
          .where('id', transaction.booking_id);
        
        // 4. Notify artisan
        await ctx.notifications.send({
          user_id: transaction.artisan_id,
          title: 'Payment Secured!',
          body: `₦${transaction.net_amount.toLocaleString()} is waiting for you after job completion`,
          data: { booking_id: transaction.booking_id },
        });
        
        // 5. Send SMS
        await ctx.sms.send({
          to: transaction.artisan_phone,
          message: `EketSupply: Payment of ₦${transaction.gross_amount} secured for booking #${transaction.booking_id.slice(0, 8)}. Complete the job to receive ₦${transaction.net_amount}.`,
        });
      }
      
      return { received: true };
    }),
});
```

#### 3. Release Payment

```typescript
export const paymentsRouter = router({
  // ... previous methods
  
  releasePayment: publicProcedure
    .input(z.object({
      bookingId: z.string().uuid(),
      rating: z.number().min(1).max(5).optional(),
      review: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { bookingId, rating, review } = input;
      
      // 1. Get transaction
      const transaction = await ctx.db
        .select()
        .from('transactions')
        .where('booking_id', bookingId)
        .where('status', 'held')
        .single();
      
      if (!transaction) throw new Error('No held payment found');
      
      // 2. Verify customer owns this booking
      if (transaction.customer_id !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 3. Update transaction status
      await ctx.db
        .update('transactions')
        .set({
          status: 'released',
          released_at: new Date(),
          payout_status: 'pending',
        })
        .where('id', transaction.id);
      
      // 4. Initiate payout to artisan
      const artisan = await ctx.db
        .select()
        .from('artisans')
        .where('id', transaction.artisan_id)
        .single();
      
      const payoutResponse = await paystack.transfer.initiate({
        source: 'balance',
        amount: transaction.net_amount * 100,  // Convert to kobo
        recipient: artisan.payout_recipient_code,  // Pre-created recipient
        reason: `Payment for booking #${bookingId.slice(0, 8)}`,
        reference: `PAYOUT-${transaction.id}`,
      });
      
      // 5. Update payout reference
      await ctx.db
        .update('transactions')
        .set({
          payout_reference: payoutResponse.data.transfer_code,
          payout_status: 'processing',
        })
        .where('id', transaction.id);
      
      // 6. Create review if provided
      if (rating) {
        await ctx.db.insert('reviews').values({
          booking_id: bookingId,
          artisan_id: transaction.artisan_id,
          customer_id: ctx.user.id,
          rating,
          comment: review,
        });
        
        // Update artisan average rating
        await ctx.db.raw(`
          UPDATE artisans
          SET rating = (
            SELECT AVG(rating) FROM reviews WHERE artisan_id = ?
          ),
          total_reviews = (
            SELECT COUNT(*) FROM reviews WHERE artisan_id = ?
          )
          WHERE id = ?
        `, [transaction.artisan_id, transaction.artisan_id, transaction.artisan_id]);
      }
      
      // 7. Notify artisan
      await ctx.notifications.send({
        user_id: transaction.artisan_id,
        title: 'Payment Released! 💰',
        body: `₦${transaction.net_amount.toLocaleString()} is on its way to your bank account`,
        data: { transaction_id: transaction.id },
      });
      
      return { success: true, amount: transaction.net_amount };
    }),
});
```

#### 4. Auto-Release (Cron Job)

```typescript
// server/cron/auto-release-payments.ts
import { CronJob } from 'cron';

export const autoReleasePayments = new CronJob(
  '0 */6 * * *',  // Run every 6 hours
  async () => {
    // Find transactions held for 48+ hours without confirmation
    const transactionsToRelease = await db
      .select()
      .from('transactions')
      .join('bookings', 'bookings.id', 'transactions.booking_id')
      .where('transactions.status', 'held')
      .where('bookings.status', 'completed')
      .where('bookings.completed_at', '<', new Date(Date.now() - 48 * 60 * 60 * 1000))
      .where('transactions.released_at', null);
    
    for (const transaction of transactionsToRelease) {
      // Release payment automatically
      await db
        .update('transactions')
        .set({
          status: 'released',
          released_at: new Date(),
          payout_status: 'pending',
        })
        .where('id', transaction.id);
      
      // Initiate payout
      const artisan = await db
        .select()
        .from('artisans')
        .where('id', transaction.artisan_id)
        .single();
      
      await paystack.transfer.initiate({
        source: 'balance',
        amount: transaction.net_amount * 100,
        recipient: artisan.payout_recipient_code,
        reason: `Auto-release for booking #${transaction.booking_id.slice(0, 8)}`,
        reference: `AUTO-PAYOUT-${transaction.id}`,
      });
      
      // Notify both parties
      await notifications.send({
        user_id: transaction.customer_id,
        title: 'Payment Auto-Released',
        body: `Payment for booking #${transaction.booking_id.slice(0, 8)} was automatically released after 48 hours`,
      });
      
      await notifications.send({
        user_id: transaction.artisan_id,
        title: 'Payment Released! 💰',
        body: `₦${transaction.net_amount.toLocaleString()} is on its way to your bank account`,
      });
      
      console.log(`Auto-released payment ${transaction.id} for booking ${transaction.booking_id}`);
    }
  },
  null,
  true,
  'Africa/Lagos'
);
```

---

## 5. Dispute Resolution

### Dispute Handling Process

#### Step 1: Customer Files Dispute

**Mobile App Flow:**
```typescript
// app/booking-details.tsx
const handleDispute = async () => {
  const result = await trpc.disputes.create.mutate({
    bookingId: booking.id,
    reason: selectedReason,  // 'poor_quality', 'work_not_completed', etc.
    description: disputeDescription,
    evidenceUrls: uploadedPhotos,  // Array of Supabase storage URLs
  });
  
  Alert.alert('Dispute Filed', 'Our team will review your case within 3-5 business days');
};
```

**Backend:**
```typescript
export const disputesRouter = router({
  create: publicProcedure
    .input(z.object({
      bookingId: z.string().uuid(),
      reason: z.enum(['work_not_completed', 'poor_quality', 'property_damage', 'no_show', 'overcharged', 'other']),
      description: z.string().min(20),
      evidenceUrls: z.array(z.string().url()),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Get transaction
      const transaction = await ctx.db
        .select()
        .from('transactions')
        .where('booking_id', input.bookingId)
        .single();
      
      if (transaction.status !== 'held') {
        throw new Error('Cannot dispute: payment already released or refunded');
      }
      
      // 2. Create dispute
      const dispute = await ctx.db.insert('disputes').values({
        transaction_id: transaction.id,
        booking_id: input.bookingId,
        filed_by: ctx.user.id,
        filed_against: transaction.artisan_id,
        reason: input.reason,
        description: input.description,
        evidence_urls: input.evidenceUrls,
        status: 'open',
      }).returning();
      
      // 3. Update transaction status
      await ctx.db
        .update('transactions')
        .set({ status: 'disputed' })
        .where('id', transaction.id);
      
      // 4. Notify artisan
      await ctx.notifications.send({
        user_id: transaction.artisan_id,
        title: 'Dispute Filed',
        body: `Customer disputed booking #${input.bookingId.slice(0, 8)}. Please respond within 48 hours.`,
        data: { dispute_id: dispute.id },
      });
      
      // 5. Notify admin team
      await ctx.slack.sendMessage({
        channel: '#disputes',
        text: `🚨 New dispute filed: ${dispute.id}\nReason: ${input.reason}\nAmount: ₦${transaction.gross_amount}`,
      });
      
      return dispute;
    }),
});
```

#### Step 2: Artisan Responds

**Mobile App (Artisan):**
```typescript
const handleRespondToDispute = async () => {
  await trpc.disputes.respond.mutate({
    disputeId: dispute.id,
    response: artisanResponse,
    evidenceUrls: artisanEvidence,
    proposedResolution: 'redo_work',  // or 'partial_refund', 'no_refund'
  });
  
  Alert.alert('Response Submitted', 'EketSupply will review both sides and make a decision');
};
```

#### Step 3: Admin Reviews & Decides

**Admin Dashboard:**
```typescript
// admin/disputes/[id].tsx
const resolveDispute = async (resolution: 'full_refund' | 'partial_refund' | 'no_refund' | 'redo_work') => {
  await trpc.disputes.resolve.mutate({
    disputeId: dispute.id,
    resolution,
    resolutionNotes: adminNotes,
    refundAmount: resolution === 'partial_refund' ? partialAmount : undefined,
  });
};
```

**Backend:**
```typescript
export const disputesRouter = router({
  // ... previous methods
  
  resolve: adminProcedure  // Only admins can call this
    .input(z.object({
      disputeId: z.string().uuid(),
      resolution: z.enum(['full_refund', 'partial_refund', 'no_refund', 'redo_work']),
      resolutionNotes: z.string(),
      refundAmount: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { disputeId, resolution, resolutionNotes, refundAmount } = input;
      
      // 1. Get dispute and transaction
      const dispute = await ctx.db
        .select()
        .from('disputes')
        .where('id', disputeId)
        .single();
      
      const transaction = await ctx.db
        .select()
        .from('transactions')
        .where('id', dispute.transaction_id)
        .single();
      
      // 2. Execute resolution
      if (resolution === 'full_refund') {
        // Refund full amount to customer
        await paystack.refund.create({
          transaction: transaction.gateway_reference,
          amount: transaction.gross_amount * 100,
        });
        
        await ctx.db
          .update('transactions')
          .set({
            status: 'refunded',
            refunded_at: new Date(),
          })
          .where('id', transaction.id);
        
      } else if (resolution === 'partial_refund') {
        // Refund partial to customer, pay rest to artisan
        await paystack.refund.create({
          transaction: transaction.gateway_reference,
          amount: refundAmount! * 100,
        });
        
        const artisanPayout = transaction.gross_amount - refundAmount! - transaction.platform_fee;
        
        await paystack.transfer.initiate({
          source: 'balance',
          amount: artisanPayout * 100,
          recipient: artisan.payout_recipient_code,
          reason: `Partial payment for disputed booking #${transaction.booking_id.slice(0, 8)}`,
        });
        
        await ctx.db
          .update('transactions')
          .set({ status: 'released' })
          .where('id', transaction.id);
        
      } else if (resolution === 'no_refund') {
        // Release full payment to artisan
        await ctx.db
          .update('transactions')
          .set({
            status: 'released',
            released_at: new Date(),
          })
          .where('id', transaction.id);
        
        await paystack.transfer.initiate({
          source: 'balance',
          amount: transaction.net_amount * 100,
          recipient: artisan.payout_recipient_code,
          reason: `Payment for booking #${transaction.booking_id.slice(0, 8)} (dispute resolved)`,
        });
        
      } else if (resolution === 'redo_work') {
        // Keep money in escrow, artisan must redo work
        await ctx.db
          .update('bookings')
          .set({ status: 'redo_scheduled' })
          .where('id', transaction.booking_id);
        
        // Transaction stays in 'disputed' status until work is redone
      }
      
      // 3. Update dispute record
      await ctx.db
        .update('disputes')
        .set({
          status: 'resolved',
          resolution,
          resolution_notes: resolutionNotes,
          refund_amount: refundAmount,
          resolved_by: ctx.user.id,
          resolved_at: new Date(),
        })
        .where('id', disputeId);
      
      // 4. Notify both parties
      await ctx.notifications.send({
        user_id: transaction.customer_id,
        title: 'Dispute Resolved',
        body: `Your dispute has been resolved: ${resolution.replace('_', ' ')}`,
        data: { dispute_id: disputeId },
      });
      
      await ctx.notifications.send({
        user_id: transaction.artisan_id,
        title: 'Dispute Resolved',
        body: `Dispute for booking #${transaction.booking_id.slice(0, 8)} has been resolved`,
        data: { dispute_id: disputeId },
      });
      
      return { success: true };
    }),
});
```

### Dispute Resolution Guidelines (For Admin Team)

#### Decision Framework

| Evidence | Resolution | Rationale |
|----------|------------|-----------|
| **Customer has clear proof of poor work** (photos, videos) | Full refund | Customer protected |
| **Artisan has proof of completion** (before/after photos, customer signed off) | No refund | Artisan protected |
| **Both have valid points** (work done but not perfect) | Partial refund | Split the difference |
| **Artisan willing to redo work** | Redo work | Best outcome for both |
| **Customer unreasonable** (nitpicking, changing requirements) | No refund | Prevent abuse |
| **Artisan no-show or abandoned job** | Full refund | Clear breach |

#### Response Time SLA

- **Artisan response:** 48 hours to respond to dispute
- **Admin review:** 3-5 business days to investigate and decide
- **Total resolution time:** 5-7 days maximum

---

## 6. Security & Fraud Prevention

### Payment Security

#### 1. PCI Compliance
- **Never store card details** on EketSupply servers
- All card data handled by Paystack (PCI-DSS Level 1 certified)
- Use Paystack tokenization for recurring payments

#### 2. 3D Secure Authentication
- Require 3D Secure (OTP verification) for all card payments
- Reduces fraud by 70%+
- Mandated by CBN (Central Bank of Nigeria)

#### 3. Transaction Limits
```typescript
const TRANSACTION_LIMITS = {
  min_amount: 1000,  // ₦1,000 minimum
  max_amount_unverified: 50000,  // ₦50K for unverified users
  max_amount_verified: 500000,  // ₦500K for verified users
  daily_limit: 1000000,  // ₦1M per day
};
```

### Fraud Detection

#### 1. Velocity Checks
```typescript
// Detect suspicious patterns
const fraudChecks = {
  // Same customer, multiple failed payments
  failed_payment_threshold: 3,  // Block after 3 failures in 24 hours
  
  // Same artisan, multiple disputes
  dispute_threshold: 5,  // Flag artisan with 5+ disputes
  
  // Rapid bookings (possible bot)
  booking_velocity: 10,  // Max 10 bookings per hour
};
```

#### 2. Risk Scoring
```typescript
const calculateRiskScore = (transaction) => {
  let score = 0;
  
  // New user (no history)
  if (transaction.customer.total_bookings === 0) score += 20;
  
  // High amount for first booking
  if (transaction.amount > 50000 && transaction.customer.total_bookings === 0) score += 30;
  
  // Artisan has high dispute rate
  if (transaction.artisan.dispute_rate > 0.1) score += 25;
  
  // Payment from new device/location
  if (transaction.device_fingerprint_new) score += 15;
  
  // Total score
  if (score > 50) return 'high_risk';
  if (score > 30) return 'medium_risk';
  return 'low_risk';
};
```

#### 3. Manual Review Queue
- Transactions with risk score > 50 go to manual review
- Admin approves/rejects within 2 hours
- Customer notified of delay

### Chargeback Protection

#### 1. Evidence Collection
- Automatically collect evidence for every transaction:
  - Booking details (date, time, service)
  - Artisan GPS location (check-in/check-out)
  - Before/after photos
  - Customer confirmation or auto-release
  - SMS/push notification logs

#### 2. Chargeback Response
```typescript
// When bank notifies of chargeback
const handleChargeback = async (chargebackData) => {
  const transaction = await db
    .select()
    .from('transactions')
    .where('gateway_reference', chargebackData.reference)
    .single();
  
  // Gather evidence
  const evidence = {
    service_date: transaction.booking.scheduled_at,
    completion_proof: transaction.booking.completion_photos,
    customer_confirmation: transaction.released_at,
    artisan_checkin: transaction.booking.artisan_checkin_location,
    communication_logs: await getMessages(transaction.booking_id),
  };
  
  // Submit to Paystack
  await paystack.dispute.update(chargebackData.id, {
    refund_amount: 0,  // We're contesting
    evidence: evidence,
  });
  
  // Notify admin
  await slack.sendMessage({
    channel: '#chargebacks',
    text: `Chargeback filed for ${transaction.id}. Evidence submitted automatically.`,
  });
};
```

---

## 7. Economics & Cash Flow

### Revenue Model

#### Transaction Economics

```
Customer pays: ₦20,000
├─ Platform fee (15%): ₦3,000 → EketSupply revenue
├─ Payment gateway fee (1.5%): ₦300 → Paystack
└─ Net to artisan: ₦16,700
```

**EketSupply Net Revenue:**
```
₦3,000 (platform fee) - ₦300 (gateway fee) = ₦2,700 per transaction
```

#### Float Interest (Bonus Revenue)

**Scenario:** ₦100M held in escrow at any given time

```
₦100M × 10% annual interest (Nigerian treasury bills) = ₦10M/year
₦10M ÷ 12 months = ₦833K/month passive income
```

**Why This Works:**
- Average holding period: 3-5 days (booking → completion → release)
- At scale (100K monthly bookings × ₦20K = ₦2B volume)
- Average escrow balance: ₦200M-₦300M
- **Annual float income: ₦20M-₦30M**

### Cash Flow Management

#### Inflows
```
Day 1: Customer pays ₦20,000 → EketSupply receives ₦20,000
```

#### Outflows
```
Day 3: Job completed, payment released
├─ Payout to artisan: ₦16,700 (within 24-48 hours)
├─ Payment gateway fee: ₦300 (deducted immediately)
└─ EketSupply keeps: ₦3,000
```

#### Working Capital Requirement

**Scenario:** 10,000 monthly bookings

```
Monthly volume: 10,000 × ₦20,000 = ₦200M
Average holding period: 4 days
Escrow balance needed: ₦200M × (4/30) = ₦26.7M

Buffer for disputes (5%): ₦10M
Total working capital: ₦36.7M
```

**Funding:**
- Initial: ₦5M seed capital
- Month 3+: Self-funded from profits
- Escrow balance grows with transaction volume

---

## 8. Regulatory Compliance

### Nigerian Payment Regulations

#### 1. CBN (Central Bank of Nigeria) Requirements

**E-Money License:**
- Required for holding customer funds
- Application fee: ₦1M
- Minimum capital: ₦2B (for full license) OR
- Payment Service Provider (PSP) license: ₦100M minimum capital

**EketSupply Approach:**
- Partner with licensed PSP (Paystack/Flutterwave)
- They hold funds, we direct transfers
- Avoids ₦2B capital requirement

#### 2. KYC (Know Your Customer)

**Customer KYC:**
- Phone number verification (OTP)
- Email verification
- For transactions > ₦50K: BVN (Bank Verification Number)

**Artisan KYC:**
- Full name, phone, email
- BVN (mandatory for payouts)
- Bank account details
- Verification documents (ID, certifications)

#### 3. AML (Anti-Money Laundering)

**Transaction Monitoring:**
```typescript
// Flag suspicious patterns
const amlChecks = {
  // Structuring (breaking large amounts into small transactions)
  detect_structuring: true,
  threshold: 5,  // 5+ transactions of ₦9K-₦10K in 24 hours
  
  // Rapid movement of funds
  rapid_booking_cancellation: true,
  threshold: 3,  // 3+ bookings created and refunded in 24 hours
  
  // High-risk countries (if international expansion)
  country_blacklist: ['...'],
};
```

**Reporting:**
- Suspicious transactions reported to NFIU (Nigerian Financial Intelligence Unit)
- Monthly compliance reports
- Annual audit by external firm

#### 4. Data Protection (NDPR)

**Nigeria Data Protection Regulation:**
- Obtain consent for data collection
- Encrypt sensitive data (PII, payment info)
- Allow users to export/delete their data
- Appoint Data Protection Officer (DPO)

---

## 9. User Experience Considerations

### Customer Experience

#### Transparency
- **Show escrow status clearly:**
  ```
  ✅ Payment secured in escrow
  ⏳ Waiting for job completion
  💰 Payment will be released after you confirm
  ```

#### Control
- **Easy dispute process:**
  - One-tap "Report Issue" button
  - Photo upload for evidence
  - Real-time status updates

#### Peace of Mind
- **Money-back guarantee:**
  - "100% refund if artisan doesn't show"
  - "Protected by EketSupply escrow"
  - "Your money is safe until work is done"

### Artisan Experience

#### Payment Certainty
- **"Payment Secured" badge:**
  ```
  💰 ₦17,000 waiting for you
  Complete the job to receive payment
  ```

#### Fast Payouts
- **24-48 hour turnaround:**
  - Much faster than traditional invoicing (30+ days)
  - Improves cash flow for artisans

#### Fair Dispute Process
- **Chance to respond:**
  - 48 hours to provide counter-evidence
  - Admin reviews both sides fairly
  - Not automatically customer's fault

---

## 10. Conclusion

### Why Escrow Is Critical for EketSupply

1. **Builds Trust:** Customers feel safe paying upfront, artisans know payment is guaranteed
2. **Reduces Fraud:** Eliminates no-shows, non-payment, and chargebacks
3. **Competitive Advantage:** Most competitors don't offer escrow (direct payment only)
4. **Revenue Opportunity:** Float interest generates ₦20M-₦30M annually at scale
5. **Scalable:** Automated system handles 100K+ transactions with minimal manual intervention

### Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Design** | 2 weeks | Database schema, API specs, user flows |
| **Phase 2: Development** | 4 weeks | Backend APIs, mobile app integration, admin dashboard |
| **Phase 3: Testing** | 2 weeks | Unit tests, integration tests, UAT |
| **Phase 4: Compliance** | 2 weeks | KYC/AML setup, legal review, PSP partnership |
| **Phase 5: Launch** | 1 week | Soft launch with 100 beta users |
| **Total** | **11 weeks** | Fully functional escrow system |

### Success Metrics

- **Dispute rate:** < 5% of transactions
- **Resolution time:** < 5 days average
- **Chargeback rate:** < 0.5% (industry average: 1-2%)
- **Customer satisfaction:** 4.5+ stars on escrow experience
- **Artisan payout time:** 90% within 48 hours

**The escrow system is the foundation of trust that makes EketSupply's marketplace work. Without it, we're just a directory. With it, we're a trusted platform that protects everyone.**
