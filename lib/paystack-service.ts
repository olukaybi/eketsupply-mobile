import { supabase } from './supabase';

// Paystack configuration
const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SECRET_KEY = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '';

export type PaymentData = {
  amount: number; // in kobo (₦1 = 100 kobo)
  email: string;
  reference: string;
  metadata?: {
    booking_id: string;
    customer_id: string;
    artisan_id: string;
    service_name: string;
  };
};

export type PaymentResult = {
  success: boolean;
  reference: string;
  transaction_id?: string;
  message?: string;
};

/**
 * Initialize a Paystack payment
 * Returns payment authorization URL for web or payment reference for mobile
 */
export async function initializePayment(data: PaymentData): Promise<{
  authorization_url?: string;
  access_code?: string;
  reference: string;
}> {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        metadata: data.metadata,
        callback_url: 'https://eketsupply.com/payment/callback',
      }),
    });

    const result = await response.json();

    if (!result.status) {
      throw new Error(result.message || 'Payment initialization failed');
    }

    return {
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPayment(reference: string): Promise<PaymentResult> {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const result = await response.json();

    if (!result.status) {
      return {
        success: false,
        reference,
        message: result.message || 'Payment verification failed',
      };
    }

    const transaction = result.data;

    return {
      success: transaction.status === 'success',
      reference: transaction.reference,
      transaction_id: transaction.id.toString(),
      message: transaction.gateway_response,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      reference,
      message: 'Payment verification failed',
    };
  }
}

/**
 * Create a payment record in the database
 */
export async function createPaymentRecord(data: {
  booking_id: string;
  amount: number;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  transaction_id?: string;
}) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        booking_id: data.booking_id,
        amount: data.amount / 100, // Convert kobo to naira
        reference: data.reference,
        status: data.status,
        transaction_id: data.transaction_id,
        payment_method: 'paystack',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return payment;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  reference: string,
  status: 'success' | 'failed',
  transaction_id?: string
) {
  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status,
        transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq('reference', reference);

    if (error) throw error;

    // If payment successful, update booking status
    if (status === 'success') {
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id')
        .eq('reference', reference)
        .single();

      if (payment) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'accepted',
          })
          .eq('id', payment.booking_id);
      }
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(bookingId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `EKET-${bookingId.substring(0, 8)}-${timestamp}-${random}`;
}

/**
 * Calculate Paystack fees (1.5% + ₦100 for local cards)
 */
export function calculatePaystackFees(amount: number): {
  amount: number;
  fees: number;
  total: number;
} {
  const feePercentage = 0.015; // 1.5%
  const flatFee = 100; // ₦100
  const fees = Math.ceil(amount * feePercentage + flatFee);
  const total = amount + fees;

  return {
    amount,
    fees,
    total,
  };
}
