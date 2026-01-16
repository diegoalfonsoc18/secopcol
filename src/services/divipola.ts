// src/services/divipola.ts
// Servicio DIVIPOLA - División Político Administrativa de Colombia
// API: https://www.datos.gov.co/resource/gdxc-w37w.json (1,122 municipios)

const DIVIPOLA_API = "https://www.datos.gov.co/resource/gdxc-w37w.json";

export interface DivipolaMunicipality {
  cod_dpto: string;
  dpto: string;
  cod_mpio: string;
  nom_mpio: string;
  tipo_municipio: string;
  longitud: string;
  latitud: string;
}

// Cache en memoria
let departmentsCache: string[] | null = null;
let municipalitiesCache: Map<string, string[]> = new Map();

/**
 * Obtiene todos los departamentos de Colombia
 */
export async function getDepartments(): Promise<string[]> {
  if (departmentsCache) return departmentsCache;

  try {
    const response = await fetch(
      `${DIVIPOLA_API}?$select=dpto&$group=dpto&$order=dpto`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return FALLBACK_DEPARTMENTS;

    const data: { dpto: string }[] = await response.json();
    departmentsCache = data.map((d) => d.dpto);
    return departmentsCache;
  } catch (error) {
    console.error("Error loading departments:", error);
    return FALLBACK_DEPARTMENTS;
  }
}

/**
 * Obtiene los municipios de un departamento
 */
export async function getMunicipalities(
  departamento: string
): Promise<string[]> {
  if (municipalitiesCache.has(departamento)) {
    return municipalitiesCache.get(departamento)!;
  }

  try {
    const response = await fetch(
      `${DIVIPOLA_API}?dpto=${encodeURIComponent(
        departamento
      )}&$select=nom_mpio&$order=nom_mpio`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return FALLBACK_MUNICIPALITIES[departamento] || [];

    const data: { nom_mpio: string }[] = await response.json();
    const municipalities = data.map((m) => m.nom_mpio);
    municipalitiesCache.set(departamento, municipalities);
    return municipalities;
  } catch (error) {
    console.error(`Error loading municipalities for ${departamento}:`, error);
    return FALLBACK_MUNICIPALITIES[departamento] || [];
  }
}

/**
 * Busca municipios por texto
 */
export async function searchMunicipalities(
  query: string
): Promise<DivipolaMunicipality[]> {
  try {
    const response = await fetch(
      `${DIVIPOLA_API}?$where=upper(nom_mpio) like upper('%25${encodeURIComponent(
        query
      )}%25')&$order=nom_mpio&$limit=20`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Limpia la caché
 */
export function clearCache(): void {
  departmentsCache = null;
  municipalitiesCache.clear();
}

// ============================================
// FALLBACK DATA
// ============================================
const FALLBACK_DEPARTMENTS = [
  "AMAZONAS",
  "ANTIOQUIA",
  "ARAUCA",
  "ATLÁNTICO",
  "BOGOTÁ, D.C.",
  "BOLÍVAR",
  "BOYACÁ",
  "CALDAS",
  "CAQUETÁ",
  "CASANARE",
  "CAUCA",
  "CESAR",
  "CHOCÓ",
  "CÓRDOBA",
  "CUNDINAMARCA",
  "GUAINÍA",
  "GUAVIARE",
  "HUILA",
  "LA GUAJIRA",
  "MAGDALENA",
  "META",
  "NARIÑO",
  "NORTE DE SANTANDER",
  "PUTUMAYO",
  "QUINDÍO",
  "RISARALDA",
  "SAN ANDRÉS Y PROVIDENCIA",
  "SANTANDER",
  "SUCRE",
  "TOLIMA",
  "VALLE DEL CAUCA",
  "VAUPÉS",
  "VICHADA",
];

const FALLBACK_MUNICIPALITIES: Record<string, string[]> = {
  ANTIOQUIA: [
    "MEDELLÍN",
    "BELLO",
    "ITAGÜÍ",
    "ENVIGADO",
    "APARTADÓ",
    "RIONEGRO",
  ],
  ATLÁNTICO: ["BARRANQUILLA", "SOLEDAD", "MALAMBO", "SABANALARGA"],
  "BOGOTÁ, D.C.": ["BOGOTÁ, D.C."],
  BOLÍVAR: ["CARTAGENA DE INDIAS", "MAGANGUÉ", "TURBACO"],
  BOYACÁ: ["TUNJA", "DUITAMA", "SOGAMOSO", "CHIQUINQUIRÁ"],
  CALDAS: ["MANIZALES", "LA DORADA", "CHINCHINÁ"],
  CUNDINAMARCA: [
    "SOACHA",
    "FACATATIVÁ",
    "ZIPAQUIRÁ",
    "CHÍA",
    "FUSAGASUGÁ",
    "GIRARDOT",
    "TOCANCIPÁ",
  ],
  HUILA: ["NEIVA", "PITALITO", "GARZÓN"],
  META: ["VILLAVICENCIO", "ACACÍAS", "GRANADA"],
  NARIÑO: ["PASTO", "TUMACO", "IPIALES"],
  "NORTE DE SANTANDER": ["CÚCUTA", "OCAÑA", "PAMPLONA"],
  QUINDÍO: ["ARMENIA", "CALARCÁ", "MONTENEGRO"],
  RISARALDA: ["PEREIRA", "DOSQUEBRADAS", "SANTA ROSA DE CABAL"],
  SANTANDER: ["BUCARAMANGA", "FLORIDABLANCA", "GIRÓN", "BARRANCABERMEJA"],
  TOLIMA: ["IBAGUÉ", "ESPINAL", "MELGAR"],
  "VALLE DEL CAUCA": ["CALI", "BUENAVENTURA", "PALMIRA", "TULUÁ", "CARTAGO"],
};

export default {
  getDepartments,
  getMunicipalities,
  searchMunicipalities,
  clearCache,
};
