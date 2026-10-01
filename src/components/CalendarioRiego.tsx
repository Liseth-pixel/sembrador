import React, { useState, useMemo } from 'react';
import { Cultivo } from '../types';
import {
  parsearFechaLocal,
  formatearFechaISO,
  obtenerHoyISO,
  calcularProximoRiego,
  calcularDiferenciaDias,
  formatearFechaEspanol,
  obtenerEstadoRiego,
  calcularFechaCosecha,
} from '../utils/fechas';
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Sprout,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  cultivos: Cultivo[];
  onRegarCultivo: (cultivoId: string, fechaRiego: string) => void;
}

export const CalendarioRiego: React.FC<Props> = ({ cultivos, onRegarCultivo }) => {
  const hoyISO = obtenerHoyISO();
  const hoyDate = parsearFechaLocal(hoyISO);

  // Estado para el mes y año visibles en el calendario
  const [mesActual, setMesActual] = useState(hoyDate.getMonth());
  const [anioActual, setAnioActual] = useState(hoyDate.getFullYear());

  // Día seleccionado en el calendario (por defecto, hoy)
  const [diaSeleccionadoISO, setDiaSeleccionadoISO] = useState<string>(hoyISO);

  // Filtro de cultivo opcional
  const [filtroCultivoId, setFiltroCultivoId] = useState<string>('todos');

  // Nombres de los meses y días en español
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const navegarMes = (delta: number) => {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  const irAHoy = () => {
    setMesActual(hoyDate.getMonth());
    setAnioActual(hoyDate.getFullYear());
    setDiaSeleccionadoISO(hoyISO);
  };

  /**
   * Cultivos a evaluar según el filtro seleccionado
   */
  const cultivosFiltrados = useMemo(() => {
    if (filtroCultivoId === 'todos') return cultivos;
    return cultivos.filter((c) => c.id === filtroCultivoId);
  }, [cultivos, filtroCultivoId]);

  /**
   * ⚠️ CÁLCULO DE PROYECCIÓN DE RIEGOS EN EL MES:
   * Para cada cultivo, proyectamos hacia adelante y hacia atrás los días
   * en que le corresponde riego según su `frecuenciaRiegoDias`.
   * Esto permite ver el calendario predictivo para que la familia sepa
   * qué días regar y qué días descansar el huerto.
   */
  const mapaEventosPorDia = useMemo(() => {
    const mapa = new Map<string, {
      riegosProgramados: { cultivo: Cultivo }[];
      riegosEfectuados: { cultivo: Cultivo }[];
      siembras: { cultivo: Cultivo }[];
      cosechasEstimadas: { cultivo: Cultivo }[];
    }>();

    const getEntrada = (fechaISO: string) => {
      if (!mapa.has(fechaISO)) {
        mapa.set(fechaISO, {
          riegosProgramados: [],
          riegosEfectuados: [],
          siembras: [],
          cosechasEstimadas: [],
        });
      }
      return mapa.get(fechaISO)!;
    };

    // Evaluamos una ventana de 60 días antes y después del primer día del mes
    cultivosFiltrados.forEach((c) => {
      // 1. Siembras
      getEntrada(c.fechaSiembra).siembras.push({ cultivo: c });

      // 2. Cosechas estimadas
      const fechaCosecha = calcularFechaCosecha(c.fechaSiembra, c.diasHastaCosecha);
      getEntrada(fechaCosecha).cosechasEstimadas.push({ cultivo: c });

      // 3. Riegos pasados registrados
      c.historialRiegos?.forEach((fechaHist) => {
        getEntrada(fechaHist).riegosEfectuados.push({ cultivo: c });
      });

      // 4. Proyección de riegos futuros a partir del último riego
      // Proyectamos hasta 45 días hacia adelante
      let proxima = c.ultimoRiego;
      for (let i = 0; i < 15; i++) {
        proxima = calcularProximoRiego(proxima, c.frecuenciaRiegoDias);
        const entrada = getEntrada(proxima);
        // Evitamos duplicar si ya fue registrado como efectuado
        if (!c.historialRiegos?.includes(proxima)) {
          entrada.riegosProgramados.push({ cultivo: c });
        }
      }
    });

    return mapa;
  }, [cultivosFiltrados]);

  /**
   * Generación de la grilla de días del mes actual.
   * Tomamos en cuenta el día de inicio de semana (Lunes = 0 en formato europeo/latino).
   */
  const diasGrilla = useMemo(() => {
    // Primer día del mes
    const primerDia = new Date(anioActual, mesActual, 1, 12, 0, 0, 0);
    // Cantidad de días en el mes
    const ultimoDia = new Date(anioActual, mesActual + 1, 0, 12, 0, 0, 0);
    const totalDiasMes = ultimoDia.getDate();

    // 0 = Domingo, 1 = Lunes ... 6 = Sábado
    let diaInicioSemana = primerDia.getDay();
    // Convertir para que Lunes sea 0 y Domingo sea 6
    const offsetLunes = diaInicioSemana === 0 ? 6 : diaInicioSemana - 1;

    const celdas: { fechaISO: string; numeroDia: number; esMesActual: boolean }[] = [];

    // Días de relleno del mes anterior
    for (let i = offsetLunes - 1; i >= 0; i--) {
      const d = new Date(anioActual, mesActual, -i, 12, 0, 0, 0);
      celdas.push({
        fechaISO: formatearFechaISO(d),
        numeroDia: d.getDate(),
        esMesActual: false,
      });
    }

    // Días del mes en curso
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const d = new Date(anioActual, mesActual, dia, 12, 0, 0, 0);
      celdas.push({
        fechaISO: formatearFechaISO(d),
        numeroDia: dia,
        esMesActual: true,
      });
    }

    // Días de relleno del mes siguiente para completar la fila
    const resto = celdas.length % 7;
    if (resto !== 0) {
      const faltantes = 7 - resto;
      for (let dia = 1; dia <= faltantes; dia++) {
        const d = new Date(anioActual, mesActual + 1, dia, 12, 0, 0, 0);
        celdas.push({
          fechaISO: formatearFechaISO(d),
          numeroDia: dia,
          esMesActual: false,
        });
      }
    }

    return celdas;
  }, [mesActual, anioActual]);

  // Información del día seleccionado
  const eventosDiaSeleccionado = mapaEventosPorDia.get(diaSeleccionadoISO);

  return (
    <div className="space-y-4">
      {/* Mensaje de conciencia sobre el riego */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-800 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
          <Droplets className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-stone-100">
            Regar por necesidad, no por costumbre
          </h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Las macetas y huertos suelen morir por exceso de agua. 
            El calendario calcula los días necesarios según el cultivo y espacio. 
            <strong> Siempre tocá la tierra antes de regar:</strong> si notas humedad en los primeros 2 cm, esperá al próximo turno.
          </p>
        </div>
      </div>

      {/* Selector de filtro por cultivo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFiltroCultivoId('todos')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
            filtroCultivoId === 'todos'
              ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200'
              : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
          }`}
        >
          Todos los cultivos ({cultivos.length})
        </button>
        {cultivos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFiltroCultivoId(c.id)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0 flex items-center gap-1.5 ${
              filtroCultivoId === c.id
                ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
            }`}
          >
            <span>{c.tipoEspacio === 'maceta' ? '🪴' : '🌱'}</span>
            <span>{c.nombre}</span>
          </button>
        ))}
      </div>

      {/* Contenedor del Calendario */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Cabecera del mes con navegación táctil */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-stone-100">
              {nombresMeses[mesActual]} {anioActual}
            </h2>
            {diaSeleccionadoISO !== hoyISO && (
              <button
                type="button"
                onClick={irAHoy}
                className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700 transition-colors"
              >
                Hoy
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navegarMes(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navegarMes(1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leyenda rápida */}
        <div className="px-4 py-2 bg-stone-950/40 border-b border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400 overflow-x-auto scrollbar-none gap-3">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span>Riego programado</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>Ya regado</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Cosecha est.</span>
          </div>
        </div>

        {/* Encabezado de días de la semana */}
        <div className="grid grid-cols-7 border-b border-stone-800/80 text-center py-2 text-xs font-semibold text-stone-500">
          {diasSemana.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Grilla mensual de días */}
        <div className="grid grid-cols-7 gap-px bg-stone-800/40">
          {diasGrilla.map(({ fechaISO, numeroDia, esMesActual }) => {
            const esHoy = fechaISO === hoyISO;
            const esSeleccionado = fechaISO === diaSeleccionadoISO;
            const eventos = mapaEventosPorDia.get(fechaISO);

            const tieneRiegoProgramado = (eventos?.riegosProgramados.length ?? 0) > 0;
            const tieneRiegoEfectuado = (eventos?.riegosEfectuados.length ?? 0) > 0;
            const tieneCosecha = (eventos?.cosechasEstimadas.length ?? 0) > 0;
            const tieneSiembra = (eventos?.siembras.length ?? 0) > 0;

            return (
              <button
                key={fechaISO}
                type="button"
                onClick={() => setDiaSeleccionadoISO(fechaISO)}
                className={`min-h-[58px] sm:min-h-[68px] p-1 flex flex-col justify-between items-center transition-colors relative ${
                  esSeleccionado
                    ? 'bg-emerald-950/70 ring-2 ring-emerald-500 z-10'
                    : esMesActual
                    ? 'bg-stone-900 hover:bg-stone-800/70'
                    : 'bg-stone-900/40 text-stone-600 hover:bg-stone-900/60'
                }`}
              >
                {/* Número del día */}
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                    esHoy
                      ? 'bg-emerald-500 text-white font-bold'
                      : esMesActual
                      ? 'text-stone-300'
                      : 'text-stone-600'
                  }`}
                >
                  {numeroDia}
                </div>

                {/* Indicadores visuales de puntos */}
                <div className="flex items-center gap-1 justify-center flex-wrap max-w-full px-0.5 my-1">
                  {tieneRiegoProgramado && (
                    <span
                      title="Riego programado"
                      className="w-2 h-2 rounded-full bg-cyan-400"
                    />
                  )}
                  {tieneRiegoEfectuado && (
                    <span
                      title="Riego efectuado"
                      className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                  )}
                  {tieneCosecha && (
                    <span
                      title="Cosecha estimada"
                      className="w-2 h-2 rounded-full bg-amber-400"
                    />
                  )}
                  {tieneSiembra && (
                    <span
                      title="Día de siembra"
                      className="text-[10px] leading-none"
                    >
                      🌱
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
              Día seleccionado
            </span>
            <h3 className="text-base font-semibold text-stone-100 flex items-center gap-2">
              <span>{formatearFechaEspanol(diaSeleccionadoISO, true)}</span>
              {diaSeleccionadoISO === hoyISO && (
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  Hoy
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Lista de cultivos y su estado respecto al día */}
        {cultivosFiltrados.length === 0 ? (
          <p className="text-xs text-stone-400 py-2">
            No hay cultivos registrados en esta vista.
          </p>
        ) : (
          <div className="space-y-3">
            {cultivosFiltrados.map((cultivo) => {
              const estado = obtenerEstadoRiego(cultivo.ultimoRiego, cultivo.frecuenciaRiegoDias);
              const proximoRiegoISO = calcularProximoRiego(cultivo.ultimoRiego, cultivo.frecuenciaRiegoDias);
              const correspondeRegarHoy = proximoRiegoISO === diaSeleccionadoISO || (diaSeleccionadoISO === hoyISO && estado.necesitaRiegoHoy);
              const yaRegadoEsteDia = cultivo.historialRiegos?.includes(diaSeleccionadoISO);

              return (
                <div
                  key={cultivo.id}
                  className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-100">
                        {cultivo.nombre}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        ({cultivo.tipoEspacio === 'maceta' ? '🪴 Maceta' : '🌱 Suelo'})
                      </span>
                    </div>

                    <div className="text-xs text-stone-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Riego: cada {cultivo.frecuenciaRiegoDias} días</span>
                      <span>·</span>
                      <span>Último: {formatearFechaEspanol(cultivo.ultimoRiego)}</span>
                      <span>·</span>
                      <span className="text-cyan-300">
                        Próximo: {formatearFechaEspanol(proximoRiegoISO)}
                      </span>
                    </div>

                    {diaSeleccionadoISO === hoyISO && (
                      <p className={`text-xs mt-1 font-medium ${
                        estado.color === 'rojo' 
                          ? 'text-rose-400' 
                          : estado.color === 'ambar' 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`}>
                        {estado.mensajeDiagnostico}
                      </p>
                    )}
                  </div>

                  {/* Botón de acción para registrar riego */}
                  <div className="shrink-0 flex items-center gap-2">
                    {yaRegadoEsteDia ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-2 rounded-xl min-h-[44px]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Regado este día</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRegarCultivo(cultivo.id, diaSeleccionadoISO)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                          correspondeRegarHoy
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/30'
                            : 'bg-stone-700/80 hover:bg-stone-600 text-stone-200'
                        }`}
                      >
                        <Droplets className="w-4 h-4" />
                        <span>Registrar riego {diaSeleccionadoISO === hoyISO ? 'hoy' : 'en esta fecha'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
