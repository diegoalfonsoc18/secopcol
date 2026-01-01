// src/components/ErrorBoundary.tsx
// Captura errores y muestra una pantalla amigable en lugar de crashear

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Aquí podrías enviar el error a un servicio como Sentry
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Icono de error */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color="#FF9500" />
            </View>

            {/* Título */}
            <Text style={styles.title}>¡Ups! Algo salió mal</Text>

            {/* Mensaje */}
            <Text style={styles.message}>
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </Text>

            {/* Botón reintentar */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>

            {/* Detalles del error (solo en desarrollo) */}
            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Detalles del error:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================
// PANTALLA DE ERROR COMPLETA (para errores fatales)
// ============================================
interface ErrorScreenProps {
  error?: Error;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  onRetry,
  onGoHome,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#FF3B30" />
        </View>

        <Text style={styles.title}>Error de conexión</Text>

        <Text style={styles.message}>
          No pudimos cargar la información. Verifica tu conexión a internet e
          intenta de nuevo.
        </Text>

        <View style={styles.buttonGroup}>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.8}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          )}

          {onGoHome && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onGoHome}
              activeOpacity={0.8}>
              <Ionicons name="home-outline" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Ir al inicio</Text>
            </TouchableOpacity>
          )}
        </View>

        {__DEV__ && error && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error técnico:</Text>
            <Text style={styles.errorText}>{error.message}</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// ============================================
// COMPONENTE DE ERROR INLINE (para secciones)
// ============================================
interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message = "Error al cargar",
  onRetry,
}) => {
  return (
    <View style={styles.inlineContainer}>
      <Ionicons name="alert-circle-outline" size={24} color="#FF3B30" />
      <Text style={styles.inlineMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.inlineRetry}>
          <Text style={styles.inlineRetryText}>Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonGroup: {
    gap: 12,
    width: "100%",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorDetails: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    maxHeight: 200,
    width: "100%",
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF3B30",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#8E8E93",
    fontFamily: "monospace",
  },
  errorStack: {
    fontSize: 10,
    color: "#AEAEB2",
    fontFamily: "monospace",
    marginTop: 8,
  },

  // Inline Error
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  inlineMessage: {
    fontSize: 14,
    color: "#FF3B30",
  },
  inlineRetry: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineRetryText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
});

export default ErrorBoundary;
