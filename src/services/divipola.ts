// Servicio DIVIPOLA - División Político Administrativa de Colombia
// API: https://www.datos.gov.co/resource/xdk5-pm3f.json

const DIVIPOLA_API = "https://www.datos.gov.co/resource/xdk5-pm3f.json";

export interface DivipolaMunicipality {
  c_digo_dane_del_departamento: string;
  departamento: string;
  c_digo_dane_del_municipio: string;
  municipio: string;
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
      `${DIVIPOLA_API}?$select=departamento&$group=departamento&$order=departamento`
    );

    if (!response.ok) throw new Error("Error fetching departments");

    const data = await response.json();
    departmentsCache = data.map(
      (d: { departamento: string }) => d.departamento
    );
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
  // Check cache
  if (municipalitiesCache.has(departamento)) {
    return municipalitiesCache.get(departamento)!;
  }

  try {
    const encoded = encodeURIComponent(departamento);
    const response = await fetch(
      `${DIVIPOLA_API}?departamento=${encoded}&$order=municipio&$limit=500`
    );

    if (!response.ok) throw new Error("Error fetching municipalities");

    const data: DivipolaMunicipality[] = await response.json();
    const municipalities = data.map((m) => m.municipio);

    // Cache result
    municipalitiesCache.set(departamento, municipalities);
    return municipalities;
  } catch (error) {
    console.error(`Error loading municipalities for ${departamento}:`, error);
    return FALLBACK_MUNICIPALITIES[departamento] || [];
  }
}

/**
 * Obtiene código DANE del municipio
 */
export async function getMunicipalityCode(
  departamento: string,
  municipio: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${DIVIPOLA_API}?departamento=${encodeURIComponent(
        departamento
      )}&municipio=${encodeURIComponent(municipio)}&$limit=1`
    );

    if (!response.ok) return null;

    const data: DivipolaMunicipality[] = await response.json();
    return data[0]?.c_digo_dane_del_municipio || null;
  } catch {
    return null;
  }
}

/**
 * Busca municipios por nombre (útil para autocompletado)
 */
export async function searchMunicipalities(
  query: string
): Promise<DivipolaMunicipality[]> {
  try {
    const response = await fetch(
      `${DIVIPOLA_API}?$where=upper(municipio) like upper('%${query}%')&$order=municipio&$limit=20`
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
// FALLBACK DATA (offline/error)
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
    "TURBO",
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
  SANTANDER: [
    "BUCARAMANGA",
    "FLORIDABLANCA",
    "GIRÓN",
    "PIEDECUESTA",
    "BARRANCABERMEJA",
  ],
  TOLIMA: ["IBAGUÉ", "ESPINAL", "MELGAR"],
  "VALLE DEL CAUCA": [
    "CALI",
    "BUENAVENTURA",
    "PALMIRA",
    "TULUÁ",
    "CARTAGO",
    "BUGA",
  ],
};

export default {
  getDepartments,
  getMunicipalities,
  getMunicipalityCode,
  searchMunicipalities,
  clearCache,
};
