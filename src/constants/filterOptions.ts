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
  { id: "subasta_prueba", label: "Subasta de prueba", value: "Subasta de prueba" },
  { id: "info_proveedores", label: "Solicitud info proveedores", value: "Solicitud de información a los Proveedores" },
];

// Todos los tipos de contrato en SECOP II
export const TIPOS_CONTRATO: FilterOption[] = [
  { id: "servicios", label: "Prestación de servicios", value: "Prestación de servicios" },
  { id: "decreto092", label: "Decreto 092 de 2017", value: "Decreto 092 de 2017" },
  { id: "suministros", label: "Suministros", value: "Suministros" },
  { id: "otro", label: "Otro", value: "Otro" },
  { id: "compraventa", label: "Compraventa", value: "Compraventa" },
  { id: "obra", label: "Obra", value: "Obra" },
  { id: "arrendamiento_inmuebles", label: "Arrendamiento inmuebles", value: "Arrendamiento de inmuebles" },
  { id: "seguros", label: "Seguros", value: "Seguros" },
  { id: "interventoria", label: "Interventoría", value: "Interventoría" },
  { id: "consultoria", label: "Consultoría", value: "Consultoría" },
  { id: "comodato", label: "Comodato", value: "Comodato" },
  { id: "acuerdo_marco", label: "Acuerdo Marco de Precios", value: "Acuerdo Marco de Precios" },
  { id: "arrendamiento_muebles", label: "Arrendamiento muebles", value: "Arrendamiento de muebles" },
  { id: "servicios_financieros", label: "Servicios financieros", value: "Servicios financieros" },
  { id: "venta_muebles", label: "Venta muebles", value: "Venta muebles" },
  { id: "concesion", label: "Concesión", value: "Concesión" },
  { id: "credito_publico", label: "Operaciones de Crédito Público", value: "Operaciones de Crédito Público" },
  { id: "app", label: "Asociación Público Privada", value: "Asociación Público Privada" },
  { id: "fiduciario", label: "Negocio fiduciario", value: "Negocio fiduciario" },
  { id: "venta_inmuebles", label: "Venta inmuebles", value: "Venta inmuebles" },
  { id: "comision", label: "Comisión", value: "Comisión" },
  { id: "cooperacion", label: "Acuerdo de cooperación", value: "Acuerdo de cooperación" },
  { id: "emprestito", label: "Empréstito", value: "Empréstito" },
];
