// Componentes de animación de entrada
import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleProp } from "react-native";

interface AnimatedEntryProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

// Fade In animation
export const FadeIn: React.FC<AnimatedEntryProps> = ({
  children,
  delay = 0,
  duration = 300,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, delay, duration]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

// Slide In from bottom
export const SlideInUp: React.FC<AnimatedEntryProps> = ({
  children,
  delay = 0,
  duration = 400,
  style,
}) => {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, delay, duration]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
};

// Slide In from right
export const SlideInRight: React.FC<AnimatedEntryProps> = ({
  children,
  delay = 0,
  duration = 400,
  style,
}) => {
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, opacity, delay, duration]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }], opacity }]}>
      {children}
    </Animated.View>
  );
};

// Scale In (pop effect)
export const ScaleIn: React.FC<AnimatedEntryProps> = ({
  children,
  delay = 0,
  duration = 300,
  style,
}) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity, delay, duration]);

  return (
    <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
      {children}
    </Animated.View>
  );
};

// Staggered list animation helper
interface StaggeredItemProps extends AnimatedEntryProps {
  index: number;
  staggerDelay?: number;
}

export const StaggeredItem: React.FC<StaggeredItemProps> = ({
  children,
  index,
  staggerDelay = 50,
  duration = 400,
  style,
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * staggerDelay;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, index, staggerDelay, duration]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
};

// Pulse animation for attention
export const Pulse: React.FC<AnimatedEntryProps & { loop?: boolean }> = ({
  children,
  duration = 1000,
  loop = true,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]);

    if (loop) {
      Animated.loop(animation).start();
    } else {
      animation.start();
    }

    return () => {
      scale.setValue(1);
    };
  }, [scale, duration, loop]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

export default {
  FadeIn,
  SlideInUp,
  SlideInRight,
  ScaleIn,
  StaggeredItem,
  Pulse,
};
