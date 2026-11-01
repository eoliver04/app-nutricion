import "@/global.css";

import { Platform } from "react-native";

/**
 * Paleta de la app. Todos los componentes deben leer los colores desde aquí
 * (vía `useAppColors`) para que el modo claro y el oscuro se vean bien.
 */
export const Colors = {
  light: {
    text: "#17211D",
    textSecondary: "#60646C",
    background: "#FFFFFF",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    border: "rgba(120, 140, 130, 0.15)",
    primary: "#1A9B6B",
    onPrimary: "#FFFFFF",
    onPrimaryMuted: "#D6F5E8",
    primarySoft: "#D7F4E8",
    onPrimarySoft: "#176547",
    surfaceTint: "#F0F8F4",
    track: "#D6E5DE",
    warningBackground: "#FFF5D8",
    warningIconBackground: "#FFE8A2",
    warningText: "#6E4B00",
    warningTextMuted: "#856A2C",
    danger: "#D16054",
    protein: "#36C98F",
    carbs: "#F5B94C",
    fat: "#F27D6B",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#B0B4BA",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    border: "rgba(160, 180, 170, 0.2)",
    primary: "#2DBF86",
    onPrimary: "#06241A",
    onPrimaryMuted: "#0C3326",
    primarySoft: "#163D30",
    onPrimarySoft: "#8CE0BC",
    surfaceTint: "#1B2A24",
    track: "#2E3A35",
    warningBackground: "#3A2E0E",
    warningIconBackground: "#5C4612",
    warningText: "#FFE2A0",
    warningTextMuted: "#D9C28A",
    danger: "#F08A7E",
    protein: "#36C98F",
    carbs: "#F5B94C",
    fat: "#F27D6B",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppColors = (typeof Colors)[keyof typeof Colors];

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
