import { Cultivo } from '../types';
import { obtenerHoyISO, sumarDiasAFecha } from './fechas';

const STORAGE_KEY = 'siembra_cultivos_v1';

/**
 * Datos iniciales para que la aplicación muestre valor desde el primer segundo.
 * ⚠️ ATENCIÓN: Las fechas se generan dinámicamente relativas a hoy para que
 * quien pruebe la app nunca vea fechas estáticas del año pasado.
 */
function generarCultivosIniciales(): Cultivo[] {
  const hoy = obtenerHoyISO();
  
  return [
    {
      id: 'demo-1',
      nombre: 'Tomate Cherry',
      tipoEspacio: 'maceta',
      // Sembrado hace 20 días
      fechaSiembra: sumarDiasAFecha(hoy, -20),
      frecuenciaRiegoDias: 2,
      diasHastaCosecha: 80,
      // Último riego hace 2 días (¡toca regar hoy!)
      ultimoRiego: sumarDiasAFecha(hoy, -2),
      historialRiegos: [sumarDiasAFecha(hoy, -4), sumarDiasAFecha(hoy, -2)],
      notas: 'Maceta grande de 20L en el balcón soleado.',
    },
    {
      id: 'demo-2',
      nombre: 'Lechuga Criolla',
      tipoEspacio: 'huerto',
      // Sembrada hace 35 días (¡cosecha en 10 días!)
      fechaSiembra: sumarDiasAFecha(hoy, -35),
      frecuenciaRiegoDias: 3,
      diasHastaCosecha: 45,
      // Regada ayer (¡no regar hoy, tierra húmeda!)
      ultimoRiego: sumarDiasAFecha(hoy, -1),
      historialRiegos: [sumarDiasAFecha(hoy, -4), sumarDiasAFecha(hoy, -1)],
      notas: 'Cantero norte del huerto con compost casero.',
    },
    {
      id: 'demo-3',
      nombre: 'Albahaca Genovesa',
      tipoEspacio: 'maceta',
      // Sembrada hace 50 días (¡cosecha inminente en 5 días!)
      fechaSiembra: sumarDiasAFecha(hoy, -50),
      frecuenciaRiegoDias: 2,
      diasHastaCosecha: 55,
      // Regada hoy
      ultimoRiego: hoy,
      historialRiegos: [sumarDiasAFecha(hoy, -2), hoy],
      notas: 'Junto a los tomates para repeler plagas.',
    },
  ];
}

/**
 * Lee los cultivos desde LocalStorage con manejo defensivo de errores
 * (JSON corrupto o almacenamiento deshabilitado en navegadores estrictos).
 */
export function cargarCultivos(): Cultivo[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const iniciales = generarCultivosIniciales();
      guardarCultivos(iniciales);
      return iniciales;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return generarCultivosIniciales();
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return generarCultivosIniciales();
  }
}

/**
 * Guarda los cultivos en LocalStorage
 */
export function guardarCultivos(cultivos: Cultivo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cultivos));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}
