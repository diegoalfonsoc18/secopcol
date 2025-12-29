// Componente Pressable con animación de bounce y haptic feedback
import React, { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useHaptics } from "../hooks/useHaptics";

interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  hapticType?: "light" | "medium" | "heavy" | "selection" | "none";
  children: React.ReactNode;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  style,
  scaleValue = 0.97,
  hapticType = "light",
  onPressIn,
  onPressOut,
  onPress,
  children,
  disabled,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const haptics = useHaptics();

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: scaleValue,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
      onPressIn?.(e);
    },
    [scale, scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (hapticType !== "none") {
        haptics.trigger(hapticType);
      }
      onPress?.(e);
    },
    [hapticType, haptics, onPress]
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      {...props}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedPressable;
