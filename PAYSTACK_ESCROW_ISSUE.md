# Paystack Escrow Issue - Analysis & Solutions

## The Problem

**Paystack's statement:**
> "Based on the model described, your platform intends to **hold customer funds and release payouts after service confirmation (escrow-style transactions)**. Please note that **Paystack does not support businesses that hold or act as escrow for customer funds**. Payments collected via Paystack must be for goods or services directly provided by the account owner and should not be held on behalf of third parties pending fulfillment."

**Translation:** Paystack won't let you:
- ❌ Collect customer payment into your account
- ❌ Hold funds until job completion
- ❌ Then transfer to artisan

**This is their policy to avoid:**
- Money laundering risks
- Regulatory issues (acting as unlicensed financial institution)
- Liability for third-party transactions

---

## Impact on EketSupply

**Current model (not allowed):**
1. Customer pays ₦10,000 → EketSupply account
2. Funds held in escrow until job done
3. Customer confirms → EketSupply transfers ₦8,500 to artisan
4. EketSupply keeps ₦1,500 commission

**Problem:** Step 2 (holding funds) violates Paystack policy

---

## ✅ Solution: Split Payments (Paystack-Approved Model)

**Good news:** Paystack **DOES support** split payments via **Subaccounts** - this is exactly what they're designed for!

### How It Works

**New flow (Paystack-compliant):**
1. Customer pays ₦10,000
2. **Paystack automatically splits payment in real-time:**
   - ₦8,500 → Artisan's subaccount (instant settlement)
   - ₦1,500 → EketSupply main account (instant settlement)
3. No holding, no manual transfers, no escrow

**This is how Uber, Bolt, Jumia, and other Nigerian marketplaces work with Paystack.**

---

## Implementation Changes Required

### Current Implementation (Escrow - Not Allowed)

```typescript
// ❌ OLD WAY (Violates Paystack policy)
// 1. Collect full payment to EketSupply
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  body: JSON.stringify({
    email: customer.email,
    amount: 1000000, // ₦10,000 in kobo
    // All funds go to EketSupply account
  })
});

// 2. Hold funds in EketSupply account (ESCROW - NOT ALLOWED)
// 3. After job completion, manually transfer to artisan
const transfer = await fetch('https://api.paystack.co/transfer', {
  body: JSON.stringify({
    amount: 850000, // ₦8,500 to artisan
    recipient: artisan.recipient_code
  })
});
```

### New Implementation (Split Payment - Allowed)

```typescript
// ✅ NEW WAY (Paystack-compliant)
// Payment splits automatically, no escrow needed
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  body: JSON.stringify({
    email: customer.email,
    amount: 1000000, // ₦10,000 in kobo
    
    // CRITICAL: Use subaccount for automatic split
    subaccount: artisan.paystack_subaccount_code, // e.g., "ACCT_xxxxx"
    
    // Artisan gets 85%, EketSupply gets 15%
    // Paystack calculates this automatically based on subaccount settings
    
    // Who pays Paystack transaction fee?
    bearer: 'subaccount', // Artisan pays fee (deducted from their 85%)
    // OR
    bearer: 'account', // EketSupply pays fee (better for artisan experience)
  })
});

// That's it! No manual transfers needed.
// Paystack automatically:
// - Sends ₦8,500 to artisan's bank account (T+1 settlement)
// - Sends ₦1,500 to EketSupply's bank account (T+1 settlement)
```

---

## How to Create Subaccounts for Artisans

**When artisan signs up and gets verified:**

```typescript
// Create Paystack subaccount for artisan
const response = await fetch('https://api.paystack.co/subaccount', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    business_name: artisan.full_name, // "John Doe"
    settlement_bank: artisan.bank_code, // "058" for GTBank
    account_number: artisan.account_number, // "0123456789"
    percentage_charge: 15.0, // EketSupply takes 15%
    description: `Artisan subaccount for ${artisan.full_name}`
  })
});

const data = await response.json();

// Save to database
await supabase
  .from('artisans')
  .update({
    paystack_subaccount_code: data.data.subaccount_code // "ACCT_xxxxx"
  })
  .eq('id', artisan.id);
```

**Now when customer books this artisan, use their `subaccount_code` in payment initialization.**

---

## ⚠️ The Trust Problem: No Escrow Protection

**Challenge:** Without escrow, what prevents:
- Artisan receiving payment but not showing up?
- Customer claiming job not done after artisan already paid?

**This is the real issue we need to solve.**

---

## ✅ Solutions for Trust Without Escrow

### Option 1: Delayed Settlement (Paystack Feature)

**Paystack allows settlement delays up to 7 days:**

```typescript
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  body: JSON.stringify({
    email: customer.email,
    amount: 1000000,
    subaccount: artisan.paystack_subaccount_code,
    
    // Hold settlement for 24-48 hours
    settlement_delay: 48, // Hours before funds released to artisan
  })
});
```

