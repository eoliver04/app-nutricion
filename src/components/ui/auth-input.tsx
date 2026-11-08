import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useEffect, useState, type ComponentRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useAppColors } from "@/hooks/use-app-colors";

export type AuthInputProps = Omit<TextInputProps, "style"> & {
  /** Icono a la izquierda del campo. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Error del campo; al aparecer, el input hace un pequeño shake. */
  error?: string;
  /** Cambia el valor para forzar otro shake aunque el error no cambie. */
  shakeKey?: number;
  /** Muestra el botón de ojo para mostrar u ocultar la contraseña. */
  isPassword?: boolean;
};

export type AuthInputHandle = ComponentRef<typeof TextInput>;

const INPUT_HEIGHT = 52;
const SHAKE_STEP_MS = 50;

/** Campo de formulario con icono, foco resaltado, error inline y shake. */
export const AuthInput = forwardRef<AuthInputHandle, AuthInputProps>(function AuthInput(
  { icon, error, shakeKey = 0, isPassword = false, onFocus, onBlur, ...inputProps },
  ref,
) {
  const colors = useAppColors();
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(isPassword);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!error) return;
    // Tres oscilaciones de 6 px en 300 ms.
    translateX.set(
      withSequence(
        withTiming(-6, { duration: SHAKE_STEP_MS }),
        withTiming(6, { duration: SHAKE_STEP_MS }),
        withTiming(-6, { duration: SHAKE_STEP_MS }),
        withTiming(6, { duration: SHAKE_STEP_MS }),
        withTiming(-6, { duration: SHAKE_STEP_MS }),
        withTiming(0, { duration: SHAKE_STEP_MS }),
      ),
    );
  }, [error, shakeKey, translateX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const borderColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.border;
  const iconColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.field,
          { backgroundColor: colors.background, borderColor },
          shakeStyle,
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
        <TextInput
          ref={ref}
          {...inputProps}
          secureTextEntry={isPassword ? isHidden : inputProps.secureTextEntry}
          placeholderTextColor={colors.textSecondary}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, { color: colors.text }]}
          accessibilityState={{ ...inputProps.accessibilityState }}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setIsHidden((previous) => !previous)}
            hitSlop={10}
            style={styles.eye}
            accessibilityRole="button"
            accessibilityLabel={
              isHidden ? "Mostrar contraseña" : "Ocultar contraseña"
            }
          >
            <Ionicons
              name={isHidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <Text
          style={[styles.error, { color: colors.danger }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  field: {
    height: INPUT_HEIGHT,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  icon: { width: 20 },
  input: { flex: 1, fontSize: 15, fontWeight: "600", height: "100%" },
  eye: { padding: 2 },
  error: { fontSize: 12, marginTop: 6, marginLeft: 4 },
});
