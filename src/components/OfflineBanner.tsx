// Componente de Banner Offline
// Muestra estado de conexión y última sincronización

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { spacing, borderRadius } from "../theme";

interface OfflineBannerProps {
  isOffline: boolean;
  lastSync?: string;
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  lastSync,
  onRetry,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const styles = createStyles(colors);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -60,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        <Ionicons
          name="cloud-offline-outline"
          size={18}
          color={colors.warning}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Sin conexión</Text>
          {lastSync && (
            <Text style={styles.subtitle}>Última sync: {lastSync}</Text>
          )}
        </View>
      </View>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color={colors.accent} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ============================================
// MINI BADGE (para header)
// ============================================
interface OfflineBadgeProps {
  isOffline: boolean;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ isOffline }) => {
  const { colors } = useTheme();

  if (!isOffline) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.warningLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
      }}>
      <Ionicons name="cloud-offline" size={12} color={colors.warning} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors.warning,
        }}>
        Offline
      </Text>
    </View>
  );
};

// ============================================
// SYNC STATUS (para settings)
// ============================================
interface SyncStatusProps {
  isOnline: boolean;
  lastSync: string;
  cacheSize?: string;
  processCount?: number;
  onClearCache?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isOnline,
  lastSync,
  cacheSize,
  processCount,
  onClearCache,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.syncContainer}>
      {/* Estado de conexión */}
      <View style={styles.syncRow}>
        <View style={styles.syncIconContainer}>
          <Ionicons
            name={isOnline ? "cloud-done" : "cloud-offline"}
            size={20}
            color={isOnline ? colors.success : colors.warning}
          />
        </View>
        <View style={styles.syncInfo}>
          <Text style={styles.syncLabel}>Estado</Text>
          <Text
            style={[
              styles.syncValue,
              { color: isOnline ? colors.success : colors.warning },
            ]}>
            {isOnline ? "Conectado" : "Sin conexión"}
          </Text>
        </View>
      </View>

      {/* Última sincronización */}
      <View style={styles.syncRow}>
        <View style={styles.syncIconContainer}>
          <Ionicons name="sync" size={20} color={colors.textSecondary} />
        </View>
        <View style={styles.syncInfo}>
          <Text style={styles.syncLabel}>Última sincronización</Text>
          <Text style={styles.syncValue}>{lastSync}</Text>
        </View>
      </View>

      {/* Cache info */}
      {(cacheSize || processCount !== undefined) && (
        <View style={[styles.syncRow, { borderBottomWidth: 0 }]}>
          <View style={styles.syncIconContainer}>
            <Ionicons name="archive" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.syncInfo}>
            <Text style={styles.syncLabel}>Datos en cache</Text>
            <Text style={styles.syncValue}>
              {processCount !== undefined && `${processCount} procesos`}
              {cacheSize && processCount !== undefined && " • "}
              {cacheSize && cacheSize}
            </Text>
          </View>
          {onClearCache && (
            <TouchableOpacity onPress={onClearCache} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.warningLight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.warning,
      zIndex: 1000,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    textContainer: {
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.warning,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    retryButton: {
      padding: spacing.sm,
    },

    // Sync Status
    syncContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      overflow: "hidden",
    },
    syncRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    syncIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    syncInfo: {
      flex: 1,
    },
    syncLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    syncValue: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textPrimary,
      marginTop: 2,
    },
    clearButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    clearButtonText: {
      fontSize: 14,
      color: colors.danger,
      fontWeight: "500",
    },
  });

export default OfflineBanner;
