// src/services/alertBackgroundService.ts
// Servicio de verificacion automatica de alertas en background

import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAlerts } from "./alertService";
import { advancedSearch } from "../api/secop";
import { getObligations, checkOverdue, OBLIGATION_TYPE_CONFIG } from "./obligationService";

// ============================================
// CONSTANTES
// ============================================
export const ALERT_CHECK_TASK = "SECOP_ALERT_CHECK";
const USER_ID_KEY = "secop-alert-user-id";

// Estados de proceso que indican que aún está vigente/abierto
const ESTADOS_VIGENTES = new Set([
  "Publicado",
  "Evaluación",
  "Abierto",
  "En aprobación",
  "Aprobado",
]);

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

        // Solo procesos publicados desde que se creó la alerta (máximo 15 días atrás)
        const alertCreated = new Date(alert.created_at);
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const fromDate = alertCreated > fifteenDaysAgo ? alertCreated : fifteenDaysAgo;

        const processes = await advancedSearch({
          keyword: alert.filters.keyword,
          departamento: alert.filters.departamento,
          municipio: alert.filters.municipio,
          modalidad: alert.filters.modalidad,
          tipoContrato: alert.filters.tipo_contrato,
          publishedAfter: fromDate.toISOString(),
          limit: 20,
        });

        // Solo considerar procesos con estado vigente/abierto
        const activeProcesses = processes.filter((p) =>
          ESTADOS_VIGENTES.has(p.estado_del_procedimiento || "")
        );

        // Obtener IDs de resultados actuales
        const currentIds = activeProcesses
          .map((p) => p.id_del_proceso || "")
          .filter(Boolean);

        // Detectar nuevos procesos comparando con los anteriores
        const previousIds = new Set(alert.last_results_ids || []);
        const newIds = currentIds.filter((id) => !previousIds.has(id));

        // Obtener los procesos nuevos con sus detalles
        const newProcesses = activeProcesses.filter(
          (p) => p.id_del_proceso && newIds.includes(p.id_del_proceso)
        );

        // Enviar notificacion local si hay procesos nuevos (fallback del push del servidor)
        if (newIds.length > 0) {
          const processLines = newProcesses.slice(0, 3).map(
            (p) => `• ${(p.nombre_del_procedimiento || p.entidad || "").substring(0, 60)}`
          );
          const extra = newIds.length > 3 ? `\n...y ${newIds.length - 3} más` : "";
          const body = processLines.join("\n") + extra;

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
              sound: "default",
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
          notificationsSent++;
        }

        // NO actualizar last_check ni last_results_ids desde el cliente.
        // Solo el servidor (edge function via cron) debe actualizar estos campos,
        // para que el cron pueda detectar procesos nuevos y enviar push notifications
        // cuando la app está cerrada.
      } catch (error) {
        if (__DEV__) { console.error(`Error checking alert ${alert.id}:`, error); }
      }
    }
  } catch (error) {
    if (__DEV__) { console.error("Error in checkAlertsForUser:", error); }
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
              sound: "default",
              priority: Notifications.AndroidNotificationPriority.HIGH,
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
    if (__DEV__) { console.error("Error checking obligation reminders:", error); }
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
    if (__DEV__) { console.error("Background alert check failed:", error); }
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

    if (__DEV__) { console.log("Background alert check registered"); }
  } catch (error) {
    // Background tasks are not supported in Expo Go — warn instead of error
    // to avoid triggering the red error overlay in dev mode
    if (__DEV__) { console.warn("Background alert check not available:", error); }
  }
}

export async function unregisterBackgroundAlertCheck(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      ALERT_CHECK_TASK
    );

    if (!isRegistered) return;

    await BackgroundTask.unregisterTaskAsync(ALERT_CHECK_TASK);
    if (__DEV__) { console.log("Background alert check unregistered"); }
  } catch (error) {
    if (__DEV__) { console.error("Error unregistering background alert check:", error); }
  }
}
