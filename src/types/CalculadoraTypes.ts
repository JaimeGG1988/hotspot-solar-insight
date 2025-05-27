
// Enums
export enum TipoEntradaConsumo {
  ANUAL = 'anual',
  MENSUAL = 'mensual',
  CSV = 'csv'
}

export enum PerfilUsuario {
  RESIDENCIAL_DEFECTO = 'residencial_defecto',
  RESIDENCIAL_TELETRABAJO = 'residencial_teletrabajo',
  RESIDENCIAL_FIN_SEMANA = 'residencial_fin_semana'
}

export enum Orientacion {
  SUR = 'sur',
  SURESTE = 'sureste',
  SUROESTE = 'suroeste',
  ESTE = 'este',
  OESTE = 'oeste'
}

export enum UnidadCoste {
  EUROS_TOTAL = 'euros_total',
  EUROS_POR_WP = 'euros_por_wp'
}

// Interfaces
export interface ConsumosMensuales {
  enero: number;
  febrero: number;
  marzo: number;
  abril: number;
  mayo: number;
  junio: number;
  julio: number;
  agosto: number;
  septiembre: number;
  octubre: number;
  noviembre: number;
  diciembre: number;
}

export interface CosteItem {
  valor: number;
  unidad: UnidadCoste;
}

export interface DatosConsumo {
  tipoEntrada: TipoEntradaConsumo;
  consumoAnual?: number;
  consumosMensuales?: ConsumosMensuales;
  perfilUsuario?: PerfilUsuario;
  tieneVE: boolean;
  tieneBombaCalor: boolean;
  nombreArchivoCSV?: string;
}

export interface DatosInstalacion {
  ubicacion: string;
  latitud: number;
  longitud: number;
  orientacion: Orientacion;
  inclinacion: number;
}

export interface DatosTecnicos {
  potenciaPicoRecomendada?: number;
  potenciaInversorRecomendada?: number;
  potenciaModulo: number;
  cantidadModulos: number;
  potenciaPicoFinal: number;
  potenciaInversorFinal: number;
}

export interface DatosEconomicos {
  precioElectricidad: number;
  costeModulos: CosteItem;
  costeInversor: CosteItem;
  costeEstructura: CosteItem;
  costeAuxiliares: CosteItem;
  costeManoObra: CosteItem;
}

export interface Resultados {
  potenciaPicoInstalada_kWp: number;
  potenciaInversor_kW: number;
  produccionAnualEstimada_kWh: number;
  porcentajeCoberturaFV: number;
  ahorroEconomicoAnual_eur: number;
  costeTotalInstalacion_eur: number;
  periodoRetornoInversion_anios?: number;
}

export interface CalculadoraData {
  consumo: DatosConsumo;
  instalacion: DatosInstalacion;
  tecnico: DatosTecnicos;
  economico: DatosEconomicos;
  resultados?: Resultados;
}

export const defaultCalculadoraData: CalculadoraData = {
  consumo: {
    tipoEntrada: TipoEntradaConsumo.ANUAL,
    tieneVE: false,
    tieneBombaCalor: false,
    perfilUsuario: PerfilUsuario.RESIDENCIAL_DEFECTO
  },
  instalacion: {
    ubicacion: '',
    latitud: 40.4168,
    longitud: -3.7038,
    orientacion: Orientacion.SUR,
    inclinacion: 30
  },
  tecnico: {
    potenciaModulo: 450,
    cantidadModulos: 10,
    potenciaPicoFinal: 4.5,
    potenciaInversorFinal: 4.0
  },
  economico: {
    precioElectricidad: 0.25,
    costeModulos: { valor: 0.35, unidad: UnidadCoste.EUROS_POR_WP },
    costeInversor: { valor: 0.15, unidad: UnidadCoste.EUROS_POR_WP },
    costeEstructura: { valor: 0.20, unidad: UnidadCoste.EUROS_POR_WP },
    costeAuxiliares: { valor: 0.10, unidad: UnidadCoste.EUROS_POR_WP },
    costeManoObra: { valor: 0.30, unidad: UnidadCoste.EUROS_POR_WP }
  }
};
