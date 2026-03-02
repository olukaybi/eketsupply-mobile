import { Image, type ImageStyle } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

const LIGHT_LOGO = require("@/assets/images/eketsupply-logo.png");
const DARK_LOGO = require("@/assets/images/eketsupply-logo-dark.png");

interface ThemedLogoProps {
  /** Width of the logo. Height is calculated automatically to preserve aspect ratio (1365:338 ≈ 4.04:1). */
  width?: number;
  style?: ImageStyle;
}

/**
 * Displays the EketSupply logo, automatically switching between the light-mode
 * variant (dark navy tagline) and the dark-mode variant (white tagline) based
 * on the current color scheme.
 */
export function ThemedLogo({ width = 200, style }: ThemedLogoProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Original image dimensions: 1365 × 338
  const height = Math.round(width * (338 / 1365));

  return (
    <Image
      source={isDark ? DARK_LOGO : LIGHT_LOGO}
      style={[{ width, height, resizeMode: "contain" }, style]}
      accessibilityLabel="EketSupply — Fix it Right, The First Time."
    />
  );
}