**How it works:**
1. Customer pays ₦10,000 on Monday 10am
2. Payment succeeds immediately (customer charged)
3. Artisan completes job Monday 2pm
4. Funds held by Paystack until Wednesday 10am (48 hours later)
5. If customer disputes before Wednesday, you can request refund
6. If no dispute, funds auto-release to artisan Wednesday

**Pros:**
- ✅ Gives 24-48 hour window for disputes
- ✅ Paystack-compliant (not true escrow, just delayed settlement)
- ✅ Automatic - no manual intervention needed

**Cons:**
- ⚠️ Artisans wait 2-3 days for payment (may discourage participation)
- ⚠️ Maximum 7 days delay (Paystack limit)
- ⚠️ Doesn't fully protect against fraud (funds still auto-release)

### Option 2: Refund Policy (Industry Standard)

**How Uber, Bolt, Jumia handle this:**

1. **Instant split payment** (no escrow, no delays)
2. **Strong refund policy** for customer protection
3. **Artisan penalties** for no-shows or poor service

**Implementation:**

```typescript
// Payment splits immediately
const payment = await initializePayment({
  amount: 1000000,
  subaccount: artisan.paystack_subaccount_code,
  bearer: 'account' // EketSupply pays Paystack fee
});

// Customer has 24 hours to dispute
// If dispute filed, process refund
const refund = await fetch('https://api.paystack.co/refund', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transaction: transaction_reference,
    amount: 1000000, // Full refund
    customer_note: 'Artisan no-show - full refund issued'
  })
});

// Deduct from artisan's future earnings
await supabase
  .from('artisans')
  .update({
    balance_owed: artisan.balance_owed + 10000, // Track debt
    penalty_count: artisan.penalty_count + 1,
    status: artisan.penalty_count >= 3 ? 'suspended' : 'active'
  })
  .eq('id', artisan.id);
```

**Refund policy:**
- ✅ Artisan no-show: Full refund + artisan suspended
- ✅ Job incomplete: Partial refund (case-by-case)
- ✅ Poor quality: No refund, but artisan rating affected
- ✅ Customer must file dispute within 24 hours

**Pros:**
- ✅ Paystack-compliant (standard refund process)
- ✅ Artisans get paid immediately (better experience)
- ✅ Customer protected by refund guarantee
- ✅ Industry-standard approach (proven to work)

**Cons:**
- ⚠️ Requires manual dispute resolution
- ⚠️ Artisan already received funds (harder to recover if they disappear)
- ⚠️ Refund comes from EketSupply balance (cash flow impact)

### Option 3: Hybrid - Delayed Settlement + Refund Policy (Recommended)

**Best of both worlds:**

```typescript
const payment = await initializePayment({
  amount: 1000000,
  subaccount: artisan.paystack_subaccount_code,
  settlement_delay: 24, // 24-hour dispute window
  bearer: 'account'
});
```

**Timeline:**
- **Monday 10am:** Customer pays ₦10,000 (charged immediately)
- **Monday 2pm:** Artisan completes job
- **Monday 3pm:** Customer confirms job in app (optional)
- **Tuesday 10am:** If no dispute, funds auto-release to artisan
- **If dispute before Tuesday 10am:** Refund processed, artisan doesn't get paid

**Pros:**
- ✅ 24-hour protection window
- ✅ Artisans only wait 1 day (reasonable)
- ✅ Automatic release if no issues
- ✅ Paystack-compliant

**Cons:**
- ⚠️ Still requires refund process for disputes
- ⚠️ Artisan waits 24 hours minimum

---

## Recommended Response to Paystack

**Email subject:** Re: Activation Request for Kaybi Enterprises (1700330) - Payment Structure Clarification

---

Hello Chimuanya,

Thank you for the clarification regarding escrow policies. I completely understand Paystack's position on holding third-party funds.

**Revised Payment Structure:**

EketSupply will use **Paystack Subaccounts with split payments** instead of escrow. Here's how it will work:

1. **Artisan onboarding:** When artisans join the platform, we create a Paystack subaccount for each artisan using their verified bank account details

2. **Payment collection:** When a customer books a service, payment is processed via Paystack with the artisan's subaccount code specified

3. **Automatic split:** Paystack automatically splits the payment:
   - 85% to artisan's subaccount (settled to their bank account per Paystack's T+1 schedule)
   - 15% to EketSupply's main account (our platform commission)

4. **Settlement timing:** We will use Paystack's settlement delay feature (24-48 hours) to allow a brief dispute window before funds are released to artisans

5. **Dispute handling:** If a customer files a dispute (artisan no-show, incomplete job), we will process a refund via Paystack's Refund API and apply penalties to the artisan's account

**This model is identical to how Uber, Bolt, and other Nigerian ride-hailing/marketplace platforms operate with Paystack.**

