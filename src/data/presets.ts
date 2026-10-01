import { PresetCultivo } from '../types';

/**
 * Catálogo de cultivos populares para huerto familiar y macetas.
 * Proporciona valores predeterminados confiables para que la familia
 * no tenga que adivinar los tiempos de cosecha ni la frecuencia de riego.
 */
export const PRESETS_CULTIVOS: PresetCultivo[] = [
  {
    nombre: 'Tomate Cherry',
    icono: '🍅',
    diasHastaCosecha: 80,
    frecuenciaMacetaDias: 2,
    frecuenciaHuertoDias: 3,
    consejoRiego: 'Regar al pie de la planta sin mojar las hojas para prevenir hongos. En maceta el sustrato se seca antes.',
  },
  {
    nombre: 'Lechuga',
    icono: '🥬',
    diasHastaCosecha: 45,
    frecuenciaMacetaDias: 2,
    frecuenciaHuertoDias: 3,
    consejoRiego: 'Raíces superficiales. Necesita humedad constante pero nunca encharcamiento.',
  },
  {
    nombre: 'Albahaca',
    icono: '🌿',
    diasHastaCosecha: 55,
    frecuenciaMacetaDias: 2,
    frecuenciaHuertoDias: 3,
    consejoRiego: 'Si las hojas caen levemente, pide agua. Evitá regar al mediodía bajo sol fuerte.',
  },
  {
    nombre: 'Zanahoria',
    icono: '🥕',
    diasHastaCosecha: 90,
    frecuenciaMacetaDias: 3,
    frecuenciaHuertoDias: 4,
    consejoRiego: 'Riego profundo y espaciado para que la raíz baje a buscar agua y crezca recta.',
  },
  {
    nombre: 'Espinaca',
    icono: '🍃',
    diasHastaCosecha: 40,
    frecuenciaMacetaDias: 2,
    frecuenciaHuertoDias: 3,
    consejoRiego: 'Tolera semisombra. Mantener fresco el sustrato para evitar que florezca antes de tiempo.',
  },
  {
    nombre: 'Rabanito',
    icono: '🌱',
    diasHastaCosecha: 28,
    frecuenciaMacetaDias: 2,
    frecuenciaHuertoDias: 3,
    consejoRiego: 'Ciclo ultra rápido. Si sufre sequía se vuelve amargo y picante; regar con regularidad.',
  },
  {
    nombre: 'Frutilla / Fresa',
    icono: '🍓',
    diasHastaCosecha: 70,
    frecuenciaMacetaDias: 2,
    frecuenciaHuertoDias: 3,
    consejoRiego: 'Cuidado con mojar la fruta en maduración. Riego moderado constante.',
  },
  {
    nombre: 'Pimiento / Morón',
    icono: '🫑',
    diasHastaCosecha: 85,
    frecuenciaMacetaDias: 3,
    frecuenciaHuertoDias: 4,
    consejoRiego: 'Sensible al exceso de agua que asfixia raíces. Regar solo cuando la superficie esté seca.',
  },
];
