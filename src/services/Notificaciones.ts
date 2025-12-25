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
  WATCHED_MODALITIES: "secop-watched-modalities",
  WATCHED_CONTRACT_TYPES: "secop-watched-contract-types",
  LAST_CHECK_DATE: "secop-last-check-date",
  SEEN_PROCESS_IDS: "secop-seen-process-ids",
  NOTIFICATIONS_ENABLED: "secop-notifications-enabled",
};

// Modalidades disponibles
export const MODALIDADES_CONTRATACION = [
  { id: "licitacion", label: "Licitación pública", icon: "megaphone-outline" },
  {
    id: "seleccion_abreviada",
    label: "Selección abreviada",
    icon: "flash-outline",
  },
  {
    id: "contratacion_directa",
    label: "Contratación directa",
    icon: "person-outline",
  },
  { id: "minima_cuantia", label: "Mínima cuantía", icon: "wallet-outline" },
  {
    id: "concurso_meritos",
    label: "Concurso de méritos",
    icon: "trophy-outline",
  },
  { id: "regimen_especial", label: "Régimen especial", icon: "star-outline" },
] as const;

// Tipos de contrato disponibles
export const TIPOS_CONTRATO = [
  { id: "obra", label: "Obra", icon: "construct-outline" },
  { id: "consultoria", label: "Consultoría", icon: "bulb-outline" },
  {
    id: "prestacion_servicios",
    label: "Prestación de servicios",
    icon: "briefcase-outline",
  },
  { id: "suministro", label: "Suministro", icon: "cube-outline" },
  { id: "compraventa", label: "Compraventa", icon: "cart-outline" },
  { id: "interventoria", label: "Interventoría", icon: "eye-outline" },
  { id: "arrendamiento", label: "Arrendamiento", icon: "home-outline" },
] as const;

// Mapeo de IDs a valores de la API - Modalidades
export const MODALIDAD_API_MAP: Record<string, string> = {
  licitacion: "Licitación pública",
  seleccion_abreviada: "Selección abreviada menor cuantía",
  contratacion_directa: "Contratación directa",
  minima_cuantia: "Mínima cuantía",
  concurso_meritos: "Concurso de méritos abierto",
  regimen_especial: "Contratación régimen especial",
};

// Mapeo de IDs a valores de la API - Tipos de contrato
export const TIPO_CONTRATO_API_MAP: Record<string, string> = {
  obra: "Obra",
  consultoria: "Consultoría",
  prestacion_servicios: "Prestación de servicios",
  suministro: "Suministro",
  compraventa: "Compraventa",
  interventoria: "Interventoría",
  arrendamiento: "Arrendamiento",
};

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// TIPOS
// ============================================
export interface NotificationSettings {
  enabled: boolean;
  watchedMunicipalities: string[];
  watchedModalities: string[];
  watchedContractTypes: string[];
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
    const [enabled, municipalities, modalities, contractTypes, lastCheck] =
      await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.WATCHED_MUNICIPALITIES),
        AsyncStorage.getItem(STORAGE_KEYS.WATCHED_MODALITIES),
        AsyncStorage.getItem(STORAGE_KEYS.WATCHED_CONTRACT_TYPES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECK_DATE),
      ]);

    return {
      enabled: enabled === "true",
      watchedMunicipalities: municipalities ? JSON.parse(municipalities) : [],
      watchedModalities: modalities ? JSON.parse(modalities) : [],
      watchedContractTypes: contractTypes ? JSON.parse(contractTypes) : [],
      lastCheckDate: lastCheck,
    };
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return {
      enabled: false,
      watchedMunicipalities: [],
      watchedModalities: [],
      watchedContractTypes: [],
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

// ============================================
// GESTIÓN DE MUNICIPIOS
// ============================================
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
// GESTIÓN DE MODALIDADES
// ============================================
export async function setWatchedModalities(
  modalities: string[]
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.WATCHED_MODALITIES,
    JSON.stringify(modalities)
  );
  console.log(`📋 Modalidades vigiladas: ${modalities.join(", ")}`);
}

export async function addWatchedModality(modality: string): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (!settings.watchedModalities.includes(modality)) {
    const updated = [...settings.watchedModalities, modality];
    await setWatchedModalities(updated);
    return updated;
  }
  return settings.watchedModalities;
}

