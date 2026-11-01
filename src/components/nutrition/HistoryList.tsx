import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatRelativeTime,
  mealLabelForHour,
} from "@/features/nutrition/summary";
import type { SavedAnalysis } from "@/features/nutrition/types";
import { useAppColors } from "@/hooks/use-app-colors";

export function HistoryList({
  analyses,
  limit = 5,
}: {
  analyses: SavedAnalysis[];
  limit?: number;
}) {
  const colors = useAppColors();
  const items = analyses.slice(0, limit);

  return (
    <View>
      <View style={styles.heading}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Historial
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {analyses.length === 0
              ? "Tus análisis aparecerán aquí"
              : `${analyses.length} ${analyses.length === 1 ? "análisis guardado" : "análisis guardados"}`}
          </Text>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Haz una foto de tu primer plato para empezar a registrar lo que
              comes.
            </Text>
          </View>
        ) : (
          items.map((item, index) => {
            const date = new Date(item.createdAt);
            const foodNames = item.analysis.foods
              .map((food) => food.name)
              .slice(0, 3)
              .join(", ");
            return (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/analysis",
                    params: { id: item.id, requestId: String(Date.now()) },
                  })
                }
                style={[
                  styles.row,
                  index < items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${mealLabelForHour(date.getHours())}, ${formatRelativeTime(date)}, ${Math.round(item.analysis.totals.calories)} kilocalorías`}
              >
                <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.iconText, { color: colors.primary }]}>
                    ◈
                  </Text>
                </View>
                <View style={styles.copy}>
                  <Text
                    style={[styles.name, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {foodNames || "Sin alimentos detectados"}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {mealLabelForHour(date.getHours())} ·{" "}
                    {formatRelativeTime(date)}
                  </Text>
                </View>
                <Text style={[styles.kcal, { color: colors.text }]}>
                  {Math.round(item.analysis.totals.calories)} kcal
                </Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                  ›
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { fontSize: 19, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 4 },
  card: { borderRadius: 20, paddingHorizontal: 16 },
  empty: { paddingVertical: 22 },
  emptyText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 18 },
  copy: { flex: 1 },
  name: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 11, marginTop: 4 },
  kcal: { fontSize: 12, fontWeight: "700" },
  chevron: { fontSize: 22 },
});
