// src/services/alertBackgroundService.ts
// Servicio de verificacion automatica de alertas en background

import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAlerts, updateAlertResults } from "./alertService";
import { advancedSearch } from "../api/secop";

// ============================================
// CONSTANTES
// ============================================
export const ALERT_CHECK_TASK = "SECOP_ALERT_CHECK";
const USER_ID_KEY = "secop-alert-user-id";

// ============================================
// PERSISTIR USER ID PARA BACKGROUND
// ============================================
export async function saveUserIdForBackground(userId: string): Promise<void> {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function clearUserIdForBackground(): Promise<void> {
  await AsyncStorage.removeItem(USER_ID_KEY);
}

async function getUserIdFromStorage(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

// ============================================
// VERIFICAR ALERTAS DE UN USUARIO
// ============================================
export async function checkAlertsForUser(userId: string): Promise<number> {
  let notificationsSent = 0;

  try {
    const alerts = await getAlerts(userId);
    const activeAlerts = alerts.filter((a) => a.is_active);

    if (activeAlerts.length === 0) return 0;

    const now = new Date();

    for (const alert of activeAlerts) {
      try {
        // Verificar si ya paso suficiente tiempo desde la ultima verificacion
        if (alert.last_check) {
          const lastCheck = new Date(alert.last_check);
          const hoursSinceCheck =
            (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

          if (hoursSinceCheck < alert.frequency_hours) {
            continue;
          }
        }

        // Consultar SECOP con los filtros de la alerta
        const processes = await advancedSearch({
          keyword: alert.filters.keyword,
          departamento: alert.filters.departamento,
          municipio: alert.filters.municipio,
          modalidad: alert.filters.modalidad,
          tipoContrato: alert.filters.tipo_contrato,
          limit: 20,
        });

        // Obtener IDs de resultados actuales
        const currentIds = processes
          .map((p) => p.id_del_proceso || "")
          .filter(Boolean);

        // Detectar nuevos procesos comparando con los anteriores
        const previousIds = new Set(alert.last_results_ids || []);
        const newIds = currentIds.filter((id) => !previousIds.has(id));

        // Enviar notificacion si hay procesos nuevos
        if (newIds.length > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alert.name,
              body: `${newIds.length} nuevo${newIds.length > 1 ? "s" : ""} proceso${newIds.length > 1 ? "s" : ""} encontrado${newIds.length > 1 ? "s" : ""}`,
              data: { type: "alert_match", alertId: alert.id },
              sound: true,
            },
            trigger: null,
          });
          notificationsSent++;
        }

        // Actualizar resultados en Supabase
        await updateAlertResults(alert.id, {
          last_check: now.toISOString(),
          last_results_count: currentIds.length,
          last_results_ids: currentIds,
        });
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in checkAlertsForUser:", error);
  }

  return notificationsSent;
}

// ============================================
// DEFINIR BACKGROUND TASK
// ============================================
TaskManager.defineTask(ALERT_CHECK_TASK, async () => {
  try {
    const userId = await getUserIdFromStorage();

    if (!userId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const sent = await checkAlertsForUser(userId);

    return sent > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("Background alert check failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================
// REGISTRAR / DESREGISTRAR BACKGROUND FETCH
// ============================================
export async function registerBackgroundAlertCheck(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      ALERT_CHECK_TASK
    );

    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(ALERT_CHECK_TASK, {
      minimumInterval: 15 * 60, // 15 minutos (minimo en iOS)
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("Background alert check registered");
  } catch (error) {
    console.error("Error registering background alert check:", error);
  }
}

export async function unregisterBackgroundAlertCheck(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      ALERT_CHECK_TASK
    );

    if (!isRegistered) return;

    await BackgroundFetch.unregisterTaskAsync(ALERT_CHECK_TASK);
    console.log("Background alert check unregistered");
  } catch (error) {
    console.error("Error unregistering background alert check:", error);
  }
}
