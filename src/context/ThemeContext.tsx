import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// TIPOS
// ============================================
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
}

// ============================================
// COLORES
// ============================================
export const lightColors = {
  // Backgrounds
  background: "#F2F2F7",
  backgroundSecondary: "#FFFFFF",
  backgroundTertiary: "#E5E5EA",

  // Text
  textPrimary: "#000000",
  textSecondary: "#6B6B6B",
  textTertiary: "#8E8E93",

  // Accent
  accent: "#0037ff",
  accentLight: "rgba(0, 122, 255, 0.12)",

  // Status
  success: "#34C759",
  successLight: "rgba(52, 199, 89, 0.12)",
  warning: "#FF9500",
  warningLight: "rgba(255, 149, 0, 0.12)",
  danger: "#FF3B30",
  dangerLight: "rgba(255, 59, 48, 0.12)",

  // Separators
  separator: "#C6C6C8",
  separatorLight: "#E5E5EA",

  // Tab Bar
  tabBarBackground: "rgba(255, 255, 255, 0.94)",
  tabBarBorder: "rgba(0, 0, 0, 0.1)",
};

export const darkColors = {
  // Backgrounds
  background: "#000000",
  backgroundSecondary: "#1C1C1E",
  backgroundTertiary: "#2C2C2E",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1A6",
  textTertiary: "#636366",

  // Accent
  accent: "#e1ff00",
  accentLight: "rgba(10, 132, 255, 0.2)",

  // Status
  success: "#30D158",
  successLight: "rgba(48, 209, 88, 0.2)",
  warning: "#FF9F0A",
  warningLight: "rgba(255, 159, 10, 0.2)",
  danger: "#FF453A",
  dangerLight: "rgba(255, 69, 58, 0.2)",

  // Separators
  separator: "#38383A",
  separatorLight: "#2C2C2E",

  // Tab Bar
  tabBarBackground: "rgba(28, 28, 30, 0.94)",
  tabBarBorder: "rgba(255, 255, 255, 0.1)",
};

// ============================================
// CONTEXT
// ============================================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "secop-theme-mode";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar preferencia guardada
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setModeState(saved as ThemeMode);
      }
      setIsLoaded(true);
    });
  }, []);

  // Determinar si es modo oscuro
  const isDark =
    mode === "system" ? systemColorScheme === "dark" : mode === "dark";

  // Colores actuales
  const colors = isDark ? darkColors : lightColors;

  // Cambiar modo
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export default ThemeContext;
