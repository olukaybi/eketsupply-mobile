# Paystack Production Compliance Guide for EketSupply

## Overview

Moving from Paystack test mode to live production requires completing **KYC (Know Your Customer)** verification, business registration, and regulatory compliance. This guide covers everything you need to activate live payments for EketSupply.

---

## Prerequisites Checklist

Before starting Paystack activation, ensure you have:

- [ ] Registered business entity in Nigeria
- [ ] Nigerian business bank account
- [ ] Valid government-issued ID (Director/Owner)
- [ ] Business registration documents (CAC certificate)
- [ ] Utility bill or proof of address (< 3 months old)
- [ ] Tax Identification Number (TIN)
- [ ] Business email and phone number

---

## Step 1: Business Registration

### Option A: Register as Business Name (Sole Proprietorship)

**Best for:** Solo founders, bootstrapping, quick launch

**Requirements:**
- Individual owner with valid ID
- Business name search and reservation
- CAC Form BN-1 (Business Name Registration)

**Process:**
1. Visit [CAC Portal](https://services.cac.gov.ng/) or use agent
2. Search for "EketSupply" availability (₦500)
3. Reserve name (₦500)
4. Complete Form BN-1 with business details
5. Pay registration fee (₦10,000)
6. Receive CAC certificate (3-7 days)

**Total cost:** ₦15,000-₦25,000 (including agent fees)
**Timeline:** 5-10 business days

### Option B: Register as Limited Company (Recommended)

**Best for:** Raising investment, long-term growth, liability protection

**Requirements:**
- Minimum 2 shareholders (can be same person as shareholder + director)
- Company name search and reservation
- Memorandum and Articles of Association
- CAC Forms (CAC 1.1, CAC 2, CAC 7)

**Process:**
1. Visit [CAC Portal](https://services.cac.gov.ng/)
2. Search for "EketSupply Limited" availability (₦500)
3. Reserve name (₦500)
4. Complete incorporation forms:
   - CAC 1.1 (Application form)
   - CAC 2 (Statement of share capital)
   - CAC 7 (Particulars of directors)
5. Upload required documents:
   - Shareholders' IDs and passport photos
   - Directors' IDs and passport photos
   - Memorandum and Articles of Association
6. Pay registration fee (₦10,000 for ≤1M share capital)
7. Receive Certificate of Incorporation (5-14 days)

**Total cost:** ₦50,000-₦100,000 (including legal fees)
**Timeline:** 7-21 business days

**Recommended structure for EketSupply:**
- **Company name:** EketSupply Technologies Limited
- **Share capital:** ₦1,000,000 (1M shares @ ₦1 each)
- **Shareholders:** You (80%), Co-founder/Advisor (20%)
- **Directors:** You (Managing Director)
- **Business type:** Technology/Marketplace Platform

---

## Step 2: Tax Registration

### Get Tax Identification Number (TIN)

**Process:**
1. Visit [FIRS TaxPro-Max Portal](https://www.taxpromax.firs.gov.ng/)
2. Create account with business email
3. Complete TIN application form
4. Upload CAC certificate and ID
5. Receive TIN (instant to 3 days)

**Cost:** Free
**Timeline:** Same day to 3 business days

### Register for VAT (if applicable)

**Requirement:** Only if annual turnover exceeds ₦25M

For EketSupply:
- Year 1 projected revenue: ₦1.2-1.5B GMV, ₦120-150M commission
- **VAT registration required:** Yes (likely by Month 3-6)

**Process:**
1. Log into TaxPro-Max portal
2. Apply for VAT registration
3. Upload business documents
4. Receive VAT certificate (7-14 days)

**VAT rate:** 7.5% (charged on commission, not full booking amount)

---

## Step 3: Business Bank Account

### Recommended Banks for Startups

**Tier 1 (Best for Paystack integration):**
1. **GTBank** - Fast Paystack settlement, excellent API, ₦5K monthly fee
2. **Access Bank** - Good for startups, ₦3K monthly fee
3. **Zenith Bank** - Reliable, ₦5K monthly fee

**Tier 2 (Digital banks - faster setup):**
1. **Kuda Business** - Free, instant setup, but limited Paystack support
2. **Moniepoint** - Low fees, good for SMEs

**Recommended:** GTBank or Access Bank (best Paystack compatibility)

### Account Opening Requirements

**Documents needed:**
- CAC certificate (Business Name or Incorporation)
- Memorandum and Articles of Association (for Limited)
- Board resolution authorizing account opening
- Directors' IDs (passport, driver's license, NIN, or voter's card)
- Directors' passport photographs
- Utility bill or proof of address (< 3 months)
- Tax Identification Number (TIN)
- Business address proof

**Process:**
1. Visit bank branch with all documents
2. Complete account opening forms
3. Provide initial deposit (₦10,000-₦50,000)
4. Receive account number (same day to 3 days)
5. Activate internet banking and debit card

**Timeline:** 1-5 business days
**Cost:** ₦10,000-₦50,000 (initial deposit + account opening fee)

---

## Step 4: Paystack Live Activation

### 4.1: Complete Business Profile

**Login to Paystack Dashboard:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings → Business**
3. Complete all required fields:
   - Business name: EketSupply Technologies Limited
   - Business type: Marketplace/Platform
   - Business category: Home Services
   - Business description: "Digital marketplace connecting customers with verified artisans for home services"
   - Website: www.eketsupply.com
   - Business address: (Your registered address)
   - Business phone: (Your business line)
   - Business email: support@eketsupply.com

### 4.2: Upload KYC Documents

**Navigate to Settings → Compliance**

**Required documents:**

1. **Certificate of Incorporation or Business Name Registration**
   - Upload: CAC certificate (PDF, < 5MB)
   - Must be clear, legible, and recent

2. **Memorandum and Articles of Association** (for Limited companies)
   - Upload: MEMART (PDF, < 5MB)

3. **Directors' Valid ID**
   - Options: International passport, Driver's license, National ID, Voter's card
   - Upload: Clear photo or scan (JPG/PNG/PDF, < 5MB)
   - Must not be expired

4. **Proof of Address** (< 3 months old)
   - Options: Utility bill (PHCN, water), bank statement, tenancy agreement
   - Upload: Clear scan (PDF/JPG, < 5MB)
   - Must show director's name and address

5. **Tax Identification Number (TIN)**
   - Enter: 8-digit TIN from FIRS
   - Upload: TIN certificate (optional but recommended)

### 4.3: Bank Account Verification

**Navigate to Settings → Settlement**

1. Click **"Add Settlement Account"**
2. Enter bank account details:
   - Bank name: (e.g., GTBank)
   - Account number: (Your business account)
   - Account name: (Must match CAC registered name exactly)
3. Paystack will verify account (instant)
4. Set as primary settlement account

**Important:** Account name MUST match your CAC registration exactly:
- ✅ Correct: "EketSupply Technologies Limited"
- ❌ Wrong: "EketSupply", "Eket Supply Ltd", "Your Personal Name"

### 4.4: Submit for Review

1. Review all uploaded documents for accuracy
2. Click **"Submit for Review"** in Compliance section
3. Paystack will review within 24-48 hours
4. You'll receive email notification of approval or requests for additional info

**Approval timeline:** 1-3 business days (if all documents correct)

---

## Step 5: Configure Live API Keys

### 5.1: Generate Live Keys

**After approval:**
1. Navigate to **Settings → API Keys & Webhooks**
2. Click **"Generate Live Keys"**
3. Copy and securely store:
   - **Live Public Key:** `pk_live_xxxxxxxxxxxxx`
   - **Live Secret Key:** `sk_live_xxxxxxxxxxxxx`

**Security best practices:**
- ✅ Store secret key in environment variables (never in code)
- ✅ Use different keys for mobile app vs backend
- ✅ Rotate keys every 6-12 months
- ✅ Never commit keys to GitHub or share publicly

### 5.2: Update EketSupply App

**Using the `webdev_request_secrets` tool:**

The app will need these live keys added to production environment:

```
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

**Important:** Keep test keys for development, use live keys only in production build.

### 5.3: Configure Webhook URL

**Purpose:** Receive real-time payment notifications

1. Navigate to **Settings → API Keys & Webhooks**
2. Click **"Add Webhook URL"**
3. Enter your production webhook endpoint:
   ```
   https://api.eketsupply.com/webhooks/paystack
   ```
4. Select events to listen for:
   - ✅ `charge.success` (payment successful)
   - ✅ `transfer.success` (payout to artisan successful)
   - ✅ `transfer.failed` (payout failed)
   - ✅ `refund.processed` (refund completed)
5. Copy webhook secret for signature verification
6. Save webhook configuration

---

## Step 6: Escrow & Split Payment Setup

### 6.1: Create Subaccounts for Artisans

**Purpose:** Automatically split payments between EketSupply and artisans

**API endpoint:** `POST https://api.paystack.co/subaccount`

**Required for each artisan:**
```json
{
  "business_name": "John Doe Plumbing Services",
  "settlement_bank": "058", // GTBank code
  "account_number": "0123456789",
  "percentage_charge": 15.0, // EketSupply takes 15%
  "description": "Artisan subaccount for John Doe"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "subaccount_code": "ACCT_xxxxxxxxxxxxx",
    "business_name": "John Doe Plumbing Services",
    "percentage_charge": 15.0
  }
}
```

**Store `subaccount_code` in artisans table for each verified artisan.**

### 6.2: Implement Split Payment

**When customer books artisan:**

```typescript
// Initialize transaction with split payment
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: customer.email,
    amount: 50000, // ₦500 in kobo
    subaccount: artisan.subaccount_code, // Artisan gets 85%
    transaction_charge: 0, // EketSupply bears Paystack fees
    bearer: 'account', // Subaccount (artisan) bears transaction fee
    metadata: {
      booking_id: booking.id,
      artisan_id: artisan.id,
      customer_id: customer.id,
      service: 'Plumbing repair'
    }
  })
});
```

**Payment flow:**
1. Customer pays ₦500
2. Paystack deducts 1.5% + ₦100 = ₦107.50 (transaction fee)
3. Remaining: ₦392.50
4. Artisan receives: ₦392.50 × 85% = ₦333.63
5. EketSupply receives: ₦392.50 × 15% = ₦58.87

### 6.3: Escrow Implementation (Hold Funds Until Job Completion)

**For escrow (hold funds until job done):**

**Option A: Manual Transfer (Recommended for MVP)**

1. Customer pays → funds go to EketSupply main account
2. Job completed → customer confirms
3. EketSupply initiates transfer to artisan using Transfer API

```typescript
// After job completion and customer confirmation
const response = await fetch('https://api.paystack.co/transfer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'balance', // From EketSupply balance
    amount: 33363, // ₦333.63 in kobo (artisan's 85%)
    recipient: artisan.recipient_code, // Created via Transfer Recipient API
    reason: `Payment for booking #${booking.id}`,
    reference: `escrow_${booking.id}_${Date.now()}`
  })
});
```

**Option B: Paystack Dedicated Virtual Accounts (Advanced)**

- Create virtual account for each booking
- Customer pays into virtual account
- Funds held until job completion
- Auto-transfer on completion

**Recommended:** Start with Option A (manual transfer), upgrade to Option B at scale.

---

## Step 7: Regulatory Compliance

### 7.1: Data Protection (NDPR)

**Nigeria Data Protection Regulation (NDPR) compliance:**

**Requirements:**
1. **Privacy Policy:** Disclose how you collect, store, and use customer data
2. **Terms of Service:** Define user rights and platform responsibilities
3. **Consent:** Get explicit consent before collecting personal data
4. **Data Security:** Encrypt sensitive data (passwords, payment info)
5. **Data Breach Protocol:** Report breaches to NITDA within 72 hours

**Action items:**
- [ ] Create Privacy Policy (see template below)
- [ ] Create Terms of Service
- [ ] Add consent checkboxes during signup
- [ ] Implement data encryption (Supabase handles this)
- [ ] Register with NITDA Data Protection Compliance Organization (DPCO)

**NDPR registration:**
- Visit [NITDA DPCO Portal](https://ndpr.nitda.gov.ng/)
- Complete Data Audit Form
- Pay compliance fee (₦100,000-₦500,000 based on company size)
- Receive NDPR compliance certificate

**Timeline:** 2-4 weeks
**Cost:** ₦100,000-₦500,000 (EketSupply likely ₦100K as startup)

### 7.2: Consumer Protection

**Federal Competition and Consumer Protection Commission (FCCPC):**

**Requirements:**
1. Clear refund policy
2. Transparent pricing (no hidden fees)
3. Customer complaint mechanism
4. Fair contract terms

**Action items:**
- [ ] Create Refund Policy (e.g., "Full refund if artisan doesn't show up")
- [ ] Display all fees upfront (no surprise charges)
- [ ] Add in-app complaint/dispute resolution
- [ ] Ensure Terms of Service are fair and readable

**No registration required unless you have consumer complaints.**

### 7.3: Payment Service Provider Regulations

**Central Bank of Nigeria (CBN) regulations:**

**Good news:** As a marketplace using Paystack (licensed PSP), you don't need separate CBN license.

**Requirements:**
- Use licensed payment processor (Paystack ✅)
- Comply with AML/CFT (Anti-Money Laundering)
- Report suspicious transactions (> ₦5M single transaction)
- Maintain transaction records for 5 years

**Action items:**
- [ ] Implement transaction monitoring (flag > ₦5M bookings)
- [ ] Store transaction records in Supabase (automatic)
- [ ] Create AML policy document
- [ ] Train team on fraud detection

---

## Step 8: Testing Live Payments

### 8.1: Test with Small Transaction

**Before going fully live:**

1. Create test booking with real artisan
2. Use your own card to pay ₦100 (minimum)
3. Verify:
   - ✅ Payment successful
   - ✅ Webhook received
   - ✅ Booking status updated
   - ✅ Funds appear in settlement account (24 hours)
   - ✅ Artisan subaccount receives correct split

### 8.2: Test Refund Flow

1. Initiate refund via Paystack API:
```typescript
const response = await fetch(`https://api.paystack.co/refund`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transaction: transaction_reference,
    amount: 10000 // ₦100 in kobo (optional, defaults to full amount)
  })
});
```

2. Verify refund appears in customer's account (5-7 days)

### 8.3: Test Transfer to Artisan

1. Complete test booking
2. Trigger manual transfer to artisan
3. Verify artisan receives payment (instant to 24 hours)
4. Check transfer status via API

---

## Step 9: Settlement & Payouts

### 9.1: Understand Settlement Schedule

**Paystack settlement timing:**
- **T+1 settlement:** Funds from Monday transactions settle on Tuesday
- **Weekends:** Saturday/Sunday transactions settle on Monday
- **Public holidays:** Delayed by 1 business day

**Example:**
- Customer pays on Monday 10am → Funds in your account Tuesday 9am
- Customer pays on Friday 5pm → Funds in your account Monday 9am

### 9.2: Monitor Settlement Account

**Daily tasks:**
1. Check Paystack dashboard for settlement summary
2. Reconcile with bank account balance
3. Verify all transactions settled correctly
4. Flag any discrepancies to Paystack support

### 9.3: Artisan Payout Schedule

**Recommended payout schedule:**
- **Option A:** Daily payouts (after each completed job)
- **Option B:** Weekly payouts (every Friday)
- **Option C:** Bi-weekly payouts (1st and 15th of month)

**Recommended:** Weekly payouts (balance between cash flow and operational overhead)

---

## Step 10: Ongoing Compliance

### Monthly Tasks

- [ ] Reconcile Paystack settlements with bank statements
- [ ] Review transaction disputes and chargebacks
- [ ] Monitor for suspicious transactions (AML)
- [ ] Update KYC documents if business details change

### Quarterly Tasks

- [ ] File VAT returns (if registered)
- [ ] Review and update Privacy Policy/Terms of Service
- [ ] Audit data protection practices
- [ ] Review artisan subaccount accuracy

### Annual Tasks

- [ ] Renew business registration (CAC annual returns)
- [ ] File annual tax returns (FIRS)
- [ ] Renew NDPR compliance (if applicable)
- [ ] Review and update compliance documentation

---

## Estimated Costs Summary

| Item | Cost | Timeline |
|------|------|----------|
| **Business Registration (Limited)** | ₦50K-₦100K | 7-21 days |
| **Tax Registration (TIN)** | Free | 1-3 days |
| **Bank Account Opening** | ₦10K-₦50K | 1-5 days |
| **Paystack Activation** | Free | 1-3 days |
| **NDPR Compliance (optional Year 1)** | ₦100K | 2-4 weeks |
| **Legal/Accounting Fees** | ₦50K-₦200K | Ongoing |
| **Total (Minimum)** | **₦110K-₦350K** | **2-4 weeks** |
| **Total (With NDPR)** | **₦210K-₦450K** | **4-6 weeks** |

---

## Recommended Timeline

### Week 1: Business Registration
- Day 1-2: Search and reserve business name
- Day 3-5: Complete CAC registration forms
- Day 6-7: Submit and pay registration fees

### Week 2: Banking & Tax
- Day 8-10: Apply for TIN (can be parallel with CAC)
- Day 11-14: Open business bank account with documents

### Week 3: Paystack Activation
- Day 15-16: Complete Paystack business profile
- Day 17-18: Upload KYC documents
- Day 19-21: Wait for Paystack approval

### Week 4: Testing & Launch
- Day 22-23: Generate live API keys, configure webhooks
- Day 24-25: Test live payments with small transactions
- Day 26-28: Soft launch with beta customers

**Total time to live payments: 4 weeks (if no delays)**

---

## Common Issues & Solutions

### Issue 1: Paystack Rejects KYC Documents

**Reasons:**
- Document not clear/legible
- Expired ID
- Name mismatch between CAC and bank account
- Utility bill > 3 months old

**Solution:**
- Re-scan documents in high resolution (300 DPI minimum)
- Use valid, unexpired government ID
- Ensure exact name match across all documents
- Get recent utility bill or bank statement

### Issue 2: Bank Account Verification Fails

**Reasons:**
- Account name doesn't match CAC registration exactly
- Account is personal, not business account
- Account is frozen or restricted

**Solution:**
- Use business account with exact CAC registered name
- Contact bank to confirm account is active and unrestricted
- Provide bank statement showing account details

### Issue 3: Settlement Delays

**Reasons:**
- Bank account details incorrect
- Public holiday or weekend
- Paystack flagged transaction for review (fraud detection)

**Solution:**
- Verify bank account details in Paystack dashboard
- Check settlement schedule (T+1, excluding weekends/holidays)
- Contact Paystack support if delay > 2 business days

### Issue 4: Subaccount Creation Fails

**Reasons:**
- Artisan bank account is personal savings (not current/business)
- Invalid bank code or account number
- Artisan's name doesn't match bank account

**Solution:**
- Verify artisan's bank account number and bank code
- Use Paystack Bank Verification API to confirm account before creating subaccount
- Request artisan to provide bank statement for verification

---

## Paystack Support Contacts

**For urgent issues:**
- **Email:** support@paystack.com
- **Phone:** +234 1 888 3888
- **Live chat:** Available in Paystack dashboard (9am-5pm WAT, Mon-Fri)
- **Twitter:** @PaystackHQ (for public issues)

**Average response time:** 2-4 hours (business hours)

---

## Privacy Policy Template (NDPR Compliant)

```markdown
# Privacy Policy for EketSupply

