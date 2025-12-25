import React from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import {
  HomeScreen,
  SearchScreen,
  FavoritesScreen,
  DetailScreen,
} from "./src/screens/index";

// Tema centralizado
const colors = {
  background: "#F2F2F7",
  backgroundSecondary: "#FFFFFF",
  tabBarBackground: "rgba(255, 255, 255, 0.94)",
  accent: "#007AFF",
  textSecondary: "#8E8E93",
  separator: "#C6C6C8",
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigators para cada tab
function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="HomeTab" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

function SearchStackNavigator() {
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

// Tab Navigator con estilo Apple
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0.5,
          borderTopColor: colors.separator,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          height: Platform.OS === "ios" ? 88 : 70,
          // Efecto blur en iOS
          ...Platform.select({
            ios: {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
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
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
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
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesStackNavigator}
        options={{
          tabBarLabel: "Favoritos",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer
        theme={{
          dark: false,
          colors: {
            primary: colors.accent,
            background: colors.background,
            card: colors.backgroundSecondary,
            text: "#1C1C1E",
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
        <TabNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
