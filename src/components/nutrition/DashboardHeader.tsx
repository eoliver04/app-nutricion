import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDayLabel, greetingForHour } from "@/features/nutrition/summary";
import { useAppColors } from "@/hooks/use-app-colors";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardHeader({
  name,
  now = new Date(),
}: {
  name: string;
  now?: Date;
}) {
  const colors = useAppColors();
  const greeting = greetingForHour(now.getHours());

  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
          {formatDayLabel(now)}
        </Text>
        <Text
          style={[styles.greeting, { color: colors.text }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {name ? `${greeting}, ${name}` : greeting}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push("/profile")}
        style={[styles.avatar, { backgroundColor: colors.primarySoft }]}
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
      >
        <Text style={[styles.avatarText, { color: colors.onPrimarySoft }]}>
          {initialsOf(name)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  copy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  greeting: { fontSize: 25, fontWeight: "800", marginTop: 6 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
});
