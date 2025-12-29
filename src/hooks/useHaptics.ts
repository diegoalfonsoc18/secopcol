// Hook para Haptic Feedback y animaciones
import { useCallback } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection";

export const useHaptics = () => {
  const trigger = useCallback(async (type: HapticType = "light") => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;

    try {
      switch (type) {
        case "light":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "success":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;
        case "warning":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          break;
        case "error":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          break;
        case "selection":
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      // Silenciar errores en simulador o dispositivos sin haptics
    }
  }, []);

  return {
    trigger,
    light: () => trigger("light"),
    medium: () => trigger("medium"),
    heavy: () => trigger("heavy"),
    success: () => trigger("success"),
    warning: () => trigger("warning"),
    error: () => trigger("error"),
    selection: () => trigger("selection"),
  };
};

export default useHaptics;
