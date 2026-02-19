// supabase/functions/check-alerts/index.ts
// Edge Function que verifica alertas activas y envia push notifications
// via Expo Push API cuando detecta procesos nuevos en SECOP.
// Diseñada para ser invocada por pg_cron cada 30 minutos.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONSTANTES
// ============================================
const SECOP_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";
const SECOP_APP_TOKEN = Deno.env.get("SECOP_APP_TOKEN") || "";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// CONSTRUIR QUERY SECOP (replica de src/api/secop.ts buildQuery)
// ============================================
interface AlertFilters {
  keyword?: string;
  departamento?: string;
  municipio?: string;
  modalidad?: string;
  tipo_contrato?: string;
  fase?: string;
}

function buildSecopUrl(filters: AlertFilters, limit = 20): string {
  const conditions: string[] = [];

  if (filters.municipio) {
    const clean = filters.municipio
      .replace(/,?\s*D\.?C\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
    conditions.push(`upper(ciudad_entidad) LIKE upper('%${clean}%')`);
  }

  if (filters.departamento) {
    const clean = filters.departamento
      .replace(/,?\s*D\.?C\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
    conditions.push(
      `upper(departamento_entidad) LIKE upper('%${clean}%')`
    );
  }

  if (filters.fase) {
    conditions.push(`fase='${filters.fase}'`);
  }

  if (filters.modalidad) {
    conditions.push(`modalidad_de_contratacion='${filters.modalidad}'`);
  }

  if (filters.tipo_contrato) {
    conditions.push(`tipo_de_contrato='${filters.tipo_contrato}'`);
  }

  if (filters.keyword) {
    const keyword = filters.keyword.replace(/'/g, "''");
    conditions.push(
      `(upper(descripci_n_del_procedimiento) LIKE upper('%${keyword}%') OR upper(entidad) LIKE upper('%${keyword}%') OR upper(nombre_del_procedimiento) LIKE upper('%${keyword}%'))`
    );
  }

  let query = `$limit=${limit}&$order=${encodeURIComponent(
    "fecha_de_ultima_publicaci DESC"
  )}`;

  if (conditions.length > 0) {
    query += `&$where=${encodeURIComponent(conditions.join(" AND "))}`;
  }

  return `${SECOP_API_URL}?${query}`;
}

// ============================================
// CONSULTAR SECOP API
// ============================================
interface SecopResult {
  id_del_proceso: string;
  nombre_del_procedimiento?: string;
  entidad?: string;
  precio_base?: string | number;
  fase?: string;
}

async function querySecop(
  filters: AlertFilters
): Promise<SecopResult[]> {
  try {
    const url = buildSecopUrl(filters);
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-App-Token": SECOP_APP_TOKEN,
      },
    });

    if (!response.ok) {
      console.error(`SECOP HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error querying SECOP:", error);
    return [];
  }
}

// ============================================
// ENVIAR PUSH VIA EXPO PUSH API
// ============================================
async function sendExpoPush(
  token: string,
  message: {
    title: string;
    body: string;
    data: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title: message.title,
        body: message.body,
        data: message.data,
        channelId: "secop-alerts",
        priority: "high",
        badge: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Expo Push API error: ${response.status} - ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Expo push:", error);
    return false;
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
serve(async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const startTime = Date.now();
  let alertsChecked = 0;
  let notificationsSent = 0;
  let errors = 0;

  try {
    // 1. Obtener todas las alertas activas con push_token del usuario
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("*, profiles!inner(push_token)")
      .eq("is_active", true);

    if (alertsError) {
      throw new Error(`Supabase query error: ${alertsError.message}`);
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active alerts found",
          stats: { alertsChecked: 0, notificationsSent: 0 },
        }),
        { headers }
      );
    }

    const now = new Date();

    // 2. Procesar cada alerta
    for (const alert of alerts) {
      try {
        // Verificar si ya paso suficiente tiempo desde la ultima verificacion
        if (alert.last_check) {
          const lastCheck = new Date(alert.last_check);
          const hoursSinceCheck =
            (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

          if (hoursSinceCheck < alert.frequency_hours) {
            continue; // Aun no toca verificar esta alerta
          }
        }

        alertsChecked++;

        // 3. Consultar SECOP con los filtros de la alerta
        const processes = await querySecop(alert.filters);
        const currentIds = processes
          .map((p) => p.id_del_proceso || "")
          .filter(Boolean);

        // 4. Detectar procesos nuevos
        const previousIds = new Set(alert.last_results_ids || []);
        const newIds = currentIds.filter((id) => !previousIds.has(id));

        // 5. Enviar push notification si hay procesos nuevos
        if (newIds.length > 0 && alert.profiles?.push_token) {
          const pushToken = alert.profiles.push_token;

          // Obtener detalles de los procesos nuevos para el body
          const newProcesses = processes.filter(
            (p) => p.id_del_proceso && newIds.includes(p.id_del_proceso)
          );
          const processLines = newProcesses.slice(0, 3).map(
            (p) => `• ${(p.nombre_del_procedimiento || p.entidad || "").substring(0, 60)}`
          );
          const extra = newIds.length > 3 ? `\n...y ${newIds.length - 3} más` : "";
          const body = processLines.join("\n") + extra;

          // Resumen compacto para el data payload (max ~4KB para APNs)
          const processSummaries = newProcesses.slice(0, 5).map((p) => ({
            id: p.id_del_proceso,
            nombre: (p.nombre_del_procedimiento || "").substring(0, 100),
            entidad: (p.entidad || "").substring(0, 80),
            precio: p.precio_base || null,
            fase: p.fase || null,
          }));

          const sent = await sendExpoPush(pushToken, {
            title: `${alert.name} — ${newIds.length} nuevo${newIds.length > 1 ? "s" : ""}`,
            body,
            data: {
              type: "alert_match",
              alertId: alert.id,
              newProcessIds: newIds.slice(0, 10),
              processSummaries,
            },
          });

          if (sent) {
            notificationsSent++;
          }

          // 6. Insertar en alert_history
          await supabase.from("alert_history").insert({
            alert_id: alert.id,
            user_id: alert.user_id,
            new_processes_count: newIds.length,
            new_processes_ids: newIds,
            notification_sent: sent,
          });
        }

        // 7. Actualizar resultados de la alerta
        await supabase
          .from("alerts")
          .update({
            last_check: now.toISOString(),
            last_results_count: currentIds.length,
            last_results_ids: currentIds,
          })
          .eq("id", alert.id);
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalAlerts: alerts.length,
          alertsChecked,
          notificationsSent,
          errors,
          durationMs: duration,
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error("check-alerts error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      { status: 500, headers }
    );
  }
});
