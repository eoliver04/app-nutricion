import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AppColors } from "@/constants/theme";
import { detectedFoods } from "@/features/nutrition/data";

export function FoodResultsCard({ colors }: { colors: AppColors }) {
  return (
    <View>
      <View style={styles.heading}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Último análisis
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Almuerzo · hace 12 min
          </Text>
        </View>
        <Pressable onPress={() => router.push("/explore")}>
          <Text style={styles.detail}>Ver detalle</Text>
        </Pressable>
      </View>
      <View
        style={[styles.card, { backgroundColor: colors.backgroundElement }]}
      >
        {detectedFoods.slice(0, 3).map((food, index) => (
          <View
            key={food.name}
            style={[styles.row, index < 2 && styles.divider]}
          >
            <View style={styles.icon}>
              <Text style={styles.iconText}>◈</Text>
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.text }]}>
                {food.name}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {food.weight} · {food.kcal} kcal
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>
              ›
            </Text>
          </View>
        ))}
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
  detail: { color: "#1A9B6B", fontSize: 12, fontWeight: "800" },
  card: { borderRadius: 20, paddingHorizontal: 16 },
  row: { minHeight: 70, flexDirection: "row", alignItems: "center" },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120, 140, 130, 0.15)",
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#D7F4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#1A9B6B", fontSize: 18 },
  copy: { flex: 1, marginLeft: 12 },
  name: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 11, marginTop: 4 },
  chevron: { fontSize: 22 },
});