export async function removeWatchedModality(
  modality: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  const updated = settings.watchedModalities.filter((m) => m !== modality);
  await setWatchedModalities(updated);
  return updated;
}

export async function toggleWatchedModality(
  modality: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (settings.watchedModalities.includes(modality)) {
    return removeWatchedModality(modality);
  } else {
    return addWatchedModality(modality);
  }
}

// ============================================
// GESTIÓN DE TIPOS DE CONTRATO
// ============================================
export async function setWatchedContractTypes(types: string[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.WATCHED_CONTRACT_TYPES,
    JSON.stringify(types)
  );
  console.log(`📄 Tipos de contrato vigilados: ${types.join(", ")}`);
}

export async function addWatchedContractType(type: string): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (!settings.watchedContractTypes.includes(type)) {
    const updated = [...settings.watchedContractTypes, type];
    await setWatchedContractTypes(updated);
    return updated;
  }
  return settings.watchedContractTypes;
}

export async function removeWatchedContractType(
  type: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  const updated = settings.watchedContractTypes.filter((t) => t !== type);
  await setWatchedContractTypes(updated);
  return updated;
}

export async function toggleWatchedContractType(
  type: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (settings.watchedContractTypes.includes(type)) {
    return removeWatchedContractType(type);
  } else {
    return addWatchedContractType(type);
  }
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
    trigger: null,
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
    `🆕 Nuevo proceso en ${process.ciudad_entidad || "Colombia"}`,
    `${
      process.nombre_del_procedimiento?.substring(0, 100) || "Sin descripción"
    }...\n💰 ${valor}`,
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

    // Convertir filtros seleccionados a valores de la API
    const watchedModalityValues = settings.watchedModalities
      .map((id) => MODALIDAD_API_MAP[id])
      .filter(Boolean);

    const watchedContractTypeValues = settings.watchedContractTypes
      .map((id) => TIPO_CONTRATO_API_MAP[id])
      .filter(Boolean);

    // Filtrar procesos nuevos
    const newProcesses = recentProcesses.filter((process) => {
      // Verificar municipio
      const isWatchedMunicipality = process.ciudad_entidad
        ? settings.watchedMunicipalities.includes(process.ciudad_entidad)
        : false;

      // Verificar si es nuevo
      const isNew = !seenIds.has(process.id_del_proceso);

      // Verificar modalidad (si no hay seleccionadas, acepta todas)
      const isWatchedModality =
        watchedModalityValues.length === 0 ||
        (process.modalidad_de_contratacion
          ? watchedModalityValues.includes(process.modalidad_de_contratacion)
          : false);

      // Verificar tipo de contrato (si no hay seleccionados, acepta todos)
      const isWatchedContractType =
        watchedContractTypeValues.length === 0 ||
        (process.tipo_de_contrato
          ? watchedContractTypeValues.includes(process.tipo_de_contrato)
          : false);

      return (
        isWatchedMunicipality &&
        isNew &&
        isWatchedModality &&
        isWatchedContractType
      );
    });

    // Guardar nuevos IDs como vistos
    if (newProcesses.length > 0) {
      const updatedSeenIds = [
        ...Array.from(seenIds),
        ...newProcesses.map((p) => p.id_del_proceso),
      ].slice(-500);

      await AsyncStorage.setItem(
        STORAGE_KEYS.SEEN_PROCESS_IDS,
        JSON.stringify(updatedSeenIds)
      );

      // Enviar notificaciones (máximo 5)
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
  // Municipios
  setWatchedMunicipalities,
  addWatchedMunicipality,
  removeWatchedMunicipality,
  // Modalidades
  setWatchedModalities,
  addWatchedModality,
  removeWatchedModality,
  toggleWatchedModality,
  // Tipos de contrato
  setWatchedContractTypes,
  addWatchedContractType,
  removeWatchedContractType,
  toggleWatchedContractType,
  // Notificaciones
  sendLocalNotification,
  sendNewProcessNotification,
  checkForNewProcesses,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  setBadgeCount,
  clearBadge,
  // Constantes
  MODALIDADES_CONTRATACION,
  MODALIDAD_API_MAP,
  TIPOS_CONTRATO,
  TIPO_CONTRATO_API_MAP,
};
