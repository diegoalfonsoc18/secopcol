import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const processData = body?.process;

    // Validar input
    if (!processData || !processData.descripcion) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Datos del proceso incompletos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Servicio de análisis no disponible",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analiza esta licitación de Colombia y responde ÚNICAMENTE con un objeto JSON válido.
            Entidad: ${processData.entidad || "No especificada"}
            Descripción: ${processData.descripcion}

            Formato de salida requerido (JSON):
            {
              "resumen": "string",
              "requisitos": {
                "experiencia": "string",
                "otros": ["string"]
              },
              "fechas_clave": {
                "fecha_limite": "string o null",
                "fecha_visita": "string o null",
                "otras_fechas": ["string"]
              },
              "recomendaciones": ["string"]
            }`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al comunicarse con el servicio de IA",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();

    // Validar respuesta de Gemini
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      console.error("Gemini returned empty response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "El servicio de IA no generó una respuesta válida",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // LIMPIEZA ROBUSTA: extraer JSON del texto
    const firstBracket = aiText.indexOf("{");
    const lastBracket = aiText.lastIndexOf("}");

    if (firstBracket === -1 || lastBracket === -1) {
      console.error("No JSON found in Gemini response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No se pudo procesar la respuesta del análisis",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jsonText = aiText.substring(firstBracket, lastBracket + 1);
    const parsedAnalysis = JSON.parse(jsonText);

    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    // No exponer detalles internos al cliente
    const message =
      error instanceof SyntaxError
        ? "Error al procesar la respuesta del análisis"
        : "Error interno del servidor";

    console.error("analyze-process error:", error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
