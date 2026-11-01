import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";

type SymbolName = ComponentProps<typeof SymbolView>["name"];

export function NutritionIcon({
  name,
  color,
  size = 20,
}: {
  name: SymbolName;
  color: string;
  size?: number;
}) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}
