import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import {
  averageConfidence,
  confidenceLabel,
  formatDateTime,
  percentOf,
} from "@/features/nutrition/summary";
import type { NutritionAnalysis } from "@/features/nutrition/types";
import { useAppColors } from "@/hooks/use-app-colors";

export function AnalysisOverview({
  imageUri,
  analysis,
  analyzedAt,
  dailyCalorieGoal,
}: {
  imageUri?: string | null;
  analysis?: NutritionAnalysis;
  analyzedAt: Date;
  dailyCalorieGoal: number;
}) {
  const colors = useAppColors();
  const calories = Math.round(analysis?.totals.calories ?? 0);
  const foodCount = analysis?.foods.length ?? 0;
  const percent = percentOf(calories, dailyCalorieGoal);
  const confidence = confidenceLabel(
    averageConfidence(analysis?.foods ?? []),
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel="Foto del plato analizado"
        />
      ) : null}
      <View style={styles.topline}>
        <Text style={[styles.badge, { color: colors.primary }]}>
          ✦ ANALIZADO POR IA
        </Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {formatDateTime(analyzedAt)}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {foodCount > 0 ? "Comida analizada" : "Sin alimentos"}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {foodCount} {foodCount === 1 ? "alimento detectado" : "alimentos detectados"}
        {confidence ? ` · ${confidence}` : ""}
      </Text>
      <View style={styles.calorieLine}>
        <Text style={[styles.calories, { color: colors.text }]}>
          {calories}
        </Text>
        <Text style={[styles.unit, { color: colors.textSecondary }]}>
          kcal estimadas
        </Text>
      </View>
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
      <Text style={[styles.caption, { color: colors.primary }]}>
        {percent}% de tu objetivo diario ({dailyCalorieGoal} kcal)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 20, marginBottom: 28 },
  image: { width: "100%", height: 170, borderRadius: 16, marginBottom: 18 },
  topline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  time: { fontSize: 11 },
  title: { fontSize: 24, fontWeight: "800", marginTop: 18 },
  subtitle: { fontSize: 12, marginTop: 5 },
  calorieLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 22,
  },
  calories: { fontSize: 42, fontWeight: "800" },
  unit: { fontSize: 13 },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  progress: {
    height: "100%",
    borderRadius: 4,
  },
  caption: { fontSize: 11, fontWeight: "700", marginTop: 8 },
});
