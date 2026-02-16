import React, { useEffect } from "react";
import { StyleSheet, Platform, ActivityIndicator, View } from "react-native";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";

// Background task: debe importarse a nivel modulo para que
// TaskManager.defineTask() se ejecute antes del render
import "./src/services/alertBackgroundService";
import {
  HomeIcon,
  SearchIcon,
  FavoritesIcon,
  AlertIcon,
} from "./src/assets/icons";
import {
  HomeScreen,
  SearchScreen,
  FavoritesScreen,
  DetailScreen,
  AppSettingsScreen,
  LoginScreen,
  OnboardingScreen,
  AlertsScreen,
} from "./src/screens/index";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { useProcessesStore } from "./src/store/processesStore";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { supabase } from "./src/services/supabase";
import { useNotificationSetup } from "./src/hooks/useNotificationSetup";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================
// STACK NAVIGATORS
// ============================================
function HomeStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="HomeTab" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen
        name="AppSettings"
        component={AppSettingsScreen}
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack.Navigator>
  );
}

function SearchStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="SearchTab" component={SearchScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="FavoritesTab" component={FavoritesScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

function AlertsStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="AlertsTab" component={AlertsScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// TAB NAVIGATOR
// ============================================
function TabNavigator() {
  const { colors } = useTheme();
  const { favorites } = useProcessesStore();
  const favoritesCount = favorites.length;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : insets.bottom + 12,
          height: Platform.OS === "ios" ? 88 : 70 + insets.bottom,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 15,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
      initialRouteName="Home">
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ focused, color }) => (
            <HomeIcon
              size={22}
              filled={focused} // 🔥 cambia automáticamente
              color={colors.textSecondary} // outline
              activeColor={colors.accent} // solid
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: "Buscar",
          tabBarIcon: ({ focused, color }) => (
            <SearchIcon
              size={25}
              filled={focused} // 🔥 cambia automáticamente
              color={colors.textSecondary} // outline
              activeColor={colors.accent} // solid
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStackNavigator}
        options={{
          tabBarLabel: "Favoritos",
          tabBarBadge: favoritesCount > 0 ? favoritesCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            fontSize: 10,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
          tabBarIcon: ({ focused, color }) => (
            <FavoritesIcon
              size={24}
              filled={focused} // 🔥 cambia automáticamente
              color={colors.textSecondary} // outline
              activeColor={colors.accent} // solid
            />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsStackNavigator}
        options={{
          tabBarLabel: "Alertas",
          tabBarIcon: ({ focused, color }) => (
            <AlertIcon
              size={23}
              filled={focused} // 🔥 cambia automáticamente
              color={colors.textSecondary} // outline
              activeColor={colors.accent} // solid
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// AUTH NAVIGATOR
// ============================================
function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// ONBOARDING NAVIGATOR
// ============================================
function OnboardingNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// ROOT NAVIGATOR
// ============================================
function RootNavigator() {
  const { isAuthenticated, isLoading, preferences } = useAuth();
  const { colors } = useTheme();

  // Inicializar notificaciones cuando el usuario esta autenticado
  useNotificationSetup();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!preferences.onboardingCompleted) {
    return <OnboardingNavigator />;
  }

  return <TabNavigator />;
}

// ============================================
// APP CONTENT (con manejo de deep links)
// ============================================
const navigationRef = React.createRef<NavigationContainerRef<any>>();

function AppContent() {
  const { colors, isDark } = useTheme();

  // Manejar tap en notificacion: navegar al tab Alertas
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.type === "alert_match" && navigationRef.current) {
          navigationRef.current.navigate("Alerts");
        }
      }
    );
    return () => subscription.remove();
  }, []);

  // Manejar deep links de Supabase
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log("Deep link received:", url);

      if (
        url.includes("access_token") ||
        url.includes("refresh_token") ||
        url.includes("token_hash")
      ) {
        try {
          const hashPart = url.split("#")[1];
          if (!hashPart) return;

          const params = new URLSearchParams(hashPart);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          console.log("Tokens found:", !!accessToken, !!refreshToken);

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session:", error);
            } else {
              console.log("Session set successfully:", !!data.session);
            }
          }
        } catch (error) {
          console.error("Error handling deep link:", error);
        }
      }
    };

    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.backgroundSecondary,
          text: colors.textPrimary,
          border: colors.separator,
          notification: colors.accent,
        },
        fonts: {
          regular: {
            fontFamily: "System",
            fontWeight: "400" as const,
          },
          medium: {
            fontFamily: "System",
            fontWeight: "500" as const,
          },
          bold: {
            fontFamily: "System",
            fontWeight: "700" as const,
          },
          heavy: {
            fontFamily: "System",
            fontWeight: "800" as const,
          },
        },
      }}>
      <RootNavigator />
    </NavigationContainer>
  );
}

// ============================================
// APP PRINCIPAL
// ============================================
export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <BottomSheetModalProvider>
                <AppContent />
              </BottomSheetModalProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
