import React from "react";
import { StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  HomeScreen,
  SearchScreen,
  FavoritesScreen,
  DetailScreen,
} from "./src/screens/index";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTab" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchTab" component={SearchScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoritesTab" component={FavoritesScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -4,
          marginBottom: 4,
        },
      }}
      initialRouteName="Home">
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: "Buscar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? "🔍" : "🔎"}</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? "🏠" : "🏡"}</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesStackNavigator}
        options={{
          tabBarLabel: "Favoritos",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? "⭐" : "☆"}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
