// src/services/alertBackgroundService.ts
// Servicio de verificacion automatica de alertas en background

import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAlerts, getAlert, updateAlertResults } from "./alertService";
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

        // Enviar notificacion local si hay procesos nuevos
        // Primero verificar si el servidor ya envio push para esta alerta
        // (deduplicacion cliente/servidor)
        if (newIds.length > 0) {
          let shouldSendLocal = true;

          try {
            const freshAlert = await getAlert(alert.id);
            if (freshAlert?.last_check) {
              const serverLastCheck = new Date(freshAlert.last_check);
              const clientLastCheck = alert.last_check
                ? new Date(alert.last_check)
                : new Date(0);
              // Si el servidor ya checkeo mas recientemente, no enviar local
              if (serverLastCheck > clientLastCheck) {
                shouldSendLocal = false;
              }
            }
          } catch {
            // Si falla la verificacion, enviar local como fallback
          }

          if (shouldSendLocal) {
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
const BG_TASK_LOG_KEY = "secop-last-bg-task-run";

TaskManager.defineTask(ALERT_CHECK_TASK, async () => {
  try {
    const userId = await getUserIdFromStorage();

    if (!userId) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    // Timeout de 25s para evitar que el OS mate el task
    const timeoutPromise = new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error("Background task timeout (25s)")), 25000)
    );

    const sent = await Promise.race([
      checkAlertsForUser(userId),
      timeoutPromise,
    ]);

    // Guardar timestamp para debugging
    await AsyncStorage.setItem(BG_TASK_LOG_KEY, new Date().toISOString());

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("Background alert check failed:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// ============================================
// REGISTRAR / DESREGISTRAR BACKGROUND TASK
// ============================================
export async function registerBackgroundAlertCheck(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      ALERT_CHECK_TASK
    );

    if (isRegistered) return;

    await BackgroundTask.registerTaskAsync(ALERT_CHECK_TASK, {
      minimumInterval: 15, // minutos (minimo 15 en Android)
    });

    console.log("Background alert check registered");
  } catch (error) {
    // Background tasks are not supported in Expo Go — warn instead of error
    // to avoid triggering the red error overlay in dev mode
    console.warn("Background alert check not available:", error);
  }
}

export async function unregisterBackgroundAlertCheck(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      ALERT_CHECK_TASK
    );

    if (!isRegistered) return;

    await BackgroundTask.unregisterTaskAsync(ALERT_CHECK_TASK);
    console.log("Background alert check unregistered");
  } catch (error) {
    console.error("Error unregistering background alert check:", error);
  }
}
