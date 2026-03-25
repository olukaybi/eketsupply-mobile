// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Partial<Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>>;
export type IconSymbolName = keyof typeof MAPPING;

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
  "checkmark.seal.fill":                     "verified",
  "chevron.right":                           "chevron-right",
  "chevron.left":                            "chevron-left",
  "chevron.down":                            "keyboard-arrow-down",
  "arrow.left":                              "arrow-back",
  "arrow.right":                             "arrow-forward",
  "arrow.up.arrow.down":                     "swap-vert",
  "arrow.counterclockwise":                  "refresh",
  "arrow.triangle.2.circlepath.camera":      "flip-camera-ios",
  "square.and.arrow.up":                     "share",
  "square.and.pencil":                       "edit",
  "trash":                                   "delete",
  "trash.fill":                              "delete",
  "ellipsis":                                "more-horiz",
  "ellipsis.circle":                         "more-vert",
  "filter":                                  "filter-list",
  "line.3.horizontal.decrease.circle":       "tune",

  // Media
  "photo":                                   "photo",
  "photo.fill":                              "photo",
  "camera.fill":                             "camera-alt",
  "video.fill":                              "videocam",
  "play.fill":                               "play-arrow",
  "pause.fill":                              "pause",
  "speaker.wave.2.fill":                     "volume-up",

  // Content & Communication
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
  "bubble.left.fill":                        "chat-bubble",
  "bubble.left.and.bubble.right.fill":       "forum",
  "megaphone.fill":                          "campaign",

  // Location & Time
  "location.fill":                           "location-on",
  "clock.fill":                              "schedule",
  "calendar.badge.clock":                    "event-available",
  "timer":                                   "timer",

  // Status & Alerts
  "exclamationmark.triangle.fill":           "warning",
  "exclamationmark.circle.fill":             "error",
  "info.circle.fill":                        "info",
  "questionmark.circle.fill":               "help",
  "checkmark.shield.fill":                   "verified-user",

  // Security & Finance
  "shield.fill":                             "security",
  "lock.fill":                               "lock",
  "lock.open.fill":                          "lock-open",
  "creditcard.fill":                         "credit-card",
  "banknote.fill":                           "account-balance-wallet",
  "dollarsign.circle.fill":                  "monetization-on",
  "chart.line.uptrend.xyaxis":               "trending-up",

  // Business & Work
  "building.2.fill":                         "business",
  "briefcase.fill":                          "work",
  "person.crop.circle.badge.checkmark":      "how-to-reg",
  "person.text.rectangle.fill":             "badge",
  "list.bullet.clipboard.fill":             "assignment",
  "doc.badge.plus":                          "note-add",
  "tray.full.fill":                          "inbox",
  "archivebox.fill":                         "archive",
  "rectangle.3.group.fill":                  "dashboard",
  "chart.pie.fill":                          "pie-chart",

  // Tools & Services
  "wrench.fill":                             "build",
  "bolt.fill":                               "bolt",
  "drop.fill":                               "water-drop",
  "flame.fill":                              "local-fire-department",
  "paintbrush.fill":                         "brush",
  "hammer.fill":                             "hardware",
  "screwdriver.fill":                        "handyman",
  "house.and.flag.fill":                     "roofing",
  "square.grid.2x2.fill":                    "grid-view",
  "sparkles":                                "auto-awesome",
  "trophy.fill":                             "emoji-events",
  "gift.fill":                               "card-giftcard",
  "person.2.wave.2.fill":                    "groups",
  "antenna.radiowaves.left.and.right":       "wifi",
  "wifi":                                    "wifi",
  "exclamationmark.octagon.fill":            "report",
  "flag.fill":                               "flag",
  "chart":                                   "bar-chart",
  "chevron.left.forwardslash.chevron.right": "code",
  // Additional icons for artisan badges and other screens
  "target":                                  "gps-fixed",
  "star.circle.fill":                        "star-rate",
  "tray.fill":                               "inbox",
  "at":                                      "alternate-email",
  "music.note":                              "music-note",
  "banknote":                                "account-balance-wallet",
  "percent":                                  "percent",
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
