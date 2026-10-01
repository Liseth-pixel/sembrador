/**
 * Utilidades de fecha para Siembra.
 * 
 * ============================================================================
 * ⚠️ ATENCIÓN: PUNTOS CRÍTICOS DONDE LA MAYORÍA DE DESARROLLADORES SE EQUIVOCA:
 * ============================================================================
 * 1. DESFASE DE ZONA HORARIA (UTC vs LOCAL):
 *    Al hacer `new Date("2026-10-01")`, el estándar ECMAScript lo interpreta como medianoche UTC.
 *    En países de habla hispana en América (ej. UTC-3, UTC-5), `date.getDate()` devolverá
 *    el día anterior ("30 de septiembre") por el ajuste de huso horario local.
 *    Por eso, SIEMPRE desarmamos los componentes año-mes-día manualmente.
 * 
 * 2. CÁLCULO DE DÍAS TRANSCURRIDOS:
 *    Restar timestamps (`t2 - t1`) y dividir por `86400000` (24*60*60*1000) falla cuando hay
 *    cambio de horario de verano/invierno (días de 23 o 25 horas).
 *    Por eso normalizamos ambas fechas a mediodía local (12:00:00) antes del cálculo.
 * ============================================================================
 */

/**
 * Convierte un string 'YYYY-MM-DD' a un objeto Date en hora local (12:00:00 para evitar desvíos)
 */
export function parsearFechaLocal(fechaStr: string): Date {
  if (!fechaStr || !fechaStr.includes('-')) {
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    return hoy;
  }

  const [anioStr, mesStr, diaStr] = fechaStr.split('-');
  const anio = parseInt(anioStr, 10);
  const mes = parseInt(mesStr, 10) - 1; // ⚠️ En JS los meses van de 0 (Enero) a 11 (Diciembre)
  const dia = parseInt(diaStr, 10);

  // Configuramos a mediodía local (12:00 PM) para inmunizarnos contra horario de verano/invierno
  return new Date(anio, mes, dia, 12, 0, 0, 0);
}

/**
 * Convierte un objeto Date a string 'YYYY-MM-DD' seguro en hora local
 */
export function formatearFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Devuelve la fecha de hoy en formato 'YYYY-MM-DD' en hora local
 */
export function obtenerHoyISO(): string {
  return formatearFechaISO(new Date());
}

/**
 * Suma una cantidad de días a una fecha 'YYYY-MM-DD' y devuelve otra 'YYYY-MM-DD'.
 */
export function sumarDiasAFecha(fechaStr: string, diasASumar: number): string {
  const fecha = parsearFechaLocal(fechaStr);
  fecha.setDate(fecha.getDate() + diasASumar);
  return formatearFechaISO(fecha);
}

/**
 * Calcula la diferencia en días enteros entre dos fechas ('YYYY-MM-DD').
 * Resultado positivo si fechaFinal > fechaInicial.
 */
export function calcularDiferenciaDias(fechaInicialStr: string, fechaFinalStr: string): number {
  const f1 = parsearFechaLocal(fechaInicialStr);
  const f2 = parsearFechaLocal(fechaFinalStr);

  // Al estar ambas fijadas a las 12:00:00 local, la diferencia de milisegundos
  // dividida por 86,400,000 da exactamente los días sin desvíos por cambio de horario
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((f2.getTime() - f1.getTime()) / msPorDia);
}

/**
 * Calcula la fecha estimada de cosecha sumando los días de maduración a la fecha de siembra.
 */
export function calcularFechaCosecha(fechaSiembraStr: string, diasHastaCosecha: number): string {
  return sumarDiasAFecha(fechaSiembraStr, diasHastaCosecha);
}

/**
 * Calcula el próximo día de riego sumando la frecuencia de días al último riego realizado.
 */
export function calcularProximoRiego(ultimoRiegoStr: string, frecuenciaDias: number): string {
  return sumarDiasAFecha(ultimoRiegoStr, frecuenciaDias);
}

/**
 * Información amigable del estado de riego para evitar el riego compulsivo.
 */
export interface EstadoRiego {
  necesitaRiegoHoy: boolean;
  estaAtrasado: boolean;
  diasParaProximoRiego: number; // 0 = hoy, < 0 = atrasado, > 0 = faltan días
  proximaFechaRiego: string;
  mensajeDiagnostico: string;
  color: 'rojo' | 'ambar' | 'verde';
}

