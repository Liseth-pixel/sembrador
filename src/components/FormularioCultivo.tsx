import React, { useState } from 'react';
import { Cultivo, TipoEspacio } from '../types';
import { PRESETS_CULTIVOS } from '../data/presets';
import { obtenerHoyISO, sumarDiasAFecha, calcularFechaCosecha, formatearFechaEspanol } from '../utils/fechas';
import { Sprout, Calendar, Droplets, Clock, X, Info } from 'lucide-react';

interface Props {
  onGuardar: (cultivo: Omit<Cultivo, 'id'>) => void;
  onCerrar: () => void;
}

export const FormularioCultivo: React.FC<Props> = ({ onGuardar, onCerrar }) => {
  const hoy = obtenerHoyISO();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [tipoEspacio, setTipoEspacio] = useState<TipoEspacio>('maceta');
  const [fechaSiembra, setFechaSiembra] = useState(hoy);
  const [diasHastaCosecha, setDiasHastaCosecha] = useState<number>(60);
  const [frecuenciaRiegoDias, setFrecuenciaRiegoDias] = useState<number>(2);
  const [ultimoRiego, setUltimoRiego] = useState(hoy);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Al seleccionar un preset predefinido, autocompletamos con datos agronómicos
   * reales ajustados al espacio (maceta vs suelo directo).
   */
  const handleSeleccionarPreset = (presetNombre: string) => {
    const preset = PRESETS_CULTIVOS.find((p) => p.nombre === presetNombre);
    if (!preset) return;

    setNombre(preset.nombre);
    setDiasHastaCosecha(preset.diasHastaCosecha);
    const frecuencia = tipoEspacio === 'maceta' ? preset.frecuenciaMacetaDias : preset.frecuenciaHuertoDias;
    setFrecuenciaRiegoDias(frecuencia);
  };

  /**
   * Al cambiar el tipo de espacio, si el cultivo coincide con un preset,
   * adaptamos la recomendación de riego porque el sustrato de maceta se seca antes.
   */
  const handleCambiarEspacio = (nuevoEspacio: TipoEspacio) => {
    setTipoEspacio(nuevoEspacio);
    const preset = PRESETS_CULTIVOS.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (preset) {
      setFrecuenciaRiegoDias(nuevoEspacio === 'maceta' ? preset.frecuenciaMacetaDias : preset.frecuenciaHuertoDias);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ⚠️ VALIDACIÓN PREVENTIVA: Asegurar que el nombre no esté vacío y los números sean válidos
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('Por favor indicá el nombre del cultivo (ej: Tomate, Albahaca).');
      return;
    }

    if (!fechaSiembra) {
      setError('La fecha de siembra es obligatoria.');
      return;
    }

    if (diasHastaCosecha <= 0) {
      setError('Los días hasta cosecha deben ser mayores a 0.');
      return;
    }

    if (frecuenciaRiegoDias <= 0) {
      setError('La frecuencia de riego debe ser de al menos 1 día.');
      return;
    }

    // Guardado exitoso
    onGuardar({
      nombre: nombreLimpio,
      tipoEspacio,
      fechaSiembra,
      frecuenciaRiegoDias,
      diasHastaCosecha,
      ultimoRiego: ultimoRiego || fechaSiembra,
      historialRiegos: ultimoRiego ? [ultimoRiego] : [fechaSiembra],
      notas: notas.trim() || undefined,
    });
  };

  const fechaCosechaEstimada = calcularFechaCosecha(fechaSiembra, diasHastaCosecha);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div 
        className="w-full sm:max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              Registrar nuevo cultivo
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Cálculo de riego consciente y fecha estimada de cosecha
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario scrolleable optimizado para pulgar móvil */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Presets rápidos */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-2">
              Cultivos sugeridos para la familia (o escribí el tuyo):
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PRESETS_CULTIVOS.map((p) => (
                <button
                  key={p.nombre}
                  type="button"
                  onClick={() => handleSeleccionarPreset(p.nombre)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border shrink-0 transition-colors min-h-[44px] flex items-center gap-1.5 ${
                    nombre.toLowerCase() === p.nombre.toLowerCase()
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:border-stone-500'
                  }`}
                >
                  <span>{p.icono}</span>
                  <span>{p.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre del cultivo */}
          <div>
            <label htmlFor="nombre-cultivo" className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Nombre de la planta *
            </label>
            <input
              id="nombre-cultivo"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Tomates perita, Albahaca limón, Menta..."
              className="w-full h-12 px-4 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 text-sm"
              required
            />
          </div>

          {/* Ubicación: Maceta vs Huerto en tierra */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              ¿Dónde está plantado?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCambiarEspacio('maceta')}
                className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  tipoEspacio === 'maceta'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                    : 'bg-stone-800/60 border-stone-700 text-stone-300 hover:border-stone-600'
                }`}
              >
                <span>🪴</span>
                <span>En Maceta (seca más rápido)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCambiarEspacio('huerto')}
                className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  tipoEspacio === 'huerto'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                    : 'bg-stone-800/60 border-stone-700 text-stone-300 hover:border-stone-600'
                }`}
              >
                <span>🌱</span>
                <span>En Suelo / Huerto</span>
              </button>
            </div>
          </div>

          {/* Fecha de Siembra */}
          <div>
            <label htmlFor="fecha-siembra" className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
              <span>Fecha de siembra o trasplante *</span>
              <span className="text-[11px] font-normal text-stone-500">
                {formatearFechaEspanol(fechaSiembra)}
              </span>
            </label>
            <div className="relative">
              <input
                id="fecha-siembra"
                type="date"
                value={fechaSiembra}
                max={sumarDiasAFecha(hoy, 30)}
                onChange={(e) => setFechaSiembra(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Punto de partida para el cálculo de crecimiento y cosecha.
            </p>
          </div>

          {/* Frecuencia de Riego en días */}
          <div className="p-3.5 bg-stone-800/50 rounded-2xl border border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="frecuencia-dias" className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Frecuencia de riego (por necesidad)
              </label>
              <span className="text-sm font-bold text-cyan-200">
                Cada {frecuenciaRiegoDias} {frecuenciaRiegoDias === 1 ? 'día' : 'días'}
              </span>
            </div>
            <input
              id="frecuencia-dias"
              type="range"
              min={1}
              max={10}
              value={frecuenciaRiegoDias}
              onChange={(e) => setFrecuenciaRiegoDias(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 h-2 bg-stone-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Diario (1 día)</span>
              <span>Cada 3 días</span>
              <span>Cada 7 días</span>
              <span>Cada 10 días</span>
            </div>
            <p className="text-[11px] text-stone-400 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                Regar por costumbre ahoga las raíces. Ajustamos el aviso según la necesidad de la planta.
              </span>
            </p>
          </div>

          {/* Días hasta cosecha y previsualización */}
          <div className="p-3.5 bg-stone-800/50 rounded-2xl border border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="dias-cosecha" className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Días de ciclo hasta cosecha
              </label>
              <span className="text-sm font-bold text-amber-200">
                {diasHastaCosecha} días
              </span>
            </div>
            <input
              id="dias-cosecha"
              type="range"
              min={15}
              max={180}
              step={5}
              value={diasHastaCosecha}
              onChange={(e) => setDiasHastaCosecha(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-2 bg-stone-700 rounded-lg cursor-pointer"
            />
            <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-800 text-xs flex items-center justify-between">
              <span className="text-stone-400">Cosecha estimada:</span>
              <span className="font-semibold text-amber-300">
                {formatearFechaEspanol(fechaCosechaEstimada)}
              </span>
            </div>
          </div>

          {/* Último riego realizado */}
          <div>
            <label htmlFor="ultimo-riego" className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              ¿Cuándo se regó por última vez?
            </label>
            <input
              id="ultimo-riego"
              type="date"
              value={ultimoRiego}
              max={hoy}
              onChange={(e) => setUltimoRiego(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notas-cultivo" className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Notas familiares (opcional)
            </label>
            <input
              id="notas-cultivo"
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Maceta en la ventana de la cocina, le da sol de mañana."
              className="w-full h-12 px-4 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 pb-6 sm:pb-2 flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 h-12 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              Guardar cultivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
