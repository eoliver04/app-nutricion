import { StyleSheet, Text, View } from "react-native";

import type { AppColors } from "@/constants/theme";
import { dailyMacros } from "@/features/nutrition/data";

export function DailySummaryCard({ colors }: { colors: AppColors }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
        RESUMEN DE HOY
      </Text>
      <Text style={[styles.calories, { color: colors.text }]}>
        1,134 <Text style={styles.target}>/ 2,000 kcal</Text>
      </Text>
      <View style={styles.track}>
        <View style={styles.progress} />
      </View>
      <View style={styles.captionRow}>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          866 kcal restantes
        </Text>
        <Text style={styles.captionGreen}>57% del objetivo</Text>
      </View>
      <View style={styles.macroRow}>
        {dailyMacros.map((macro) => (
          <View key={macro.label} style={styles.macro}>
            <View style={styles.macroTitle}>
              <View style={[styles.dot, { backgroundColor: macro.color }]} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {macro.label}
              </Text>
            </View>
            <Text style={[styles.value, { color: colors.text }]}>
              {macro.value}
            </Text>
            <View style={styles.macroTrack}>
              <View
                style={[
                  styles.macroProgress,
                  {
                    width: `${macro.progress * 100}%`,
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
    shadowColor: "#103C2D",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  calories: { fontSize: 28, fontWeight: "800", marginTop: 6 },
  target: { fontSize: 14, fontWeight: "500", color: "#87928D" },
  track: {
    height: 9,
    backgroundColor: "#D6E5DE",
    borderRadius: 5,
    marginTop: 18,
    overflow: "hidden",
  },
  progress: {
    width: "57%",
    height: "100%",
    backgroundColor: "#35C98F",
    borderRadius: 5,
  },
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  caption: { fontSize: 11, fontWeight: "600" },
  captionGreen: { color: "#1A9B6B", fontSize: 11, fontWeight: "600" },
  macroRow: { flexDirection: "row", gap: 12, marginTop: 22 },
  macro: { flex: 1 },
  macroTitle: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10 },
  value: { fontSize: 16, fontWeight: "800", marginTop: 5 },
  macroTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D6E5DE",
    marginTop: 7,
    overflow: "hidden",
  },
  macroProgress: { height: "100%", borderRadius: 2 },
});
