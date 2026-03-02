import { useState, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { verifyBankAccount, createArtisanSubaccount } from "@/lib/paystack-service";

// Full list of 237 Nigerian banks from Paystack (loaded from bundled JSON)
import NIGERIAN_BANKS from "@/lib/nigerian-banks.json";

const BANK_ACCOUNT_KEY = "artisan_bank_account";

export interface ArtisanBankAccount {
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  paystack_subaccount_code: string;
  created_at: string;
}

export default function BankDetailsScreen() {
  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [existingAccount, setExistingAccount] = useState<ArtisanBankAccount | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Load existing bank account on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BANK_ACCOUNT_KEY);
        if (stored) setExistingAccount(JSON.parse(stored));
      } catch (_) {}
      setLoadingExisting(false);
    })();
  }, []);

  const filteredBanks = (NIGERIAN_BANKS as { name: string; code: string }[]).filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleVerifyAccount = async () => {
    if (!selectedBank || accountNumber.length < 10) {
      Alert.alert("Error", "Please select a bank and enter a valid 10-digit account number");
      return;
    }
    setVerifying(true);
    setAccountName("");
    try {
      const result = await verifyBankAccount({
        account_number: accountNumber,
        bank_code: selectedBank.code,
      });
      setAccountName(result.account_name);
      Alert.alert(
        "Account Verified ✓",
        `Please confirm this is your account:\n\n${result.account_name}`,
        [
          { text: "Not Mine", style: "cancel", onPress: () => setAccountName("") },
          { text: "Confirm", style: "default" },
        ]
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Could not verify account";
      Alert.alert("Verification Failed", `${msg}\n\nPlease check the account number and bank, then try again.`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      Alert.alert("Error", "Please verify your bank account before saving");
      return;
    }
    setSaving(true);
    try {
      // Create Paystack subaccount for automatic split payments
      const subaccount = await createArtisanSubaccount({
        full_name: accountName,
        bank_code: selectedBank.code,
        account_number: accountNumber,
      });

      const bankAccount: ArtisanBankAccount = {
        account_name: accountName,
        account_number: accountNumber,
        bank_name: selectedBank.name,
        bank_code: selectedBank.code,
        paystack_subaccount_code: subaccount.subaccount_code,
        created_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem(BANK_ACCOUNT_KEY, JSON.stringify(bankAccount));
      setExistingAccount(bankAccount);

      Alert.alert(
        "Bank Account Linked ✓",
        `Your ${selectedBank.name} account has been linked to Paystack.\n\nYou will automatically receive 85% of every payment within 24–48 hours of job completion.`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to link bank account";
      Alert.alert("Setup Failed", `${msg}\n\nPlease try again or contact support.`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAccount = () => {
    Alert.alert(
      "Remove Bank Account",
      "Are you sure you want to remove your linked bank account? You won't receive payments until you add a new one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(BANK_ACCOUNT_KEY);
            setExistingAccount(null);
            setAccountName("");
            setAccountNumber("");
            setSelectedBank(null);
          },
        },
      ]
    );
  };

  if (loadingExisting) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-4 pt-4 pb-4 flex-row items-center border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={22} color="#1B5E20" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-foreground">Bank Details</Text>
            <Text className="text-xs text-muted">Link your account to receive payments</Text>
          </View>
        </View>

        <View className="px-4 pt-5">
          {/* Existing Account Card */}
          {existingAccount && (
            <View className="mb-5 bg-surface rounded-2xl border border-border overflow-hidden">
              <View className="px-4 py-3 border-b border-border flex-row items-center">
                <IconSymbol name="checkmark.circle.fill" size={18} color="#22C55E" />
                <Text className="ml-2 text-sm font-semibold text-foreground">Linked Account</Text>
              </View>
              <View className="px-4 py-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-muted">Account Name</Text>
                  <Text className="text-sm font-semibold text-foreground">{existingAccount.account_name}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-muted">Bank</Text>
                  <Text className="text-sm text-foreground">{existingAccount.bank_name}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-muted">Account Number</Text>
                  <Text className="text-sm text-foreground">
                    {"•".repeat(6)}{existingAccount.account_number.slice(-4)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-xs text-muted">Subaccount Code</Text>
                  <Text className="text-xs font-mono text-muted">{existingAccount.paystack_subaccount_code}</Text>
                </View>
                <View className="bg-success/10 rounded-xl px-3 py-2 mb-3">
                  <Text className="text-xs text-center" style={{ color: "#16a34a" }}>
                    ✓ Split payments active — 85% to you, 15% to EketSupply
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemoveAccount} className="items-center py-2">
                  <Text className="text-xs text-error">Remove Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Info Banner */}
          {!existingAccount && (
            <View className="bg-surface rounded-2xl p-4 mb-5 border border-border">
              <View className="flex-row items-start">
                <IconSymbol name="info.circle.fill" size={18} color="#1B5E20" />
                <View className="flex-1 ml-2">
                  <Text className="text-sm font-semibold text-foreground mb-1">How Payments Work</Text>
                  <Text className="text-xs text-muted leading-relaxed">
                    When a customer pays for your service, Paystack automatically sends{" "}
                    <Text className="font-semibold text-foreground">85%</Text> to your bank account
                    and <Text className="font-semibold text-foreground">15%</Text> to EketSupply.
                    Settlement happens within 24–48 hours of job completion.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Add / Update Account Form */}
          {!existingAccount && (
            <>
              {/* Section title */}
              <Text className="text-base font-bold text-foreground mb-4">
                Link Your Bank Account
              </Text>

              {/* Bank Selector */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Select Bank</Text>
                <TouchableOpacity
                  onPress={() => setShowBankPicker(!showBankPicker)}
                  className="bg-surface border border-border rounded-xl px-4 py-3.5 flex-row justify-between items-center"
                >
                  <Text className={selectedBank ? "text-foreground" : "text-muted"}>
                    {selectedBank?.name ?? "Choose your bank"}
                  </Text>
                  <IconSymbol name="chevron.down" size={16} color="#9BA1A6" />
                </TouchableOpacity>

                {/* Bank Picker Dropdown */}
                {showBankPicker && (
                  <View
                    className="bg-background border border-border rounded-xl mt-1 overflow-hidden"
                    style={{ maxHeight: 300 }}
                  >
                    <View className="px-3 py-2 border-b border-border">
                      <TextInput
                        placeholder="Search bank..."
                        placeholderTextColor="#9BA1A6"
                        value={bankSearch}
                        onChangeText={setBankSearch}
                        className="text-foreground text-sm"
                        returnKeyType="search"
                      />
                    </View>
                    <FlatList
                      data={filteredBanks}
                      keyExtractor={(item) => item.code}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedBank(item);
                            setShowBankPicker(false);
                            setBankSearch("");
                            setAccountName("");
                          }}
                          className="px-4 py-3 border-b border-border"
                        >
                          <Text
                            className={`text-sm ${selectedBank?.code === item.code ? "font-semibold" : ""} text-foreground`}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>

              {/* Account Number */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Account Number</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <TextInput
                    className="flex-1 py-3.5 text-foreground"
                    placeholder="10-digit account number"
                    placeholderTextColor="#9BA1A6"
                    value={accountNumber}
                    onChangeText={(v) => {
                      setAccountNumber(v.replace(/\D/g, "").slice(0, 10));
                      setAccountName("");
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    returnKeyType="done"
                  />
                  {accountNumber.length === 10 && selectedBank && !accountName && (
                    <TouchableOpacity onPress={handleVerifyAccount} disabled={verifying}>
                      {verifying ? (
                        <ActivityIndicator size="small" color="#1B5E20" />
                      ) : (
                        <Text className="text-sm font-semibold" style={{ color: "#1B5E20" }}>
                          Verify
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Verified Account Name */}
              {accountName ? (
                <View className="mb-5 bg-success/10 border border-success/30 rounded-xl px-4 py-3 flex-row items-center">
                  <IconSymbol name="checkmark.circle.fill" size={18} color="#22C55E" />
                  <View className="ml-2">
                    <Text className="text-xs text-muted">Verified Account Name</Text>
                    <Text className="text-sm font-semibold text-foreground">{accountName}</Text>
                  </View>
                </View>
              ) : null}

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || !accountName}
                className="rounded-full py-4 items-center mb-4"
                style={{ backgroundColor: accountName ? "#1B5E20" : "#D4E0D4" }}
              >
                {saving ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Creating Subaccount...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Link Bank Account
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Security Note */}
          <View className="flex-row items-center justify-center mb-8">
            <IconSymbol name="lock.fill" size={13} color="#9BA1A6" />
            <Text className="text-xs text-muted ml-1">
              Bank details are securely processed by Paystack
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
