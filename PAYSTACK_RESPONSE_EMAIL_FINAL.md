# Paystack Response Email - Revised Payment Structure

---

**To:** reviews@paystack.com  
**Subject:** Re: Activation Request for Kaybi Enterprises (1700330) - Payment Structure Clarification

---

Hello Chimuanya,

Thank you for the clarification regarding escrow policies. I completely understand Paystack's position on holding third-party funds, and I appreciate you taking the time to explain the supported use cases.

**Revised Payment Structure:**

EketSupply will use **Paystack Subaccounts with automatic split payments** instead of escrow. This is the industry-standard model for marketplaces, and I understand it's exactly what Paystack's subaccount feature is designed for.

**How it will work:**

1. **Artisan Onboarding:**  
   When artisans join the platform and complete verification (ID check, bank account verification), we create a Paystack subaccount for each artisan using the Subaccount API. Each artisan's bank account details are verified using Paystack's Bank Verification API before subaccount creation.

2. **Payment Collection:**  
   When a customer books a service, payment is processed via Paystack with the artisan's subaccount code specified in the transaction initialization. The payment amount includes the full service cost.

3. **Automatic Split:**  
   Paystack automatically splits the payment in real-time:
   - **85% to artisan's subaccount** → settled to their bank account per Paystack's T+1 schedule
   - **15% to EketSupply's main account** → our platform commission

4. **Settlement Timing:**  
   We will use Paystack's settlement delay feature (24-48 hours) to provide a brief dispute resolution window before funds are released to artisans. This protects customers from artisan no-shows while staying within Paystack's supported use cases.

5. **Dispute Handling:**  
   If a customer files a dispute (artisan no-show, incomplete job, etc.) within the settlement delay window, we will process a refund via Paystack's Refund API. The artisan's account will be penalized according to our Terms of Service, and repeat offenders will be suspended from the platform.

**This model is identical to how Uber, Bolt, Jumia, and other Nigerian ride-hailing/marketplace platforms operate with Paystack.**

**Key Points:**
- ✅ No funds held by EketSupply on behalf of third parties
- ✅ Payments split automatically by Paystack in real-time  
- ✅ Each artisan has their own Paystack subaccount linked to their verified bank account
- ✅ EketSupply only receives the 15% commission for services we facilitate
- ✅ Refunds processed via standard Paystack Refund API (not manual transfers)
- ✅ Settlement delay feature used for customer protection (within Paystack's 7-day limit)

**Paystack Features We'll Use:**
- **Subaccount API** - Create and manage artisan subaccounts
- **Bank Verification API** - Verify artisan bank accounts before subaccount creation
- **Transaction Initialization** - Process payments with subaccount parameter for automatic splits
- **Settlement Delay** - 24-48 hour window for dispute resolution
- **Refund API** - Customer protection for disputes
- **Webhook Integration** - Real-time payment status notifications

**Customer Protection:**
- 24-48 hour dispute window before artisan receives funds
- Full refund guarantee for artisan no-shows
- Partial refunds for incomplete or unsatisfactory work (case-by-case review)
- Artisan rating and review system
- Artisan suspension for repeat violations

**Artisan Protection:**
- Funds released automatically if no dispute filed
- Clear Terms of Service outlining expectations
- Dispute resolution process with evidence review
- Protection from fraudulent customer claims

Does this revised payment structure align with Paystack's supported use cases? I believe this is the standard marketplace model that Paystack's subaccount feature was designed to support, and it's how other successful Nigerian platforms operate.

Please let me know if you need any additional clarification or if there are any other requirements for the activation review.

Thank you for your guidance on this matter, and I look forward to partnering with Paystack to serve the Nigerian market.

Warm regards,

**Olukayode Awosika**  
Founder & Managing Director  
EketSupply Technologies Limited  
Email: awosh1@gmail.com  
Website: www.eketsupply.com

---

## Alternative: Shorter Version (If You Prefer Brevity)

---

Hello Chimuanya,

Thank you for clarifying Paystack's escrow policy. I completely understand.

**We will use Paystack Subaccounts for split payments instead:**

- Each verified artisan gets a Paystack subaccount (created via Subaccount API)
- Customer payments automatically split: 85% to artisan, 15% to EketSupply
- Settlement delay (24-48 hours) provides dispute window
- Refunds processed via Refund API if issues arise

This is the standard marketplace model (same as Uber, Bolt, Jumia) and exactly what Paystack subaccounts are designed for. No funds held by EketSupply - Paystack handles all splits and settlements automatically.

Does this align with your supported use cases?

Thank you,

**Olukayode Awosika**  
EketSupply Technologies Limited  
www.eketsupply.com

---

## Recommendation

**Use the first (longer) version** - it shows you:
1. ✅ Understand their concern completely
2. ✅ Have a clear solution (subaccounts)
3. ✅ Know how the industry works (Uber, Bolt reference)
4. ✅ Thought through customer AND artisan protection
5. ✅ Are using Paystack features correctly

This will likely get immediate approval since you're describing exactly what Paystack subaccounts are designed for.
