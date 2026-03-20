/**
 * AppIcon — a thin wrapper around IconSymbol that accepts a `color` string
 * (defaulting to the theme muted color) and a `size` (defaulting to 18).
 *
 * Use this instead of raw emoji text nodes throughout the app so all icons
 * share the same rendering path and can be restyled globally.
 *
 * Usage:
 *   <AppIcon name="location.fill" size={16} color={colors.muted} />
 */

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./icon-symbol";
import type { ComponentProps } from "react";

type IconSymbolProps = ComponentProps<typeof IconSymbol>;

export function AppIcon({
  name,
  size = 18,
  color,
  style,
}: {
  name: IconSymbolProps["name"];
  size?: number;
  color?: string;
  style?: IconSymbolProps["style"];
}) {
  const colors = useColors();
  return (
    <IconSymbol
      name={name}
      size={size}
      color={color ?? colors.muted}
      style={style}
    />
  );
}
