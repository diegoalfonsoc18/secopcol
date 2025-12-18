export const formatCurrency = (
  value: number,
  currency: string = "COP"
): string => {
  if (!value) return "N/A";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (
  dateString: string,
  format: "short" | "long" = "short"
): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  if (format === "short") {
    return date.toLocaleDateString("es-CO");
  } else {
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

export const getRemainingDays = (fechaCierre: string): string => {
  if (!fechaCierre) return "N/A";

  const closing = new Date(fechaCierre);
  const today = new Date();
  const diff = closing.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));

  if (days < 0) return "Vencido";
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `${days} días restantes`;
};

export const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || "";

  if (statusLower.includes("publicado")) return "#3B82F6";
  if (statusLower.includes("adjudicado")) return "#10B981";
  if (statusLower.includes("cerrado")) return "#6B7280";
  if (statusLower.includes("evaluación") || statusLower.includes("evaluacion"))
    return "#F59E0B";
  if (statusLower.includes("cancelado")) return "#EF4444";
  if (statusLower.includes("suspendido")) return "#EC4899";
  if (statusLower.includes("desierto")) return "#8B5CF6";

  return "#6B7280";
};

export const truncateText = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
