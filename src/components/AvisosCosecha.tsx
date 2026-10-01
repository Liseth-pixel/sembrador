import React from 'react';
import { Cultivo } from '../types';
import {
  obtenerEstadoCosecha,
  formatearFechaEspanol,
  calcularDiferenciaDias,
  obtenerHoyISO,
} from '../utils/fechas';
import { Sparkles, Calendar, Clock, CheckCircle, Sprout, AlertTriangle } from 'lucide-react';

interface Props {
  cultivos: Cultivo[];
  onSeleccionarCultivo?: (cultivoId: string) => void;
  onCosechar?: (cultivoId: string) => void;
}

export const AvisosCosecha: React.FC<Props> = ({ cultivos, onCosechar }) => {
  const hoyISO = obtenerHoyISO();

  // Filtrar activos y cosechados
  const activos = cultivos.filter((c) => !c.cosechado);
  const cosechados = cultivos.filter((c) => Boolean(c.cosechado));

  // Ordenamos los cultivos activos por proximidad de cosecha (los más cercanos primero)
  const activosOrdenados = [...activos].sort((a, b) => {
    const estadoA = obtenerEstadoCosecha(a.fechaSiembra, a.diasHastaCosecha);
    const estadoB = obtenerEstadoCosecha(b.fechaSiembra, b.diasHastaCosecha);
    return estadoA.diasRestantes - estadoB.diasRestantes;
  });

  return (
    <div className="space-y-4">
      {/* Banner de propósito */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-950/70 border border-amber-800 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-stone-100">
            Avisos de cosecha estimada
          </h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Calculado automáticamente según la fecha de siembra y el ciclo de maduración. 
            Te permite planificar las comidas familiares y cosechar en el punto óptimo de sabor sin dejar que las plantas se pasen.
          </p>
        </div>
      </div>

      {cultivos.length === 0 ? (
        <div className="text-center py-12 px-4 bg-stone-900 border border-stone-800 rounded-2xl">
          <p className="text-sm text-stone-400">
            Aún no has registrado ningún cultivo. Registrá uno para ver su fecha estimada de cosecha.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activosOrdenados.map((cultivo) => {
            const estadoCosecha = obtenerEstadoCosecha(cultivo.fechaSiembra, cultivo.diasHastaCosecha);
            const diasDesdeSiembra = Math.max(0, calcularDiferenciaDias(cultivo.fechaSiembra, hoyISO));

            const esLista = estadoCosecha.estado === 'lista';
            const esProxima = estadoCosecha.estado === 'proxima';

            return (
              <div
                key={cultivo.id}
                className={`bg-stone-900 border rounded-2xl p-4 sm:p-5 transition-all ${
                  esLista
                    ? 'border-amber-500/80 shadow-lg shadow-amber-950/20'
                    : esProxima
                    ? 'border-amber-600/50'
                    : 'border-stone-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-stone-100">
                        {cultivo.nombre}
                      </span>
                      <span className="text-xs text-stone-400">
                        · {cultivo.tipoEspacio === 'maceta' ? '🪴 Maceta' : '🌱 Suelo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>Sembrado el {formatearFechaEspanol(cultivo.fechaSiembra)}</span>
                      <span>·</span>
                      <span>{diasDesdeSiembra} días de crecimiento</span>
                    </div>
                  </div>

                  {/* Estado destacado */}
                  <div className="shrink-0">
                    {esLista ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>¡Lista para cosechar!</span>
                      </div>
                    ) : esProxima ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>Faltan {estadoCosecha.diasRestantes} días</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Faltan {estadoCosecha.diasRestantes} días</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fecha exacta y barra de progreso */}
                <div className="pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      Día estimado de cosecha:
                    </span>
                    <span className="font-semibold text-amber-300 text-sm">
                      {formatearFechaEspanol(estadoCosecha.fechaCosecha, true)}
                    </span>
                  </div>

                  {/* Barra de progreso de maduración */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          esLista
                            ? 'bg-amber-400'
                            : esProxima
                            ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${estadoCosecha.porcentajeProgreso}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Siembra ({cultivo.diasHastaCosecha} días de ciclo)</span>
                      <span>{estadoCosecha.porcentajeProgreso}% completado</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800/60 leading-relaxed">
                    💡 <strong>Diagnóstico:</strong> {estadoCosecha.mensaje}
                  </p>

                  {/* Botón para cosechar si está listo o próximo */}
                  {onCosechar && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onCosechar(cultivo.id)}
                        className={`min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all ${
                          esLista
                            ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-950/30 font-bold'
                            : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{esLista ? '¡Cosechar hoy y guardar en historial!' : 'Cosechar anticipadamente'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Historial de cosechados guardados en localStorage */}
          {cosechados.length > 0 && (
            <div className="pt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <span>🌾</span>
                <span>Cultivos cosechados ({cosechados.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cosechados.map((c) => (
                  <div key={c.id} className="p-3.5 bg-stone-900/60 border border-stone-800/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-200">{c.nombre}</span>
                      <span className="text-[11px] text-amber-400 font-medium">Cosechado</span>
                    </div>
                    <div className="text-xs text-stone-500 flex items-center gap-2">
                      <span>Sembrado: {formatearFechaEspanol(c.fechaSiembra)}</span>
                      {c.fechaCosechaReal && (
                        <>
                          <span>·</span>
                          <span>Recolectado: {formatearFechaEspanol(c.fechaCosechaReal)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
