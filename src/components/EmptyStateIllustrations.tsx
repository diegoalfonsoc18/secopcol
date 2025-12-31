// Ilustraciones SVG para estados vacíos
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import { useTheme } from "../context/ThemeContext";

interface IllustrationProps {
  size?: number;
}

// ============================================
// EMPTY SEARCH - Sin resultados de búsqueda
// ============================================
export const EmptySearchIllustration: React.FC<IllustrationProps> = ({
  size = 160,
}) => {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.05} />
        </LinearGradient>
      </Defs>

      {/* Fondo circular */}
      <Circle cx="80" cy="80" r="70" fill="url(#searchGrad)" />

      {/* Sombra */}
      <Ellipse
        cx="80"
        cy="135"
        rx="40"
        ry="8"
        fill={colors.separator}
        opacity={0.3}
      />

      {/* Documentos apilados */}
      <G transform="translate(35, 45)">
        <Rect
          x="15"
          y="5"
          width="60"
          height="75"
          rx="6"
          fill={colors.backgroundTertiary}
        />
        <Rect
          x="5"
          y="0"
          width="60"
          height="75"
          rx="6"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="1.5"
        />
        <Rect
          x="12"
          y="12"
          width="35"
          height="4"
          rx="2"
          fill={colors.separator}
        />
        <Rect
          x="12"
          y="22"
          width="45"
          height="4"
          rx="2"
          fill={colors.separator}
        />
        <Rect
          x="12"
          y="32"
          width="30"
          height="4"
          rx="2"
          fill={colors.separator}
        />
        <Rect
          x="12"
          y="42"
          width="40"
          height="4"
          rx="2"
          fill={colors.separator}
        />
      </G>

      {/* Lupa con signo de pregunta */}
      <G transform="translate(85, 70)">
        <Circle
          cx="20"
          cy="20"
          r="18"
          fill={colors.backgroundSecondary}
          stroke={colors.accent}
          strokeWidth="4"
        />
        <Path
          d="M32 32 L48 48"
          stroke={colors.accent}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M16 14 Q16 10 20 10 Q24 10 24 14 Q24 17 20 18 L20 22"
          stroke={colors.textTertiary}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="20" cy="27" r="1.5" fill={colors.textTertiary} />
      </G>
    </Svg>
  );
};

// ============================================
// EMPTY FAVORITES - Sin favoritos
// ============================================
export const EmptyFavoritesIllustration: React.FC<IllustrationProps> = ({
  size = 160,
}) => {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.danger} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={colors.danger} stopOpacity={0.05} />
        </LinearGradient>
      </Defs>

      {/* Fondo circular */}
      <Circle cx="80" cy="80" r="70" fill="url(#favGrad)" />

      {/* Sombra */}
      <Ellipse
        cx="80"
        cy="135"
        rx="35"
        ry="8"
        fill={colors.separator}
        opacity={0.3}
      />

      {/* Corazón grande con línea punteada */}
      <G transform="translate(40, 35)">
        <Path
          d="M40 25 C40 10, 20 0, 10 15 C0 30, 10 50, 40 75 C70 50, 80 30, 70 15 C60 0, 40 10, 40 25"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="2"
        />
        <Path
          d="M25 40 L55 40"
          stroke={colors.textTertiary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />
      </G>

      {/* Estrellitas decorativas */}
      <Circle cx="30" cy="45" r="3" fill={colors.danger} opacity={0.3} />
      <Circle cx="130" cy="55" r="4" fill={colors.danger} opacity={0.25} />
      <Circle cx="25" cy="90" r="2" fill={colors.danger} opacity={0.2} />
      <Circle cx="135" cy="100" r="3" fill={colors.danger} opacity={0.2} />
    </Svg>
  );
};

// ============================================
// EMPTY DATA - Sin datos / Estado inicial
// ============================================
export const EmptyDataIllustration: React.FC<IllustrationProps> = ({
  size = 160,
}) => {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.12} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.03} />
        </LinearGradient>
      </Defs>

      {/* Fondo circular */}
      <Circle cx="80" cy="80" r="70" fill="url(#dataGrad)" />

      {/* Sombra */}
      <Ellipse
        cx="80"
        cy="135"
        rx="45"
        ry="8"
        fill={colors.separator}
        opacity={0.3}
      />

      {/* Carpeta */}
      <G transform="translate(30, 40)">
        {/* Pestaña de carpeta */}
        <Path
          d="M10 20 L10 10 Q10 5 15 5 L40 5 L50 15 L90 15 Q95 15 95 20 L95 20 L10 20"
          fill={colors.accent}
          opacity={0.3}
        />
        {/* Cuerpo de carpeta */}
        <Rect
          x="5"
          y="20"
          width="90"
          height="60"
          rx="5"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="1.5"
        />
        {/* Línea de carpeta */}
        <Path d="M5 30 L95 30" stroke={colors.separator} strokeWidth="1" />
        {/* Contenido vacío (líneas punteadas) */}
        <Path
          d="M20 45 L80 45"
          stroke={colors.textTertiary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
          opacity={0.5}
        />
        <Path
          d="M20 58 L60 58"
          stroke={colors.textTertiary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
          opacity={0.5}
        />
      </G>

      {/* Iconos flotantes */}
      <Circle cx="130" cy="45" r="8" fill={colors.accent} opacity={0.15} />
      <Circle cx="30" cy="60" r="6" fill={colors.accent} opacity={0.1} />
    </Svg>
  );
};

