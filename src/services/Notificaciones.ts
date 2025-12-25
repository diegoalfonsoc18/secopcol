import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecopProcess, getRecentProcesses } from "../api/secop";

// ============================================
// CONFIGURACIÓN
// ============================================
const STORAGE_KEYS = {
  WATCHED_MUNICIPALITIES: "secop-watched-municipalities",
  LAST_CHECK_DATE: "secop-last-check-date",
  SEEN_PROCESS_IDS: "secop-seen-process-ids",
  NOTIFICATIONS_ENABLED: "secop-notifications-enabled",
};

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================
// TIPOS
// ============================================
export interface NotificationSettings {
  enabled: boolean;
  watchedMunicipalities: string[];
  lastCheckDate: string | null;
}

// ============================================
// PERMISOS
// ============================================
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("⚠️ Notificaciones solo funcionan en dispositivos físicos");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("❌ Permisos de notificación denegados");
    return false;
  }

  // Configuración específica de Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("secop-alerts", {
      name: "Alertas SECOP",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#007AFF",
    });
  }

  console.log("✅ Permisos de notificación concedidos");
  return true;
}

// ============================================
// GESTIÓN DE CONFIGURACIÓN
// ============================================
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const [enabled, municipalities, lastCheck] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
      AsyncStorage.getItem(STORAGE_KEYS.WATCHED_MUNICIPALITIES),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECK_DATE),
    ]);

    return {
      enabled: enabled === "true",
      watchedMunicipalities: municipalities ? JSON.parse(municipalities) : [],
      lastCheckDate: lastCheck,
    };
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return {
      enabled: false,
      watchedMunicipalities: [],
      lastCheckDate: null,
    };
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.NOTIFICATIONS_ENABLED,
    String(enabled)
  );
  console.log(`🔔 Notificaciones ${enabled ? "activadas" : "desactivadas"}`);
}

export async function setWatchedMunicipalities(
  municipalities: string[]
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.WATCHED_MUNICIPALITIES,
    JSON.stringify(municipalities)
  );
  console.log(`📍 Municipios vigilados: ${municipalities.join(", ")}`);
}

export async function addWatchedMunicipality(
  municipality: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (!settings.watchedMunicipalities.includes(municipality)) {
    const updated = [...settings.watchedMunicipalities, municipality];
    await setWatchedMunicipalities(updated);
    return updated;
  }
  return settings.watchedMunicipalities;
}

export async function removeWatchedMunicipality(
  municipality: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  const updated = settings.watchedMunicipalities.filter(
    (m) => m !== municipality
  );
  await setWatchedMunicipalities(updated);
  return updated;
}

// ============================================
// ENVIAR NOTIFICACIONES
// ============================================
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Inmediata
  });

  console.log(`📬 Notificación enviada: ${title}`);
  return identifier;
}

export async function sendNewProcessNotification(
  process: SecopProcess
): Promise<void> {
  const valor = process.precio_base
    ? `$${Number(process.precio_base).toLocaleString("es-CO")}`
    : "Sin valor";

  await sendLocalNotification(
    `🆕 Nuevo proceso en ${process.ciudad_entidad}`,
    `${process.nombre_del_procedimiento?.substring(0, 100)}...\n💰 ${valor}`,
    { processId: process.id_del_proceso, process }
  );
}

// ============================================
// VERIFICAR NUEVOS PROCESOS
// ============================================
export async function checkForNewProcesses(): Promise<SecopProcess[]> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || settings.watchedMunicipalities.length === 0) {
    console.log(
      "⏭️ Verificación omitida: notificaciones desactivadas o sin municipios"
    );
    return [];
  }

  try {
    // Obtener IDs de procesos ya vistos
    const seenIdsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.SEEN_PROCESS_IDS
    );
    const seenIds: Set<string> = new Set(
      seenIdsJson ? JSON.parse(seenIdsJson) : []
    );

    // Obtener procesos recientes
    const recentProcesses = await getRecentProcesses(100);

    // Filtrar procesos nuevos en municipios vigilados
    const newProcesses = recentProcesses.filter((process) => {
      const isWatched = settings.watchedMunicipalities.includes(
        process.ciudad_entidad
      );
      const isNew = !seenIds.has(process.id_del_proceso);
      return isWatched && isNew;
    });

    // Guardar nuevos IDs como vistos
    if (newProcesses.length > 0) {
      const updatedSeenIds = [
        ...Array.from(seenIds),
        ...newProcesses.map((p) => p.id_del_proceso),
      ].slice(-500); // Mantener solo los últimos 500

      await AsyncStorage.setItem(
        STORAGE_KEYS.SEEN_PROCESS_IDS,
        JSON.stringify(updatedSeenIds)
      );

      // Enviar notificaciones
      for (const process of newProcesses.slice(0, 5)) {
        await sendNewProcessNotification(process);
      }

      if (newProcesses.length > 5) {
        await sendLocalNotification(
          `📋 ${newProcesses.length - 5} procesos más`,
          `Hay más procesos nuevos en tus municipios de interés`,
          { type: "summary" }
        );
      }
    }

    // Actualizar fecha de última verificación
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_CHECK_DATE,
      new Date().toISOString()
    );

    console.log(
      `🔍 Verificación completada: ${newProcesses.length} procesos nuevos`
    );
    return newProcesses;
  } catch (error) {
    console.error("Error checking for new processes:", error);
    return [];
  }
}

// ============================================
// LISTENERS
// ============================================
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ============================================
// BADGE
// ============================================
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

export default {
  requestNotificationPermissions,
  getNotificationSettings,
  setNotificationsEnabled,
  setWatchedMunicipalities,
  addWatchedMunicipality,
  removeWatchedMunicipality,
  sendLocalNotification,
  sendNewProcessNotification,
  checkForNewProcesses,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  setBadgeCount,
  clearBadge,
};
