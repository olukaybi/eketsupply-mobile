import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Common Nigerian banks with Paystack codes
const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

export default function BankDetailsScreen() {
  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const filteredBanks = NIGERIAN_BANKS.filter(b =>
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
      // In production, this calls the Paystack bank resolve API via your backend
      // For now, we simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulated response — in production this comes from Paystack API
      setAccountName("ACCOUNT HOLDER NAME");
      Alert.alert(
        "Account Verified",
        "Please confirm this is your account:\n\nAccount Name: ACCOUNT HOLDER NAME",
        [
          { text: "Not Mine", style: "cancel", onPress: () => setAccountName("") },
          { text: "Confirm", onPress: () => {} },
        ]
      );
    } catch (_error) {
      Alert.alert("Verification Failed", "Could not verify account. Please check the details and try again.");
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
      // In production: call backend to create Paystack subaccount
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        "Bank Details Saved",
        "Your bank account has been linked. You will receive payments automatically after each completed job.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (_error) {
      Alert.alert("Error", "Failed to save bank details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
          {/* Info Banner */}
          <View className="bg-surface rounded-2xl p-4 mb-5 border border-border">
            <View className="flex-row items-start">
              <IconSymbol name="info.circle.fill" size={18} color="#1B5E20" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-foreground mb-1">How Payments Work</Text>
                <Text className="text-xs text-muted leading-relaxed">
                  When a customer pays for your service, Paystack automatically sends{" "}
                  <Text className="font-semibold text-foreground">85%</Text> to your bank account
                  and <Text className="font-semibold text-foreground">15%</Text> to EketSupply.
                  Settlement happens within 24-48 hours of job completion.
                </Text>
              </View>
            </View>
          </View>

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
              <View className="bg-background border border-border rounded-xl mt-1 overflow-hidden" style={{ maxHeight: 280 }}>
                <View className="px-3 py-2 border-b border-border">
                  <TextInput
                    placeholder="Search bank..."
                    placeholderTextColor="#9BA1A6"
                    value={bankSearch}
                    onChangeText={setBankSearch}
                    className="text-foreground text-sm"
                  />
                </View>
                <ScrollView nestedScrollEnabled>
                  {filteredBanks.map(bank => (
                    <TouchableOpacity
                      key={bank.code}
                      onPress={() => {
                        setSelectedBank(bank);
                        setShowBankPicker(false);
                        setBankSearch("");
                        setAccountName("");
                      }}
                      className="px-4 py-3 border-b border-border"
                    >
                      <Text className={`text-sm ${selectedBank?.code === bank.code ? "font-semibold" : ""} text-foreground`}>
                        {bank.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
              />
              {accountNumber.length === 10 && selectedBank && !accountName && (
                <TouchableOpacity onPress={handleVerifyAccount} disabled={verifying}>
                  {verifying ? (
                    <ActivityIndicator size="small" color="#1B5E20" />
                  ) : (
                    <Text className="text-sm font-semibold" style={{ color: "#1B5E20" }}>Verify</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Account Name (after verification) */}
          {accountName ? (
            <View className="mb-5 bg-success/10 border border-success/30 rounded-xl px-4 py-3 flex-row items-center">
              <IconSymbol name="checkmark.circle.fill" size={18} color="#22C55E" />
              <View className="ml-2">
                <Text className="text-xs text-muted">Account Name</Text>
                <Text className="text-sm font-semibold text-foreground">{accountName}</Text>
              </View>
            </View>
          ) : null}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !accountName}
            className="rounded-full py-4 items-center mb-8"
            style={{
              backgroundColor: accountName ? "#1B5E20" : "#D4E0D4",
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Save Bank Details</Text>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <View className="flex-row items-center justify-center mb-6">
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
