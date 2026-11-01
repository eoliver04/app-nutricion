import { Colors, type AppColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** Devuelve la paleta activa según el esquema de color del sistema. */
export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return Colors[scheme === "dark" ? "dark" : "light"];
}
