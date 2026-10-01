import React from 'react';
import { Cultivo } from '../types';
import {
  obtenerEstadoRiego,
  obtenerEstadoCosecha,
  formatearFechaEspanol,
  calcularProximoRiego,
  calcularDiferenciaDias,
  obtenerHoyISO,
} from '../utils/fechas';
import { Droplets, Calendar, Clock, Trash2, Sprout, Check } from 'lucide-react';

interface Props {
  cultivo: Cultivo;
  onRegar: (cultivoId: string, fecha: string) => void;
  onEliminar: (cultivoId: string) => void;
  onCosechar?: (cultivoId: string) => void;
  onReactivar?: (cultivoId: string) => void;
}

export const TarjetaCultivo: React.FC<Props> = ({
  cultivo,
  onRegar,
  onEliminar,
  onCosechar,
  onReactivar,
}) => {
  const hoyISO = obtenerHoyISO();
  const estadoRiego = obtenerEstadoRiego(cultivo.ultimoRiego, cultivo.frecuenciaRiegoDias);
  const estadoCosecha = obtenerEstadoCosecha(cultivo.fechaSiembra, cultivo.diasHastaCosecha);
  const proximoRiegoISO = calcularProximoRiego(cultivo.ultimoRiego, cultivo.frecuenciaRiegoDias);
  const yaRegadoHoy = cultivo.historialRiegos?.includes(hoyISO);
  const estaCosechado = Boolean(cultivo.cosechado);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4 hover:border-stone-700/80 transition-colors shadow-sm">
      {/* Cabecera de la tarjeta */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-stone-100">
              {cultivo.nombre}
            </h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              cultivo.tipoEspacio === 'maceta'
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
            }`}>
              {cultivo.tipoEspacio === 'maceta' ? '🪴 Maceta' : '🌱 Suelo'}
            </span>
          </div>

          <div className="text-xs text-stone-400 flex items-center gap-2">
            <span>Sembrado: {formatearFechaEspanol(cultivo.fechaSiembra)}</span>
            <span>·</span>
            <span>Riego cada {cultivo.frecuenciaRiegoDias} días</span>
          </div>
        </div>

        {/* Botón eliminar cultivo */}
        <button
          type="button"
          onClick={() => onEliminar(cultivo.id)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-rose-400 hover:bg-stone-800/80 rounded-xl transition-colors"
          title="Eliminar cultivo"
          aria-label={`Eliminar ${cultivo.nombre}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {cultivo.notas && (
        <p className="text-xs text-stone-400 italic bg-stone-950/40 px-3 py-1.5 rounded-lg border border-stone-800/60">
          «{cultivo.notas}»
        </p>
      )}

      {/* Si está cosechado, mostramos aviso especial y opción de reactivar */}
      {estaCosechado ? (
        <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-800/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>🌾</span>
              <span>¡Cultivo cosechado!</span>
            </span>
            <span className="text-[11px] text-stone-400">
              {cultivo.fechaCosechaReal ? formatearFechaEspanol(cultivo.fechaCosechaReal) : 'Completado'}
            </span>
          </div>
          <p className="text-xs text-stone-300">
            Ya no requiere riego en el calendario. Queda guardado en tu historial familiar.
          </p>
          {onReactivar && (
            <button
              type="button"
              onClick={() => onReactivar(cultivo.id)}
              className="min-h-[44px] w-full text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
            >
              Reactivar cultivo en el huerto
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Sección 1: Estado del Riego Consciente */}
          <div className="p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Control de Riego</span>
              </div>
              <span className="text-[11px] text-stone-400">
                Próximo: {formatearFechaEspanol(proximoRiegoISO)}
              </span>
            </div>

            <p className={`text-xs font-medium ${
              estadoRiego.color === 'rojo'
                ? 'text-rose-400'
                : estadoRiego.color === 'ambar'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {estadoRiego.mensajeDiagnostico}
            </p>

            {/* Botón táctil para regar */}
            <div className="pt-1">
              {yaRegadoHoy ? (
                <div className="min-h-[44px] w-full flex items-center justify-center gap-2 bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs font-semibold rounded-xl">
                  <Check className="w-4 h-4" />
                  <span>Regado hoy correctamente</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRegar(cultivo.id, hoyISO)}
                  className={`min-h-[44px] w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-xl transition-all ${
                    estadoRiego.necesitaRiegoHoy
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/40'
                      : 'bg-stone-700/80 hover:bg-stone-600 text-stone-200'
                  }`}
                >
                  <Droplets className="w-4 h-4" />
                  <span>{estadoRiego.necesitaRiegoHoy ? 'Regar hoy (toca según cálculo)' : 'Regar hoy (adelantar riego)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sección 2: Aviso del Día Estimado de Cosecha */}
          <div className="p-3.5 bg-stone-800/40 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Cosecha estimada:
              </span>
              <span className="font-semibold text-amber-300">
                {formatearFechaEspanol(estadoCosecha.fechaCosecha)}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${estadoCosecha.porcentajeProgreso}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>{estadoCosecha.mensaje}</span>
              <span className="font-semibold text-stone-300">{estadoCosecha.porcentajeProgreso}%</span>
            </div>

            {onCosechar && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onCosechar(cultivo.id)}
                  className="min-h-[40px] w-full flex items-center justify-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-xl transition-colors"
                >
                  <span>🌾</span>
                  <span>Marcar como cosechado</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
