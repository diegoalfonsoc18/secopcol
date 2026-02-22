// src/services/alertBackgroundService.ts
// Servicio de verificacion automatica de alertas en background

import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAlerts, getAlert, updateAlertResults } from "./alertService";
import { advancedSearch } from "../api/secop";
import { getObligations, checkOverdue, OBLIGATION_TYPE_CONFIG } from "./obligationService";

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

        // Obtener los procesos nuevos con sus detalles
        const newProcesses = processes.filter(
          (p) => p.id_del_proceso && newIds.includes(p.id_del_proceso)
        );

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
            // Construir body con resumen de los procesos encontrados
            const processLines = newProcesses.slice(0, 3).map(
              (p) => `• ${(p.nombre_del_procedimiento || p.entidad || "").substring(0, 60)}`
            );
            const extra = newIds.length > 3 ? `\n...y ${newIds.length - 3} más` : "";
            const body = processLines.join("\n") + extra;

            // Incluir resumen de procesos en el data para mostrar en la app
            const processSummaries = newProcesses.slice(0, 5).map((p) => ({
              id: p.id_del_proceso,
              nombre: (p.nombre_del_procedimiento || "").substring(0, 100),
              entidad: (p.entidad || "").substring(0, 80),
              precio: p.precio_base || null,
              fase: p.fase || null,
            }));

            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${alert.name} — ${newIds.length} nuevo${newIds.length > 1 ? "s" : ""}`,
                body,
                data: {
                  type: "alert_match",
                  alertId: alert.id,
                  newProcessIds: newIds.slice(0, 10),
                  processSummaries,
                },
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
// VERIFICAR OBLIGACIONES PROXIMAS A VENCER
// ============================================
const OBLIGATION_NOTIF_KEY = "secop-obligation-notif-dates";

export async function checkObligationReminders(userId: string): Promise<number> {
  let notificationsSent = 0;

  try {
    // Primero actualizar vencidas
    await checkOverdue(userId);

    const obligations = await getObligations(userId);
    const pending = obligations.filter((o) => o.status === "pending");

    if (pending.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cargar notificaciones ya enviadas (para no duplicar)
    const sentRaw = await AsyncStorage.getItem(OBLIGATION_NOTIF_KEY);
    const sentMap: Record<string, string[]> = sentRaw ? JSON.parse(sentRaw) : {};

    for (const obl of pending) {
      const dueDate = new Date(obl.due_date + "T00:00:00");
      const diffDays = Math.round(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const reminderDays = obl.reminder_days || [7, 1];
      const sentForObl = sentMap[obl.id] || [];

      for (const reminderDay of reminderDays) {
        if (diffDays === reminderDay && !sentForObl.includes(String(reminderDay))) {
          const typeConfig = OBLIGATION_TYPE_CONFIG[obl.obligation_type];
          const daysText = reminderDay === 1 ? "manana" : `en ${reminderDay} dias`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${typeConfig?.label || "Obligacion"} vence ${daysText}`,
              body: `${obl.title}${obl.process_name ? ` — ${obl.process_name}` : ""}`,
              data: {
                type: "obligation_reminder",
                obligationId: obl.id,
                processId: obl.process_id,
              },
              sound: true,
            },
            trigger: null,
          });

          notificationsSent++;

          // Registrar como enviada
          if (!sentMap[obl.id]) sentMap[obl.id] = [];
          sentMap[obl.id].push(String(reminderDay));
        }
      }
    }

    // Guardar estado de notificaciones enviadas
    await AsyncStorage.setItem(OBLIGATION_NOTIF_KEY, JSON.stringify(sentMap));
  } catch (error) {
    console.error("Error checking obligation reminders:", error);
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
      Promise.all([
        checkAlertsForUser(userId),
        checkObligationReminders(userId),
      ]),
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
