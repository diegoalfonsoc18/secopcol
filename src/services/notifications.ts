import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipo local para evitar dependencia circular
interface SecopProcess {
  id_del_proceso: string;
  fecha_de_publicacion_del?: string;
  modalidad_de_contratacion?: string;
  tipo_de_contrato?: string;
  [key: string]: any;
}

// ============================================
// CONFIGURACIÓN
// ============================================
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // alert_match: sonido + badge (procesos nuevos detectados)
    if (data?.type === "alert_match") {
      return {
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }

    // daily_reminder y otros: sin sonido, mas discreto
    return {
      shouldPlaySound: false,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
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

const STORAGE_KEY = "secop-notifications";

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  watchedMunicipalities: [],
  watchedModalities: [],
  watchedContractTypes: [],
  lastCheckDate: null,
};

// ============================================
// OPCIONES DE FILTRO
// ============================================
export const MODALIDADES_CONTRATACION = [
  {
    id: "licitacion",
    label: "Licitación pública",
    value: "Licitación pública",
    icon: "megaphone-outline",
  },
  {
    id: "directa",
    label: "Contratación directa",
    value: "Contratación directa",
    icon: "arrow-forward-outline",
  },
  {
    id: "minima",
    label: "Mínima cuantía",
    value: "Mínima cuantía",
    icon: "cash-outline",
  },
  {
    id: "abreviada",
    label: "Selección abreviada",
    value: "Selección abreviada menor cuantía",
    icon: "time-outline",
  },
  {
    id: "concurso",
    label: "Concurso de méritos",
    value: "Concurso de méritos abierto",
    icon: "trophy-outline",
  },
];

export const TIPOS_CONTRATO = [
  { id: "obra", label: "Obra", value: "Obra", icon: "construct-outline" },
  {
    id: "servicios",
    label: "Servicios",
    value: "Prestación de servicios",
    icon: "people-outline",
  },
  {
    id: "suministro",
    label: "Suministro",
    value: "Suministro",
    icon: "cube-outline",
  },
  {
    id: "consultoria",
    label: "Consultoría",
    value: "Consultoría",
    icon: "bulb-outline",
  },
  {
    id: "interventoria",
    label: "Interventoría",
    value: "Interventoría",
    icon: "eye-outline",
  },
];

// ============================================
// PERMISOS
// ============================================
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Notificaciones no disponibles en simulador");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
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

  return true;
}

// ============================================
// CONFIGURACIÓN
// ============================================
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  const settings = await getNotificationSettings();
  settings.enabled = enabled;
  await saveSettings(settings);

  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

// ============================================
// MUNICIPIOS
// ============================================
export async function addWatchedMunicipality(
  municipality: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (!settings.watchedMunicipalities.includes(municipality)) {
    settings.watchedMunicipalities.push(municipality);
    await saveSettings(settings);
  }
  return settings.watchedMunicipalities;
}

export async function removeWatchedMunicipality(
  municipality: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  settings.watchedMunicipalities = settings.watchedMunicipalities.filter(
    (m) => m !== municipality
  );
  await saveSettings(settings);
  return settings.watchedMunicipalities;
}

// ============================================
// MODALIDADES Y TIPOS
// ============================================
export async function toggleWatchedModality(
  modalityId: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  const index = settings.watchedModalities.indexOf(modalityId);
  if (index === -1) {
    settings.watchedModalities.push(modalityId);
  } else {
    settings.watchedModalities.splice(index, 1);
  }
  await saveSettings(settings);
  return settings.watchedModalities;
}

export async function toggleWatchedContractType(
  typeId: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  const index = settings.watchedContractTypes.indexOf(typeId);
  if (index === -1) {
    settings.watchedContractTypes.push(typeId);
  } else {
    settings.watchedContractTypes.splice(index, 1);
  }
  await saveSettings(settings);
  return settings.watchedContractTypes;
}

// ============================================
// VERIFICAR NUEVOS PROCESOS
// ============================================
const SECOP_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";

async function fetchProcessesByMunicipality(
  municipality: string
): Promise<SecopProcess[]> {
  try {
    const query = `ciudad_entidad='${municipality}'`;
    const url = `${SECOP_API_URL}?$where=${encodeURIComponent(
      query
    )}&$limit=10&$order=fecha_de_publicacion_del DESC`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function checkForNewProcesses(): Promise<SecopProcess[]> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || settings.watchedMunicipalities.length === 0) {
    return [];
  }

  const allNewProcesses: SecopProcess[] = [];

  for (const municipality of settings.watchedMunicipalities) {
    try {
      const processes = await fetchProcessesByMunicipality(municipality);

      // Filtrar por fecha (últimas 24 horas)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newOnes = processes.filter((p) => {
        if (!p.fecha_de_publicacion_del) return false;
        const pubDate = new Date(p.fecha_de_publicacion_del);
        return pubDate >= yesterday;
      });

      allNewProcesses.push(...newOnes);
    } catch (error) {
      console.error(`Error checking ${municipality}:`, error);
    }
  }

  // Filtrar por modalidad si hay filtros activos
  let filtered = allNewProcesses;
  if (settings.watchedModalities.length > 0) {
    const modalityValues = settings.watchedModalities.map(
      (id) => MODALIDADES_CONTRATACION.find((m) => m.id === id)?.value
    );
    filtered = filtered.filter((p) =>
      modalityValues.includes(p.modalidad_de_contratacion)
    );
  }

  // Filtrar por tipo de contrato si hay filtros activos
  if (settings.watchedContractTypes.length > 0) {
    const typeValues = settings.watchedContractTypes.map(
      (id) => TIPOS_CONTRATO.find((t) => t.id === id)?.value
    );
    filtered = filtered.filter((p) => typeValues.includes(p.tipo_de_contrato));
  }

  // Eliminar duplicados
  const unique = filtered.filter(
    (p, i, arr) =>
      arr.findIndex((x) => x.id_del_proceso === p.id_del_proceso) === i
  );

  // Actualizar fecha de última verificación
  settings.lastCheckDate = new Date().toISOString();
  await saveSettings(settings);

  // Enviar notificación si hay nuevos
  if (unique.length > 0 && settings.enabled) {
    await sendNewProcessesNotification(unique.length);
  }

  return unique;
}

// ============================================
// ENVIAR NOTIFICACIÓN
// ============================================
async function sendNewProcessesNotification(count: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔔 Nuevos procesos SECOP",
      body: `Se encontraron ${count} proceso${count > 1 ? "s" : ""} nuevo${
        count > 1 ? "s" : ""
      } en tus municipios de interés`,
      data: { type: "new_processes" },
      sound: true,
    },
    trigger: null,
  });
}

// ============================================
// PROGRAMAR VERIFICACIÓN PERIÓDICA
// ============================================
export async function scheduleBackgroundCheck(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📋 Revisa los nuevos procesos",
      body: "Abre la app para ver los últimos procesos de contratación",
      data: { type: "daily_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}
