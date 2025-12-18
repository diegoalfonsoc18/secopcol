import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ProcessStatus } from "../types/index";

interface StatusBadgeProps {
  status: ProcessStatus | string;
  size?: "small" | "medium" | "large";
}

const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || "";

  if (statusLower.includes("publicado")) return "#3B82F6"; // Blue
  if (statusLower.includes("adjudicado")) return "#10B981"; // Green
  if (statusLower.includes("cerrado")) return "#6B7280"; // Gray
  if (statusLower.includes("evaluación") || statusLower.includes("evaluacion"))
    return "#F59E0B"; // Amber
  if (statusLower.includes("cancelado")) return "#EF4444"; // Red
  if (statusLower.includes("suspendido")) return "#EC4899"; // Pink
  if (statusLower.includes("desierto")) return "#8B5CF6"; // Purple

  return "#6B7280"; // Default gray
};

const getStatusIcon = (status: string): string => {
  const statusLower = status?.toLowerCase() || "";

  if (statusLower.includes("publicado")) return "📢";
  if (statusLower.includes("adjudicado")) return "✓";
  if (statusLower.includes("cerrado")) return "🔒";
  if (statusLower.includes("evaluación") || statusLower.includes("evaluacion"))
    return "⏳";
  if (statusLower.includes("cancelado")) return "✕";
  if (statusLower.includes("suspendido")) return "⏸";
  if (statusLower.includes("desierto")) return "📭";

  return "•";
};

const getSizeStyles = (size: "small" | "medium" | "large") => {
  switch (size) {
    case "small":
      return {
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 11,
      };
    case "large":
      return {
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
      };
    case "medium":
    default:
      return {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 13,
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "medium",
}) => {
  const backgroundColor = getStatusColor(status);
  const icon = getStatusIcon(status);
  const sizeStyle = getSizeStyles(size);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        {
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
      ]}>
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeStyle.fontSize,
          },
        ]}>
        {icon} {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
