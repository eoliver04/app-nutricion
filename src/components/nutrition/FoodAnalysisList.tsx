import { StyleSheet, Text, View } from "react-native";

import type { AppColors } from "@/constants/theme";
import type { NutritionFood } from "@/features/nutrition/types";

export function FoodAnalysisList({
  colors,
  foods,
}: {
  colors: AppColors;
  foods: NutritionFood[];
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      {foods.map((food, index) => (
        <View
          key={`${food.name}-${food.fdcId ?? index}`}
          style={[
            styles.row,
            index < foods.length - 1 && styles.divider,
          ]}
        >
          <View style={styles.icon}>
            <Text style={styles.iconText}>◈</Text>
          </View>
          <View style={styles.main}>
            <Text style={[styles.name, { color: colors.text }]}>
              {food.name}
            </Text>
            <Text style={[styles.weight, { color: colors.textSecondary }]}>
              {Math.round(food.grams ?? 0)}g · {Math.round(food.calories ?? 0)} kcal
            </Text>
          </View>
          <View style={styles.macros}>
            <Text style={[styles.macro, { color: colors.text }]}>
              {Math.round(food.protein ?? 0)}g P
            </Text>
            <Text style={[styles.macro, { color: colors.textSecondary }]}>
              {Math.round(food.carbohydrates ?? 0)}g C · {Math.round(food.fat ?? 0)}g G
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, paddingHorizontal: 15 },
  row: { minHeight: 76, flexDirection: "row", alignItems: "center" },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120, 140, 130, 0.15)",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#D7F4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#1A9B6B", fontSize: 18 },
  main: { flex: 1, marginLeft: 12 },
  name: { fontSize: 13, fontWeight: "700" },
  weight: { fontSize: 11, marginTop: 4 },
  macros: { alignItems: "flex-end" },
  macro: { fontSize: 10, marginTop: 3 },
});
