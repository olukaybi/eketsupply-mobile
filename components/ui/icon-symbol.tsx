// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Partial<Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping for EketSupply.
 * Add new icons here BEFORE using them in tabs or screens.
 */
const MAPPING = {
  // Navigation
  "house.fill":                              "home",
  "calendar":                                "event",
  "person.fill":                             "person",
  "person.2.fill":                           "people",
  "person.badge.plus.fill":                  "person-add",
  "wrench.and.screwdriver.fill":             "construction",
  "chart.bar.fill":                          "bar-chart",
  "gearshape.fill":                          "settings",
  "bell.fill":                               "notifications",
  "magnifyingglass":                         "search",
  "map.fill":                                "map",
  "message.fill":                            "chat",

  // Actions
  "plus":                                    "add",
  "plus.circle.fill":                        "add-circle",
  "xmark":                                   "close",
  "xmark.circle.fill":                       "cancel",
  "checkmark":                               "check",
  "checkmark.circle.fill":                   "check-circle",
  "chevron.right":                           "chevron-right",
  "chevron.left":                            "chevron-left",
  "chevron.down":                            "keyboard-arrow-down",
  "arrow.left":                              "arrow-back",
  "arrow.right":                             "arrow-forward",
  "arrow.up.arrow.down":                     "swap-vert",
  "arrow.triangle.2.circlepath.camera":      "flip-camera-ios",
  "square.and.arrow.up":                     "share",
  "square.and.pencil":                       "edit",
  "trash":                                   "delete",
  "trash.fill":                              "delete",
  "ellipsis":                                "more-horiz",
  "ellipsis.circle":                         "more-vert",

  // Media
  "photo":                                   "photo",
  "photo.fill":                              "photo",
  "camera.fill":                             "camera-alt",
  "video.fill":                              "videocam",
  "play.fill":                               "play-arrow",
  "pause.fill":                              "pause",
  "speaker.wave.2.fill":                     "volume-up",

  // Content
  "star.fill":                               "star",
  "star":                                    "star-border",
  "heart.fill":                              "favorite",
  "heart":                                   "favorite-border",
  "bookmark.fill":                           "bookmark",
  "tag.fill":                                "local-offer",
  "doc.text.fill":                           "description",
  "doc.fill":                                "insert-drive-file",
  "paperplane.fill":                         "send",
  "envelope.fill":                           "email",
  "phone.fill":                              "phone",
  "location.fill":                           "location-on",
  "clock.fill":                              "schedule",
  "exclamationmark.triangle.fill":           "warning",
  "info.circle.fill":                        "info",
  "shield.fill":                             "security",
  "lock.fill":                               "lock",
  "creditcard.fill":                         "credit-card",
  "banknote.fill":                           "account-balance-wallet",
  "building.2.fill":                         "business",
  "wrench.fill":                             "build",
  "bolt.fill":                               "bolt",
  "drop.fill":                               "water-drop",
  "flame.fill":                              "local-fire-department",
  "paintbrush.fill":                         "brush",
  "hammer.fill":                             "hardware",
  "chart":                                   "bar-chart",
  "chevron.left.forwardslash.chevron.right": "code",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? "help-outline"} style={style} />;
}
