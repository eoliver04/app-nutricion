import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DailySummaryCard } from "@/components/nutrition/DailySummaryCard";
import { DashboardHeader } from "@/components/nutrition/DashboardHeader";
import { HistoryList } from "@/components/nutrition/HistoryList";
import { ScanActions } from "@/components/nutrition/ScanActions";
import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { analysesForDay, sumTotals } from "@/features/nutrition/summary";
import { useSavedAnalyses } from "@/features/nutrition/use-saved-analyses";
import { useUserSettings } from "@/features/profile/use-user-settings";
import { useAppColors } from "@/hooks/use-app-colors";

export default function HomeScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { analyses } = useSavedAnalyses();
  const { settings } = useUserSettings();

  const today = useMemo(() => analysesForDay(analyses), [analyses]);
  const todayTotals = useMemo(() => sumTotals(today), [today]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + BottomTabInset + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
        <DashboardHeader name={settings.name} />
        <DailySummaryCard
          totals={todayTotals}
          settings={settings}
          mealsCount={today.length}
        />
        <ScanActions />
        <HistoryList analyses={analyses} />
        <Text
          style={[styles.footerAction, { color: colors.textSecondary }]}
          onPress={() => router.push("/profile")}
          accessibilityRole="link"
        >
          Ajusta tus objetivos desde tu perfil
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { width: "100%", alignSelf: "center", paddingHorizontal: 20 },
  footerAction: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 24,
    paddingBottom: 8,
  },
});
