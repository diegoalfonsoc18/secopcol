// Servicio DIVIPOLA - División Político Administrativa de Colombia
// API: https://www.datos.gov.co/resource/gdxc-w37w.json (1,122 municipios)
// Campos: cod_dpto, dpto, cod_mpio, nom_mpio, tipo_municipio, longitud, latitud

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
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log("DIVIPOLA API error, usando fallback");
      return FALLBACK_DEPARTMENTS;
    }

    const data: { dpto: string }[] = await response.json();
    departmentsCache = data.map((d) => d.dpto);
    console.log(
      `✅ ${departmentsCache.length} departamentos cargados de DIVIPOLA`
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
    const response = await fetch(
      `${DIVIPOLA_API}?dpto=${encodeURIComponent(
        departamento
      )}&$select=nom_mpio&$order=nom_mpio`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log(`DIVIPOLA API error para ${departamento}, usando fallback`);
      return FALLBACK_MUNICIPALITIES[departamento] || [];
    }

    const data: { nom_mpio: string }[] = await response.json();
    const municipalities = data.map((m) => m.nom_mpio);

    // Cache result
    municipalitiesCache.set(departamento, municipalities);
    console.log(
      `✅ ${municipalities.length} municipios cargados para ${departamento}`
    );
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
        headers: {
          Accept: "application/json",
        },
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
// FALLBACK DATA (cuando la API falla)
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
    "CAUCASIA",
  ],
  ATLÁNTICO: ["BARRANQUILLA", "SOLEDAD", "MALAMBO", "SABANALARGA", "GALAPA"],
  "BOGOTÁ, D.C.": ["BOGOTÁ, D.C."],
  BOLÍVAR: ["CARTAGENA DE INDIAS", "MAGANGUÉ", "TURBACO", "ARJONA"],
  BOYACÁ: ["TUNJA", "DUITAMA", "SOGAMOSO", "CHIQUINQUIRÁ", "PAIPA"],
  CALDAS: ["MANIZALES", "LA DORADA", "CHINCHINÁ", "VILLAMARÍA"],
  CUNDINAMARCA: [
    "SOACHA",
    "FACATATIVÁ",
    "ZIPAQUIRÁ",
    "CHÍA",
    "FUSAGASUGÁ",
    "GIRARDOT",
    "MOSQUERA",
    "MADRID",
    "FUNZA",
    "TOCANCIPÁ",
    "CAJICÁ",
    "SOPÓ",
    "COTA",
    "LA CALERA",
  ],
  HUILA: ["NEIVA", "PITALITO", "GARZÓN", "LA PLATA"],
  META: ["VILLAVICENCIO", "ACACÍAS", "GRANADA", "PUERTO LÓPEZ"],
  NARIÑO: ["PASTO", "TUMACO", "IPIALES", "TÚQUERRES"],
  "NORTE DE SANTANDER": [
    "CÚCUTA",
    "OCAÑA",
    "PAMPLONA",
    "VILLA DEL ROSARIO",
    "LOS PATIOS",
  ],
  QUINDÍO: ["ARMENIA", "CALARCÁ", "MONTENEGRO", "LA TEBAIDA", "QUIMBAYA"],
  RISARALDA: ["PEREIRA", "DOSQUEBRADAS", "SANTA ROSA DE CABAL", "LA VIRGINIA"],
  SANTANDER: [
    "BUCARAMANGA",
    "FLORIDABLANCA",
    "GIRÓN",
    "PIEDECUESTA",
    "BARRANCABERMEJA",
    "SAN GIL",
  ],
  TOLIMA: ["IBAGUÉ", "ESPINAL", "MELGAR", "HONDA", "MARIQUITA"],
  "VALLE DEL CAUCA": [
    "CALI",
    "BUENAVENTURA",
    "PALMIRA",
    "TULUÁ",
    "CARTAGO",
    "BUGA",
    "JAMUNDÍ",
    "YUMBO",
  ],
};

export default {
  getDepartments,
  getMunicipalities,
  searchMunicipalities,
  clearCache,
};
