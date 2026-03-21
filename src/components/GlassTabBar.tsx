// GlassTabBar: Tab bar personalizado con burbuja glass animada
// La burbuja se desplaza suavemente entre los iconos al cambiar de tab

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { GlassWrapper } from "./GlassWrapper";

export const GlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const numTabs = state.routes.length;

  // Almacenar dimensiones de cada tab
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? containerWidth / numTabs : 0;

  const bubbleX = useRef(new Animated.Value(0)).current;
  const bubbleScaleX = useRef(new Animated.Value(1)).current;
  const bubbleScaleY = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);
  const prevIndex = useRef(state.index);

  // Animar la burbuja cuando cambia el tab activo o cuando se mide el container
  useEffect(() => {
    if (tabWidth <= 0) return;

    const targetX = state.index * tabWidth;

    if (isFirstRender.current) {
      // Primera vez: posicionar sin animacion
      bubbleX.setValue(targetX);
      isFirstRender.current = false;
    } else {
      const distance = Math.abs(state.index - prevIndex.current);
      // Efecto líquido sutil
      const stretchX = 1 + distance * 0.08;
      const squishY = 1 - distance * 0.04;

      Animated.parallel([
        // Mover con spring suave
        Animated.spring(bubbleX, {
          toValue: targetX,
          useNativeDriver: false,
          friction: 7,
          tension: 80,
        }),
        // Estiramiento sutil al moverse y vuelta a normal
        Animated.sequence([
          Animated.timing(bubbleScaleX, {
            toValue: stretchX,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1,
            useNativeDriver: false,
            friction: 5,
            tension: 120,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bubbleScaleY, {
            toValue: squishY,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1,
            useNativeDriver: false,
            friction: 5,
            tension: 120,
          }),
        ]),
      ]).start();
    }
    prevIndex.current = state.index;
  }, [state.index, tabWidth]);

  const handleContainerLayout = useCallback((e: any) => {
    const { width } = e.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom > 0 ? insets.bottom : 12,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 15,
            },
          }),
        },
      ]}
      onLayout={handleContainerLayout}
    >
      {/* Fondo glass del tab bar completo */}
      <GlassWrapper
        variant="header"
        style={[StyleSheet.absoluteFill, styles.glassBackground]}
        fallbackColor={colors.tabBarBackground}
      />

      {/* Burbuja animada con efecto líquido */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              left: bubbleX,
              width: tabWidth,
              transform: [
                { scaleX: bubbleScaleX },
                { scaleY: bubbleScaleY },
              ],
            },
          ]}
        >
          <GlassWrapper
            variant="badge"
            style={styles.bubble}
          />
        </Animated.View>
      )}

      {/* Tabs */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const color = isFocused
          ? (isDark ? "#FFFFFF" : "#000000")
          : (isDark ? "#FFFFFF" : "#3A3A3C");

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            {/* Badge */}
            {options.tabBarBadge !== undefined && (
              <View
                style={[
                  styles.badge,
                  options.tabBarBadgeStyle as any,
                ]}
              >
                <Text style={styles.badgeText}>
                  {options.tabBarBadge}
                </Text>
              </View>
            )}

            {/* Icon */}
            {options.tabBarIcon?.({
              focused: isFocused,
              color,
              size: 24,
            })}

            {/* Label */}
            <Text
              style={[
                styles.label,
                { color },
              ]}
              numberOfLines={1}
            >
              {typeof label === "string" ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    position: "absolute",
    marginHorizontal: 16,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
  },
  glassBackground: {
    borderRadius: 28,
    overflow: "hidden",
  },
  bubbleContainer: {
    position: "absolute",
    top: 4,
    bottom: 4,
    zIndex: 0,
    paddingHorizontal: 0,
  },
  bubble: {
    flex: 1,
    borderRadius: 22,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingVertical: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 12,
    zIndex: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
