import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SECOP_API = "https://www.datos.gov.co/api/views/p6dx-8zbt/rows.json";
const APP_TOKEN = Deno.env.get("SECOP_APP_TOKEN");

serve(async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const url = new URL(req.url);
    const municipio = url.searchParams.get("municipio");
    const status = url.searchParams.get("status");
    const keyword = url.searchParams.get("keyword");
    const limit = url.searchParams.get("limit") || "10";

    console.log("🔍 Buscando:", { municipio, status, keyword, limit });

    let where = "";
    if (municipio) {
      where = `contains(upper(ciudad_entidad), upper('${municipio}'))`;
    }
    if (status) {
      if (where) where += " AND ";
      where += `upper(fase)=upper('${status}')`;
    }
    if (keyword) {
      if (where) where += " AND ";
      where += `contains(upper(nombre_del_procedimiento), upper('${keyword}'))`;
    }

    let apiUrl = `${SECOP_API}?$limit=${limit}&$order=fecha_de_publicacion_del DESC`;
    if (where) apiUrl += `&$where=${encodeURIComponent(where)}`;

    console.log("📡 Conectando a SECOP...");

    const response = await fetch(apiUrl, {
      headers: {
        "X-App-Token": APP_TOKEN || "",
        Accept: "application/json",
      },
    });

    console.log("📊 SECOP status:", response.status);

    if (!response.ok) {
      throw new Error(`SECOP HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ SECOP respondió: ${data.length} procesos`);

    return new Response(
      JSON.stringify({
        success: true,
        count: Array.isArray(data) ? data.length : 0,
        data: Array.isArray(data) ? data.slice(0, parseInt(limit)) : [],
      }),
      { headers }
    );
  } catch (error) {
    console.error("❌ Error en search:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers }
    );
  }
});