**Last Updated:** [Date]

## 1. Introduction

EketSupply Technologies Limited ("we", "our", "us") operates the EketSupply mobile application and website (collectively, the "Platform"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information in compliance with the Nigeria Data Protection Regulation (NDPR) 2019.

## 2. Information We Collect

### 2.1 Personal Information
- Full name, email address, phone number
- Home/business address
- Government-issued ID (for artisan verification)
- Bank account details (for artisans receiving payments)
- Profile photo (optional)

### 2.2 Transaction Information
- Booking details (service type, date, time, location)
- Payment information (processed securely by Paystack)
- Reviews and ratings

### 2.3 Technical Information
- Device information (model, OS version)
- IP address and location data (for nearby artisan matching)
- App usage analytics

## 3. How We Use Your Information

- Facilitate bookings between customers and artisans
- Process payments securely via Paystack
- Verify artisan credentials and background
- Send booking confirmations and updates
- Improve Platform features and user experience
- Comply with legal and regulatory requirements

## 4. Data Sharing

We share your information only with:
- **Artisans:** When you book a service (name, phone, address)
- **Paystack:** For payment processing (encrypted)
- **Law enforcement:** If required by Nigerian law

We NEVER sell your personal data to third parties.

## 5. Data Security

- All data encrypted in transit (HTTPS/TLS)
- Passwords hashed using industry-standard algorithms
- Payment data handled exclusively by PCI-DSS compliant Paystack
- Regular security audits and updates

## 6. Your Rights (NDPR)

You have the right to:
- Access your personal data
- Correct inaccurate information
- Request data deletion (subject to legal retention requirements)
- Withdraw consent for data processing
- Object to automated decision-making

To exercise these rights, contact: privacy@eketsupply.com

## 7. Data Retention

- Active accounts: Data retained while account is active
- Inactive accounts: Data deleted after 2 years of inactivity
- Transaction records: Retained for 5 years (CBN requirement)

## 8. Contact Us

For privacy concerns or data requests:
- **Email:** privacy@eketsupply.com
- **Phone:** +234 XXX XXX XXXX
- **Address:** [Your registered business address]

## 9. Changes to This Policy

We may update this Privacy Policy periodically. Changes will be posted on the Platform with an updated "Last Updated" date.

By using EketSupply, you consent to this Privacy Policy.
```

---

## Next Steps

### Immediate Actions (This Week)

1. **Register business with CAC** (Limited company recommended)
2. **Apply for TIN** (can be done in parallel)
3. **Open business bank account** (GTBank or Access Bank)
4. **Gather KYC documents** (ID, utility bill, CAC certificate)

### After Business Setup (Week 2-3)

5. **Complete Paystack KYC** (upload documents, submit for review)
6. **Wait for approval** (1-3 business days)
7. **Generate live API keys** (after approval)
8. **Configure webhooks** (for payment notifications)

### Before Launch (Week 4)

9. **Test live payments** (small transaction with your own card)
10. **Test refund flow** (ensure refunds work correctly)
11. **Test artisan payouts** (verify subaccount splits work)
12. **Create Privacy Policy and Terms** (NDPR compliance)

### Post-Launch (Ongoing)

13. **Monitor settlements daily** (reconcile with bank account)
14. **Process artisan payouts weekly** (or per your schedule)
15. **File VAT returns quarterly** (once you hit ₦25M revenue)
16. **Renew business registration annually** (CAC annual returns)

---

## Questions?

If you need help with any step, I can:
- Generate Privacy Policy and Terms of Service templates
- Create webhook handler code for payment notifications
- Build admin dashboard for monitoring settlements
- Set up automated artisan payout system
- Implement fraud detection and AML monitoring

Let me know what you need next!
