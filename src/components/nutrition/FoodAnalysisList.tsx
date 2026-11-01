import { StyleSheet, Text, View } from "react-native";

import type { NutritionFood } from "@/features/nutrition/types";
import { useAppColors } from "@/hooks/use-app-colors";

export function FoodAnalysisList({ foods }: { foods: NutritionFood[] }) {
  const colors = useAppColors();

  if (foods.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No se han reconocido alimentos en esta foto. Prueba con más luz o
          acercando la cámara al plato.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      {foods.map((food, index) => (
        <View
          key={`${food.name}-${food.fdcId ?? index}`}
          style={[
            styles.row,
            index < foods.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
          ]}
          accessible
          accessibilityLabel={`${food.name}, ${Math.round(food.grams)} gramos, ${Math.round(food.calories)} kilocalorías, ${Math.round(food.protein)} gramos de proteína, ${Math.round(food.carbohydrates)} de carbohidratos y ${Math.round(food.fat)} de grasa`}
        >
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.iconText, { color: colors.primary }]}>◈</Text>
          </View>
          <View style={styles.main}>
            <Text style={[styles.name, { color: colors.text }]}>{food.name}</Text>
            <Text style={[styles.weight, { color: colors.textSecondary }]}>
              {Math.round(food.grams)}g · {Math.round(food.calories)} kcal
            </Text>
            {food.usdaMatch ? (
              <Text
                style={[styles.match, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                USDA: {food.usdaMatch}
              </Text>
            ) : (
              <Text style={[styles.match, { color: colors.warningTextMuted }]}>
                Sin coincidencia en USDA
              </Text>
            )}
          </View>
          <View style={styles.macros}>
            <Text style={[styles.macro, { color: colors.text }]}>
              {Math.round(food.protein)}g P
            </Text>
            <Text style={[styles.macro, { color: colors.textSecondary }]}>
              {Math.round(food.carbohydrates)}g C · {Math.round(food.fat)}g G
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, paddingHorizontal: 15 },
  empty: { fontSize: 13, lineHeight: 18, paddingVertical: 22, textAlign: "center" },
  row: { minHeight: 76, flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 18 },
  main: { flex: 1, marginLeft: 12 },
  name: { fontSize: 13, fontWeight: "700" },
  weight: { fontSize: 11, marginTop: 4 },
  match: { fontSize: 10, marginTop: 3 },
  macros: { alignItems: "flex-end" },
  macro: { fontSize: 10, marginTop: 3 },
});
