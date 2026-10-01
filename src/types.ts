/**
 * Definición de tipos para la aplicación Siembra.
 * Diseñado específicamente para familias con huertos caseros o macetas.
 */

export type TipoEspacio = 'maceta' | 'huerto';

export interface Cultivo {
  id: string;
  nombre: string;
  tipoEspacio: TipoEspacio;
  /**
   * Fecha de siembra en formato ISO 'YYYY-MM-DD'.
   * OJO: Usar string 'YYYY-MM-DD' en lugar de objetos Date completos
   * previene errores de desfase de zona horaria (UTC vs Local) al guardar en LocalStorage.
   */
  fechaSiembra: string;
  
  /**
   * Intervalo de días recomendado entre riegos (ej: cada 2 días en maceta, cada 4 días en suelo).
   */
  frecuenciaRiegoDias: number;

  /**
   * Cantidad estimada de días desde la siembra hasta que el cultivo está listo para cosechar.
   */
  diasHastaCosecha: number;

  /**
   * Fecha del último riego realizado ('YYYY-MM-DD').
   */
  ultimoRiego: string;

  /**
   * Historial de fechas en las que se regó ('YYYY-MM-DD').
   */
  historialRiegos: string[];

  /**
   * Notas opcionales de la familia (ej: "Macetón de terracota en el patio").
   */
  notas?: string;
}

export interface PresetCultivo {
  nombre: string;
  icono: string;
  diasHastaCosecha: number;
  frecuenciaMacetaDias: number;
  frecuenciaHuertoDias: number;
  consejoRiego: string;
}
