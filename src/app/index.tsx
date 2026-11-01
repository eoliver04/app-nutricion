import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DailySummaryCard } from "@/components/nutrition/DailySummaryCard";
import { DashboardHeader } from "@/components/nutrition/DashboardHeader";
import { FoodResultsCard } from "@/components/nutrition/FoodResultsCard";
import { ScanActions } from "@/components/nutrition/ScanActions";
import { BottomTabInset, Colors, MaxContentWidth } from "@/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + BottomTabInset + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { maxWidth: MaxContentWidth }]}>
        <DashboardHeader colors={colors} />
        <DailySummaryCard colors={colors} />
        <ScanActions />
        <FoodResultsCard colors={colors} />
        <Text
          style={[styles.footerAction, { color: colors.textSecondary }]}
          onPress={() => router.push("/profile")}
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
