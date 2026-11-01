import { StyleSheet, Text, View } from "react-native";

import { percentOf } from "@/features/nutrition/summary";
import type { NutritionTotals } from "@/features/nutrition/types";
import type { UserSettings } from "@/features/profile/settings";
import { useAppColors } from "@/hooks/use-app-colors";

export function DailySummaryCard({
  totals,
  settings,
  mealsCount,
}: {
  totals: NutritionTotals;
  settings: UserSettings;
  mealsCount: number;
}) {
  const colors = useAppColors();
  const percent = percentOf(totals.calories, settings.dailyCalorieGoal);
  const remaining = Math.max(0, settings.dailyCalorieGoal - totals.calories);

  const macros = [
    {
      label: "Proteínas",
      value: totals.protein,
      goal: settings.proteinGoal,
      color: colors.protein,
    },
    {
      label: "Carbos",
      value: totals.carbohydrates,
      goal: settings.carbsGoal,
      color: colors.carbs,
    },
    {
      label: "Grasas",
      value: totals.fat,
      goal: settings.fatGoal,
      color: colors.fat,
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
        RESUMEN DE HOY
      </Text>
      <Text style={[styles.calories, { color: colors.text }]}>
        {Math.round(totals.calories)}{" "}
        <Text style={[styles.target, { color: colors.textSecondary }]}>
          / {settings.dailyCalorieGoal} kcal
        </Text>
      </Text>
      <View
        style={[styles.track, { backgroundColor: colors.track }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View
          style={[
            styles.progress,
            { width: `${percent}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
      <View style={styles.captionRow}>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          {mealsCount === 0
            ? "Aún no has registrado comidas hoy"
            : `${Math.round(remaining)} kcal restantes · ${mealsCount} ${mealsCount === 1 ? "comida" : "comidas"}`}
        </Text>
        <Text style={[styles.captionGreen, { color: colors.primary }]}>
          {percent}% del objetivo
        </Text>
      </View>
      <View style={styles.macroRow}>
        {macros.map((macro) => (
          <View key={macro.label} style={styles.macro}>
            <View style={styles.macroTitle}>
              <View style={[styles.dot, { backgroundColor: macro.color }]} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {macro.label}
              </Text>
            </View>
            <Text style={[styles.value, { color: colors.text }]}>
              {Math.round(macro.value)}g
              <Text style={[styles.goal, { color: colors.textSecondary }]}>
                {" "}
                / {macro.goal}g
              </Text>
            </Text>
            <View style={[styles.macroTrack, { backgroundColor: colors.track }]}>
              <View
                style={[
                  styles.macroProgress,
                  {
                    width: `${percentOf(macro.value, macro.goal)}%`,
                    backgroundColor: macro.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  calories: { fontSize: 28, fontWeight: "800", marginTop: 6 },
  target: { fontSize: 14, fontWeight: "500" },
  track: {
    height: 9,
    borderRadius: 5,
    marginTop: 18,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 5,
  },
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  caption: { fontSize: 11, fontWeight: "600", flexShrink: 1 },
  captionGreen: { fontSize: 11, fontWeight: "600" },
  macroRow: { flexDirection: "row", gap: 12, marginTop: 22 },
  macro: { flex: 1 },
  macroTitle: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10 },
  value: { fontSize: 16, fontWeight: "800", marginTop: 5 },
  goal: { fontSize: 10, fontWeight: "500" },
  macroTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    overflow: "hidden",
  },
  macroProgress: { height: "100%", borderRadius: 2 },
});
