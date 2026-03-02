import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializePayment,
  createPaymentRecord,
  updatePaymentStatus,
  generatePaymentReference,
  calculatePaystackFees,
  type PaymentData,
} from '@/lib/paystack-service';
import type { ArtisanBankAccount } from '@/app/artisan/bank-details';

// AsyncStorage key used by bank-details.tsx
const ARTISAN_BANK_KEY = 'artisan_bank_account';

type PaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  amount: number; // in naira
  bookingId: string;
  customerId: string;
  artisanId: string;
  customerEmail: string;
  serviceName: string;
  onSuccess: (bookingId?: string) => void;
};

export function PaymentModal({
  visible,
  onClose,
  amount,
  bookingId,
  customerId,
  artisanId,
  customerEmail,
  serviceName,
  onSuccess,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success' | 'failed'>('confirm');
  const [artisanSubaccountCode, setArtisanSubaccountCode] = useState<string | undefined>(undefined);
  const [splitReady, setSplitReady] = useState(false);

  const { amount: baseAmount, fees, total } = calculatePaystackFees(amount);

  // Load artisan's Paystack subaccount code for split payments
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        // Try artisan-specific key first (for when customer looks up artisan's subaccount)
        const artisanSpecific = await AsyncStorage.getItem(`${ARTISAN_BANK_KEY}_${artisanId}`);
        if (artisanSpecific) {
          const account: ArtisanBankAccount = JSON.parse(artisanSpecific);
          setArtisanSubaccountCode(account.paystack_subaccount_code);
          setSplitReady(true);
          return;
        }
        // Fallback: generic key (artisan's own device)
        const generic = await AsyncStorage.getItem(ARTISAN_BANK_KEY);
        if (generic) {
          const account: ArtisanBankAccount = JSON.parse(generic);
          setArtisanSubaccountCode(account.paystack_subaccount_code);
          setSplitReady(true);
        } else {
          // No subaccount — payment goes to EketSupply main account
          setSplitReady(false);
        }
      } catch (_) {
        setSplitReady(false);
      }
    })();
  }, [artisanId, visible]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStep('processing');

      const reference = generatePaymentReference(bookingId);

      // Create payment record
      await createPaymentRecord({
        booking_id: bookingId,
        amount: total * 100, // Convert to kobo
        reference,
        status: 'pending',
      });

      // Initialize payment with Paystack — include subaccount for split payment
      const paymentData: PaymentData = {
        amount: total * 100, // Convert to kobo
        email: customerEmail,
        reference,
        // Split payment: artisan gets 85%, EketSupply gets 15%
        subaccount_code: artisanSubaccountCode,
        settlement_delay: 24, // 24-hour dispute window before artisan is paid
        metadata: {
          booking_id: bookingId,
          customer_id: customerId,
          artisan_id: artisanId,
          service_name: serviceName,
        },
      };

      const _paymentInit = await initializePayment(paymentData);

      // In production, open the Paystack payment page via WebBrowser
      // For this demo, we simulate a successful payment
      Alert.alert(
        'Payment Gateway',
        `In production, this would open the Paystack payment page.\n\nReference: ${reference}${artisanSubaccountCode ? `\nSplit: 85% → Artisan, 15% → EketSupply` : '\nNote: Artisan has not linked a bank account yet'}\n\nSimulate outcome:`,
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await new Promise(resolve => setTimeout(resolve, 1500));
              await updatePaymentStatus(reference, 'success', 'demo_txn_' + Date.now());
              setPaymentStep('success');
              setProcessing(false);
              setTimeout(() => {
                onSuccess(bookingId);
                onClose();
              }, 2000);
            },
          },
          {
            text: 'Simulate Failure',
            style: 'destructive',
            onPress: async () => {
              await updatePaymentStatus(reference, 'failed');
              setPaymentStep('failed');
              setProcessing(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'An error occurred while processing your payment. Please try again.');
      setPaymentStep('failed');
      setProcessing(false);
    }
  };

  const renderContent = () => {
    switch (paymentStep) {
      case 'confirm':
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">Confirm Payment</Text>

            <View className="bg-surface rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted">Service</Text>
                <Text className="text-foreground font-medium">{serviceName}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted">Amount</Text>
                <Text className="text-foreground font-medium">₦{baseAmount.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted text-xs">Payment Processing Fee</Text>
                <Text className="text-muted text-xs">₦{fees.toLocaleString()}</Text>
              </View>
              <View className="border-t border-border my-2" />
              <View className="flex-row justify-between">
                <Text className="text-foreground font-bold">Total</Text>
                <Text className="text-primary font-bold text-lg">₦{total.toLocaleString()}</Text>
              </View>
            </View>

            {/* Split payment indicator */}
            {splitReady && artisanSubaccountCode ? (
              <View className="bg-success/10 border border-success/20 rounded-xl p-3 mb-4">
                <Text className="text-xs text-center" style={{ color: '#16a34a' }}>
                  ✓ Split payment active — artisan receives 85% automatically
                </Text>
              </View>
            ) : (
              <View className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-4">
                <Text className="text-xs text-center text-warning">
                  ⚠ Artisan has not linked a bank account yet
                </Text>
              </View>
            )}

            <View className="bg-surface rounded-xl p-3 mb-4 border border-border">
              <Text className="text-muted text-xs">
                🔒 Your payment is processed securely by Paystack. The artisan receives their share automatically after a 24-hour settlement window, giving you time to raise any concerns.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-surface border border-border rounded-xl py-4"
              >
                <Text className="text-center text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePayment}
                disabled={processing}
                className="flex-1 bg-primary rounded-xl py-4"
              >
                <Text className="text-center text-background font-semibold">
                  Pay ₦{total.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'processing':
        return (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="text-foreground font-semibold mt-4 mb-2">Processing Payment</Text>
            <Text className="text-muted text-sm text-center">
              Please wait while we process your payment...
            </Text>
          </View>
        );

      case 'success':
        return (
          <View className="items-center py-8">
            <View className="w-16 h-16 bg-success/20 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">✓</Text>
            </View>
            <Text className="text-foreground font-bold text-xl mb-2">Payment Successful!</Text>
            <Text className="text-muted text-sm text-center">
              Your payment has been processed securely.{'\n'}
              The artisan will be notified of your booking.{'\n'}
              {artisanSubaccountCode ? 'Artisan payout scheduled in 24 hours.' : ''}
            </Text>
          </View>
        );

      case 'failed':
        return (
          <View className="items-center py-8">
            <View className="w-16 h-16 bg-error/20 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">✕</Text>
            </View>
            <Text className="text-foreground font-bold text-xl mb-2">Payment Failed</Text>
            <Text className="text-muted text-sm text-center mb-4">
              {"We couldn't process your payment. Please try again."}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setPaymentStep('confirm');
                setProcessing(false);
              }}
              className="bg-primary rounded-xl px-6 py-3"
            >
              <Text className="text-background font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="bg-background rounded-2xl p-6 w-full max-w-md">
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}
