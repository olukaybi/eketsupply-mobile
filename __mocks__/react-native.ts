/**
 * React Native mock for Vitest (Node environment).
 * Stubs the minimal surface area needed by our tests.
 */

export const Platform = {
  OS: "ios" as const,
  select: (obj: Record<string, unknown>) => obj["ios"] ?? obj["default"] ?? undefined,
  Version: 17,
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
};

export const Dimensions = {
  get: (_dim: string) => ({ width: 375, height: 812 }),
  addEventListener: () => ({ remove: () => {} }),
};

export const Alert = { alert: () => {} };
export const Linking = { openURL: async () => {}, canOpenURL: async () => true };
export const Keyboard = { dismiss: () => {}, addListener: () => ({ remove: () => {} }) };
export const AppState = { currentState: "active", addEventListener: () => ({ remove: () => {} }) };

export const Animated = {
  Value: class { constructor(_val: number) {} setValue(_val: number) {} interpolate(_c: unknown) { return this; } },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  spring: () => ({ start: (cb?: () => void) => cb?.() }),
  createAnimatedComponent: (C: unknown) => C,
  View: "View",
};

export const View = "View";
export const Text = "Text";
export const TextInput = "TextInput";
export const TouchableOpacity = "TouchableOpacity";
export const Pressable = "Pressable";
export const ScrollView = "ScrollView";
export const FlatList = "FlatList";
export const Image = "Image";
export const Modal = "Modal";
export const ActivityIndicator = "ActivityIndicator";
export const SafeAreaView = "SafeAreaView";

export default {
  Platform, StyleSheet, Dimensions, Alert, Linking, Keyboard, AppState, Animated,
  View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, FlatList, Image, Modal,
  ActivityIndicator, SafeAreaView,
};
