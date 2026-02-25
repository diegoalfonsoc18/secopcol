// Opciones compartidas para filtros de búsqueda y alertas
// Fuente única de verdad — usado por SearchScreen, AlertsScreen y FilterBottomSheet

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

// Todas las modalidades de contratación en SECOP II
export const MODALIDADES: FilterOption[] = [
  { id: "licitacion", label: "Licitación pública", value: "Licitación pública" },
  { id: "licitacion_amp", label: "Licitación Acuerdo Marco", value: "Licitación Pública Acuerdo Marco de Precios" },
  { id: "licitacion_obra", label: "Licitación Obra Pública", value: "Licitación pública Obra Publica" },
  { id: "directa", label: "Contratación directa", value: "Contratación directa" },
  { id: "directa_ofertas", label: "Directa (con ofertas)", value: "Contratación Directa (con ofertas)" },
  { id: "minima", label: "Mínima cuantía", value: "Mínima cuantía" },
  { id: "abreviada", label: "Abreviada menor cuantía", value: "Selección Abreviada de Menor Cuantía" },
  { id: "abreviada_sin", label: "Abreviada sin manifestación", value: "Seleccion Abreviada Menor Cuantia Sin Manifestacion Interes" },
  { id: "subasta", label: "Subasta inversa", value: "Selección abreviada subasta inversa" },
  { id: "concurso", label: "Concurso de méritos", value: "Concurso de méritos abierto" },
  { id: "concurso_pre", label: "Concurso con precalificación", value: "Concurso de méritos con precalificación" },
  { id: "especial", label: "Régimen especial", value: "Contratación régimen especial" },
  { id: "especial_ofertas", label: "Régimen especial (con ofertas)", value: "Contratación régimen especial (con ofertas)" },
  { id: "enajenacion_sobre", label: "Enajenación sobre cerrado", value: "Enajenación de bienes con sobre cerrado" },
  { id: "enajenacion_subasta", label: "Enajenación subasta", value: "Enajenación de bienes con subasta" },
  { id: "info_proveedores", label: "Solicitud info proveedores", value: "Solicitud de información a los Proveedores" },
];

// Todos los tipos de contrato en SECOP II (mismos que onboarding/categorías)
export const TIPOS_CONTRATO: FilterOption[] = [
  { id: "obra", label: "Obra", value: "Obra" },
  { id: "servicios", label: "Servicios", value: "Prestación de servicios" },
  { id: "suministro", label: "Suministro", value: "Suministro" },
  { id: "consultoria", label: "Consultoría", value: "Consultoría" },
  { id: "compraventa", label: "Compraventa", value: "Compraventa" },
  { id: "interventoria", label: "Interventoría", value: "Interventoría" },
  { id: "arrendamiento", label: "Arrendamiento", value: "Arrendamiento" },
  { id: "concesion", label: "Concesión", value: "Concesión" },
  { id: "seguros", label: "Seguros", value: "Seguros" },
  { id: "comodato", label: "Comodato", value: "Comodato" },
];
