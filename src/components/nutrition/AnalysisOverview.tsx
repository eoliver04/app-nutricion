import { Image, StyleSheet, Text, View } from "react-native";

import type { AppColors } from "@/constants/theme";
import type { NutritionAnalysis } from "@/features/nutrition/types";

export function AnalysisOverview({
  colors,
  imageUri,
  analysis,
}: {
  colors: AppColors;
  imageUri?: string;
  analysis?: NutritionAnalysis;
}) {
  const calories = Math.round(analysis?.totals.calories ?? 0);
  const foodCount = analysis?.foods.length ?? 0;
  const targetCalories = 2000;
  const percent = targetCalories > 0 ? Math.min(100, Math.round((calories / targetCalories) * 100)) : 0;
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : null}
      <View style={styles.topline}>
        <Text style={styles.badge}>✦ ANALIZADO POR IA</Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {time}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {foodCount > 0 ? "Comida analizada" : "Sin alimentos"}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {foodCount} {foodCount === 1 ? "alimento detectado" : "alimentos detectados"} · confianza alta
      </Text>
      <View style={styles.calorieLine}>
        <Text style={[styles.calories, { color: colors.text }]}>
          {calories}
        </Text>
        <Text style={[styles.unit, { color: colors.textSecondary }]}>
          kcal estimadas
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.caption}>{percent}% de tu objetivo diario ({targetCalories} kcal)</Text>
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
    color: "#1A9B6B",
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
    backgroundColor: "#D6E5DE",
    overflow: "hidden",
    marginTop: 8,
  },
  progress: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#35C98F",
  },
  caption: { color: "#1A9B6B", fontSize: 11, fontWeight: "700", marginTop: 8 },
});
