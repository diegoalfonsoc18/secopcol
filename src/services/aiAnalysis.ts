import { supabase } from "./supabase";
import { SecopProcess } from "../types/index";

export interface AnalysisResult {
  resumen: string;
  requisitos: {
    documentos: string[];
    experiencia: string | null;
    capacidad_financiera: string | null;
    otros: string[];
  };
  fechas_clave: {
    fecha_limite: string | null;
    fecha_visita: string | null;
    otras_fechas: string[];
  };
  valor_estimado: string | null;
  recomendaciones: string[];
}

export const analyzeProcess = async (
  process: SecopProcess
): Promise<AnalysisResult> => {
  const { data, error } = await supabase.functions.invoke("analyze-process", {
    body: {
      process: {
        id_del_proceso: process.id_del_proceso,
        descripcion: process.descripci_n_del_procedimiento,
        entidad: process.entidad,
        tipo_de_contrato: process.tipo_de_contrato,
        modalidad: process.modalidad_de_contratacion,
        precio_base: process.precio_base,
      },
    },
  });

  if (error) {
    console.error("Error analyzing process:", error);
    throw new Error(error.message);
  }

  if (!data.success) {
    throw new Error(data.error || "Error desconocido");
  }

  return data.analysis;
};
