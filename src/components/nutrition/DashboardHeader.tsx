import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AppColors } from "@/constants/theme";

export function DashboardHeader({ colors }: { colors: AppColors }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
          LUNES, 14 OCTUBRE
        </Text>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Buenos días, Elena
        </Text>
      </View>
      <Pressable
        onPress={() => router.push("/profile")}
        style={styles.avatar}
        accessibilityLabel="Abrir perfil"
      >
        <Text style={styles.avatarText}>ER</Text>
        <View style={styles.onlineDot} />
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
  },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  greeting: { fontSize: 25, fontWeight: "800", marginTop: 6 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D7F4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#137951", fontSize: 14, fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#35C98F",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