// ============================================
// ERROR STATE - Error de conexión
// ============================================
export const ErrorIllustration: React.FC<IllustrationProps> = ({
  size = 160,
}) => {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="errorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.danger} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={colors.danger} stopOpacity={0.05} />
        </LinearGradient>
      </Defs>

      {/* Fondo circular */}
      <Circle cx="80" cy="80" r="70" fill="url(#errorGrad)" />

      {/* Sombra */}
      <Ellipse
        cx="80"
        cy="135"
        rx="35"
        ry="8"
        fill={colors.separator}
        opacity={0.3}
      />

      {/* Nube con rayo */}
      <G transform="translate(25, 35)">
        {/* Nube */}
        <Path
          d="M90 50 Q100 50 100 40 Q100 25 85 25 Q85 10 65 10 Q50 10 45 25 Q30 25 30 40 Q30 50 45 50 Z"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="2"
        />
        {/* Rayo */}
        <Path
          d="M60 55 L55 70 L65 70 L55 90 L75 65 L63 65 L70 55 Z"
          fill={colors.warning}
        />
        {/* X de desconexión */}
        <G transform="translate(55, 20)">
          <Path
            d="M0 0 L15 15 M15 0 L0 15"
            stroke={colors.danger}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </G>
      </G>
    </Svg>
  );
};

// ============================================
// OFFLINE STATE - Modo sin conexión
// ============================================
export const OfflineIllustration: React.FC<IllustrationProps> = ({
  size = 160,
}) => {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="offlineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.warning} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={colors.warning} stopOpacity={0.05} />
        </LinearGradient>
      </Defs>

      {/* Fondo circular */}
      <Circle cx="80" cy="80" r="70" fill="url(#offlineGrad)" />

      {/* Sombra */}
      <Ellipse
        cx="80"
        cy="135"
        rx="40"
        ry="8"
        fill={colors.separator}
        opacity={0.3}
      />

      {/* Teléfono */}
      <G transform="translate(50, 30)">
        <Rect
          x="0"
          y="0"
          width="60"
          height="100"
          rx="10"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="2"
        />
        {/* Pantalla */}
        <Rect
          x="5"
          y="15"
          width="50"
          height="65"
          rx="3"
          fill={colors.background}
        />
        {/* Señal tachada */}
        <G transform="translate(15, 30)">
          {/* Barras de señal */}
          <Rect
            x="0"
            y="25"
            width="6"
            height="10"
            rx="1"
            fill={colors.textTertiary}
            opacity={0.3}
          />
          <Rect
            x="10"
            y="18"
            width="6"
            height="17"
            rx="1"
            fill={colors.textTertiary}
            opacity={0.3}
          />
          <Rect
            x="20"
            y="10"
            width="6"
            height="25"
            rx="1"
            fill={colors.textTertiary}
            opacity={0.3}
          />
          {/* Línea diagonal de tachado */}
          <Path
            d="M-2 38 L30 5"
            stroke={colors.danger}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </G>
        {/* Botón home */}
        <Circle cx="30" cy="95" r="5" fill={colors.separator} />
      </G>
    </Svg>
  );
};

// ============================================
// EMPTY NOTIFICATIONS - Sin notificaciones
// ============================================
export const EmptyNotificationsIllustration: React.FC<IllustrationProps> = ({
  size = 160,
}) => {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="notifGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.12} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.03} />
        </LinearGradient>
      </Defs>

      {/* Fondo circular */}
      <Circle cx="80" cy="80" r="70" fill="url(#notifGrad)" />

      {/* Sombra */}
      <Ellipse
        cx="80"
        cy="135"
        rx="30"
        ry="7"
        fill={colors.separator}
        opacity={0.3}
      />

      {/* Campana */}
      <G transform="translate(45, 30)">
        {/* Cuerpo de la campana */}
        <Path
          d="M35 20 Q35 5 35 5 Q35 0 35 0 L35 0 Q50 0 50 15 L50 50 Q50 55 55 60 L60 65 L10 65 L15 60 Q20 55 20 50 L20 15 Q20 0 35 0"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="2"
        />
        {/* Badana */}
        <Circle
          cx="35"
          cy="75"
          r="8"
          fill={colors.backgroundSecondary}
          stroke={colors.separator}
          strokeWidth="2"
        />
        {/* Zzz (dormida) */}
        <G transform="translate(55, 15)">
          <Path
            d="M0 15 L10 15 L0 25 L10 25"
            stroke={colors.textTertiary}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M12 5 L20 5 L12 13 L20 13"
            stroke={colors.textTertiary}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />
        </G>
      </G>
    </Svg>
  );
};

export default {
  EmptySearchIllustration,
  EmptyFavoritesIllustration,
  EmptyDataIllustration,
  ErrorIllustration,
  OfflineIllustration,
  EmptyNotificationsIllustration,
};
