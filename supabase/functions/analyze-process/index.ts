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
    const { process: processData } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

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
      }), // Aquí faltaba cerrar el stringify y el objeto fetch
    });

    const result = await response.json();

    if (!response.ok) throw new Error("Error en la API de Google");

    let aiText = result.candidates[0].content.parts[0].text;

    // LIMPIEZA ROBUSTA
    const firstBracket = aiText.indexOf("{");
    const lastBracket = aiText.lastIndexOf("}");

    if (firstBracket !== -1 && lastBracket !== -1) {
      aiText = aiText.substring(firstBracket, lastBracket + 1);
    }

    const parsedAnalysis = JSON.parse(aiText);

    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error crítico:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