**Key points:**
- ✅ No funds held by EketSupply on behalf of third parties
- ✅ Payments split automatically by Paystack in real-time
- ✅ Each artisan has their own Paystack subaccount
- ✅ EketSupply only receives the 15% commission for services we facilitate
- ✅ Refunds processed via standard Paystack Refund API (not manual transfers)

**Use of Paystack features:**
- Subaccount API for artisan account creation
- Transaction initialization with subaccount parameter for split payments
- Settlement delay feature for dispute protection window
- Refund API for customer protection

Does this revised payment structure align with Paystack's supported use cases? I'm happy to provide additional clarification if needed.

Thank you for your guidance on this matter.

Warm regards,

**Olukayode Awosika**  
Founder & Managing Director  
EketSupply Technologies Limited  
Email: awosh1@gmail.com  
Website: www.eketsupply.com

---

## Code Changes Required in App

### 1. Update Artisan Onboarding

**File:** `app/artisan-verification.tsx` (or wherever artisan signup happens)

**Add after artisan bank account is verified:**

```typescript
// Create Paystack subaccount for artisan
async function createPaystackSubaccount(artisan: Artisan) {
  const response = await fetch('https://api.paystack.co/subaccount', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      business_name: artisan.full_name,
      settlement_bank: artisan.bank_code,
      account_number: artisan.account_number,
      percentage_charge: 15.0, // EketSupply commission
      description: `Artisan subaccount for ${artisan.full_name}`
    })
  });

  const data = await response.json();
  
  if (!data.status) {
    throw new Error(`Failed to create subaccount: ${data.message}`);
  }

  // Save subaccount code to database
  await supabase
    .from('artisans')
    .update({
      paystack_subaccount_code: data.data.subaccount_code
    })
    .eq('id', artisan.id);

  return data.data.subaccount_code;
}
```

### 2. Update Payment Initialization

**File:** Wherever you initialize Paystack payments

**Change from:**
```typescript
// ❌ OLD - Escrow model
const payment = await initializeTransaction({
  email: customer.email,
  amount: booking.total_amount * 100,
  // All funds go to EketSupply
});
```

**To:**
```typescript
// ✅ NEW - Split payment model
const payment = await initializeTransaction({
  email: customer.email,
  amount: booking.total_amount * 100,
  subaccount: artisan.paystack_subaccount_code, // Auto-split payment
  bearer: 'account', // EketSupply pays Paystack fee
  settlement_delay: 24, // 24-hour dispute window
  metadata: {
    booking_id: booking.id,
    artisan_id: artisan.id,
    customer_id: customer.id
  }
});
```

### 3. Remove Manual Transfer Code

**Delete or comment out any code that does manual transfers after job completion:**

```typescript
// ❌ DELETE THIS - No longer needed
// const transfer = await fetch('https://api.paystack.co/transfer', {
//   body: JSON.stringify({
//     amount: artisan_amount,
//     recipient: artisan.recipient_code
//   })
// });
```

### 4. Update Database Schema

**Add column to artisans table:**

```sql
ALTER TABLE artisans 
ADD COLUMN paystack_subaccount_code TEXT;

-- Index for faster lookups
CREATE INDEX idx_artisans_subaccount ON artisans(paystack_subaccount_code);
```

---

## Timeline Impact

**Good news:** This is actually **simpler** than escrow!

**Changes needed:**
1. ✅ Send clarification email to Paystack (5 minutes)
2. ✅ Add subaccount creation to artisan onboarding (1 hour coding)
3. ✅ Update payment initialization to use subaccounts (30 minutes)
4. ✅ Remove manual transfer code (30 minutes)
5. ✅ Add `paystack_subaccount_code` column to database (5 minutes)
6. ✅ Test with small transaction (30 minutes)

**Total time:** 3-4 hours of development work

**No delay to launch timeline** - this is actually easier than the escrow approach!

---

## Bottom Line

**This is NOT bad news - it's actually GOOD news!**

**Why:**
1. ✅ **Simpler implementation** - no manual transfers, no escrow logic
2. ✅ **Faster payments** - artisans get paid in 24-48 hours (vs waiting for customer confirmation)
3. ✅ **Industry standard** - same model as Uber, Bolt, Jumia (proven to work)
4. ✅ **Paystack-approved** - subaccounts are exactly what they're designed for
5. ✅ **Better artisan experience** - faster payments = happier artisans

**The "escrow" protection comes from:**
- 24-48 hour settlement delay (dispute window)
- Strong refund policy
- Artisan penalties for no-shows
- Rating system (bad artisans get suspended)

**This is how every successful marketplace in Nigeria operates with Paystack.**

---

## Next Steps

1. **Send clarification email to Paystack** (use template above)
2. **Update payment code** (3-4 hours work)
3. **Test with test keys** (verify subaccount split works)
4. **Wait for Paystack approval** (1-3 days)
5. **Switch to live keys** and launch!

**No major setback - just a small pivot to industry-standard approach.**