export function obtenerEstadoRiego(ultimoRiegoStr: string, frecuenciaDias: number): EstadoRiego {
  const hoyStr = obtenerHoyISO();
  const proximaFecha = calcularProximoRiego(ultimoRiegoStr, frecuenciaDias);
  const diasRestantes = calcularDiferenciaDias(hoyStr, proximaFecha);

  if (diasRestantes < 0) {
    const diasAtraso = Math.abs(diasRestantes);
    return {
      necesitaRiegoHoy: true,
      estaAtrasado: true,
      diasParaProximoRiego: diasRestantes,
      proximaFechaRiego: proximaFecha,
      mensajeDiagnostico: `Atrasado por ${diasAtraso} ${diasAtraso === 1 ? 'día' : 'días'}. Verificá si la tierra está seca y regá.`,
      color: 'rojo',
    };
  } else if (diasRestantes === 0) {
    return {
      necesitaRiegoHoy: true,
      estaAtrasado: false,
      diasParaProximoRiego: 0,
      proximaFechaRiego: proximaFecha,
      mensajeDiagnostico: '¡Toca regar hoy! Tocá la tierra: si los primeros 2 cm están secos, regá suavemente.',
      color: 'ambar',
    };
  } else {
    return {
      necesitaRiegoHoy: false,
      estaAtrasado: false,
      diasParaProximoRiego: diasRestantes,
      proximaFechaRiego: proximaFecha,
      mensajeDiagnostico: `Tierra con humedad suficiente. Próximo riego en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}. ¡No riegues por hábito!`,
      color: 'verde',
    };
  }
}

/**
 * Información del progreso y aviso estimado de cosecha.
 */
export interface EstadoCosecha {
  fechaCosecha: string;
  diasRestantes: number;
  diasTranscurridos: number;
  porcentajeProgreso: number; // 0 a 100
  mensaje: string;
  estado: 'madurando' | 'proxima' | 'lista';
}

export function obtenerEstadoCosecha(fechaSiembraStr: string, diasHastaCosecha: number): EstadoCosecha {
  const hoyStr = obtenerHoyISO();
  const fechaCosecha = calcularFechaCosecha(fechaSiembraStr, diasHastaCosecha);
  const diasRestantes = calcularDiferenciaDias(hoyStr, fechaCosecha);
  const diasTranscurridos = calcularDiferenciaDias(fechaSiembraStr, hoyStr);

  // Porcentaje acotado entre 0 y 100
  const porcentaje = Math.min(100, Math.max(0, Math.round((diasTranscurridos / diasHastaCosecha) * 100)));

  if (diasRestantes <= 0) {
    return {
      fechaCosecha,
      diasRestantes,
      diasTranscurridos,
      porcentajeProgreso: 100,
      mensaje: diasRestantes === 0 ? '¡Hoy es el día estimado de cosecha!' : `Cumplió su ciclo estimado hace ${Math.abs(diasRestantes)} días.`,
      estado: 'lista',
    };
  } else if (diasRestantes <= 7) {
    return {
      fechaCosecha,
      diasRestantes,
      diasTranscurridos,
      porcentajeProgreso: porcentaje,
      mensaje: `¡Cosecha inminente! Faltan solo ${diasRestantes} días.`,
      estado: 'proxima',
    };
  } else {
    return {
      fechaCosecha,
      diasRestantes,
      diasTranscurridos,
      porcentajeProgreso: porcentaje,
      mensaje: `Faltan aproximadamente ${diasRestantes} días para cosechar.`,
      estado: 'madurando',
    };
  }
}

/**
 * Formatea una fecha 'YYYY-MM-DD' a español de manera amigable (ej: "15 de oct. 2026")
 */
export function formatearFechaEspanol(fechaStr: string, incluirDiaSemana = false): string {
  const fecha = parsearFechaLocal(fechaStr);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  if (incluirDiaSemana) {
    const nombreDia = diasSemana[fecha.getDay()];
    return `${nombreDia} ${dia} de ${mes}, ${anio}`;
  }

  return `${dia} de ${mes}. ${anio}`;
}
