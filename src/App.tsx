import React, { useState, useEffect } from 'react';
import { Cultivo } from './types';
import { cargarCultivos, guardarCultivos } from './utils/storage';
import { obtenerHoyISO, obtenerEstadoRiego, obtenerEstadoCosecha } from './utils/fechas';
import { FormularioCultivo } from './components/FormularioCultivo';
import { CalendarioRiego } from './components/CalendarioRiego';
import { AvisosCosecha } from './components/AvisosCosecha';
import { TarjetaCultivo } from './components/TarjetaCultivo';
import {
  Sprout,
  Calendar,
  Sparkles,
  Plus,
  Droplets,
  HeartHandshake,
  CheckCircle2,
  Info,
} from 'lucide-react';

type TabActiva = 'cultivos' | 'calendario' | 'cosecha';

export default function App() {
  const hoyISO = obtenerHoyISO();

  // Estado principal de la lista de cultivos
  const [cultivos, setCultivos] = useState<Cultivo[]>(() => cargarCultivos());

  // Pestaña activa en la interfaz
  const [tabActiva, setTabActiva] = useState<TabActiva>('cultivos');

  // Control de apertura del modal de registro
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState<boolean>(false);

  // Mensaje de notificación tipo toast para confirmación táctil en móvil
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Sincronización en LocalStorage ante cada cambio de cultivos
  useEffect(() => {
    guardarCultivos(cultivos);
  }, [cultivos]);

  const mostrarToast = (mensaje: string) => {
    setNotificacion(mensaje);
    setTimeout(() => {
      setNotificacion(null);
    }, 3200);
  };

  /**
   * 1. REGISTRAR CULTIVO CON FECHA DE SIEMBRA
   */
  const handleGuardarNuevoCultivo = (nuevo: Omit<Cultivo, 'id'>) => {
    const nuevoCultivo: Cultivo = {
      ...nuevo,
      id: `cultivo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setCultivos((prev) => [nuevoCultivo, ...prev]);
    setModalRegistroAbierto(false);
    mostrarToast(`¡Cultivo "${nuevoCultivo.nombre}" registrado con éxito!`);
  };

  /**
   * 2. REGISTRAR RIEGO (ACTUALIZA EL CALENDARIO Y PRÓXIMAS FECHAS)
   */
  const handleRegarCultivo = (cultivoId: string, fechaRiego: string) => {
    setCultivos((prev) =>
      prev.map((c) => {
        if (c.id !== cultivoId) return c;

        // Evitar duplicar la misma fecha en el historial
        const historialActual = c.historialRiegos || [];
        const nuevoHistorial = historialActual.includes(fechaRiego)
          ? historialActual
          : [...historialActual, fechaRiego].sort();

        // ⚠️ El último riego siempre debe ser la fecha más reciente registrada
        const fechaMasReciente = fechaRiego > c.ultimoRiego ? fechaRiego : c.ultimoRiego;

        return {
          ...c,
          ultimoRiego: fechaMasReciente,
          historialRiegos: nuevoHistorial,
        };
      })
    );

    const cultivoRegado = cultivos.find((c) => c.id === cultivoId);
    mostrarToast(`💧 Riego registrado para ${cultivoRegado?.nombre || 'el cultivo'}`);
  };

  /**
   * ELIMINAR CULTIVO
   */
  const handleEliminarCultivo = (cultivoId: string) => {
    const cultivo = cultivos.find((c) => c.id === cultivoId);
    if (!cultivo) return;

    const confirmado = window.confirm(`¿Querés eliminar el cultivo "${cultivo.nombre}"?`);
    if (confirmado) {
      setCultivos((prev) => prev.filter((c) => c.id !== cultivoId));
      mostrarToast(`Cultivo "${cultivo.nombre}" eliminado`);
    }
  };

  // Contadores para resumen rápido familiar
  const cultivosQueNecesitanRiegoHoy = cultivos.filter(
    (c) => obtenerEstadoRiego(c.ultimoRiego, c.frecuenciaRiegoDias).necesitaRiegoHoy
  ).length;

  const cosechasProximas = cultivos.filter((c) => {
    const estado = obtenerEstadoCosecha(c.fechaSiembra, c.diasHastaCosecha);
    return estado.diasRestantes <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-24 sm:pb-12">
      {/* Notificación flotante táctil (Toast) */}
      {notificacion && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Top Bar Contract (3 zonas) */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Zona 1: Brand title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-950">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-stone-100">
            Siembra
          </span>
        </div>

        {/* Zona 2: Nav links desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-400">
          <button
            type="button"
            onClick={() => setTabActiva('cultivos')}
            className={`transition-colors min-h-[44px] flex items-center ${
              tabActiva === 'cultivos' ? 'text-emerald-400 font-semibold' : 'hover:text-stone-200'
            }`}
          >
            Mis Cultivos ({cultivos.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('calendario')}
            className={`transition-colors min-h-[44px] flex items-center ${
              tabActiva === 'calendario' ? 'text-emerald-400 font-semibold' : 'hover:text-stone-200'
            }`}
          >
            Calendario de Riego
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('cosecha')}
            className={`transition-colors min-h-[44px] flex items-center ${
              tabActiva === 'cosecha' ? 'text-emerald-400 font-semibold' : 'hover:text-stone-200'
            }`}
          >
            Avisos de Cosecha
          </button>
        </nav>

        {/* Zona 3: Botón de acción principal */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalRegistroAbierto(true)}
            className="min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo cultivo</span>
            <span className="sm:hidden">Cultivo</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-6">
        {/* Cabecera de bienvenida con el propósito anti-riego por costumbre */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
              Huerto familiar inteligente
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
              <strong>Regar por costumbre marchita raíces:</strong> regamos solo por necesidad calculada según el cultivo, maceta o huerto.
            </p>
          </div>

          {/* Tarjetas rápidas de estado familiar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-center min-w-[85px]">
              <span className="block text-lg font-bold text-cyan-400 tabular-nums">
                {cultivosQueNecesitanRiegoHoy}
              </span>
              <span className="text-[10px] text-stone-400">Riegos hoy</span>
            </div>

            <div className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-center min-w-[85px]">
              <span className="block text-lg font-bold text-amber-400 tabular-nums">
                {cosechasProximas}
              </span>
              <span className="text-[10px] text-stone-400">Cosechas próx.</span>
            </div>

            <div className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-center min-w-[85px]">
              <span className="block text-lg font-bold text-emerald-400 tabular-nums">
                {cultivos.length}
              </span>
              <span className="text-[10px] text-stone-400">Total plantas</span>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación en móvil / controles segmentados */}
        <div className="md:hidden flex items-center p-1 bg-stone-900 border border-stone-800 rounded-xl">
          <button
            type="button"
            onClick={() => setTabActiva('cultivos')}
            className={`flex-1 min-h-[44px] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tabActiva === 'cultivos'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Cultivos</span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('calendario')}
            className={`flex-1 min-h-[44px] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tabActiva === 'calendario'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario</span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('cosecha')}
            className={`flex-1 min-h-[44px] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tabActiva === 'cosecha'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cosecha</span>
          </button>
        </div>

        {/* VISTA 1: MIS CULTIVOS (Registro + Listado con Riego y Cosecha) */}
        {tabActiva === 'cultivos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-100">
                  Cultivos de la familia
                </h2>
                <p className="text-xs text-stone-400">
                  Registrá cada siembra para tener su fecha de cosecha y días de riego exactos.
                </p>
              </div>
            </div>

            {cultivos.length === 0 ? (
              <div className="text-center py-16 px-4 bg-stone-900 border border-stone-800 rounded-3xl space-y-4">
                <div className="w-14 h-14 bg-stone-800 rounded-2xl flex items-center justify-center mx-auto text-stone-500">
                  <Sprout className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-semibold text-stone-200">
                    Tu huerto está esperando
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Registrá tu primer cultivo con su fecha de siembra para ver el calendario de riego y la estimación de cosecha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalRegistroAbierto(true)}
                  className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar primer cultivo</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cultivos.map((cultivo) => (
                  <TarjetaCultivo
                    key={cultivo.id}
                    cultivo={cultivo}
                    onRegar={handleRegarCultivo}
                    onEliminar={handleEliminarCultivo}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: CALENDARIO DE RIEGO POR CULTIVO */}
        {tabActiva === 'calendario' && (
          <CalendarioRiego
            cultivos={cultivos}
            onRegarCultivo={handleRegarCultivo}
          />
        )}

        {/* VISTA 3: AVISO DEL DÍA ESTIMADO DE COSECHA */}
        {tabActiva === 'cosecha' && (
          <AvisosCosecha cultivos={cultivos} />
        )}
      </main>

      {/* Modal de Registro de Cultivo */}
      {modalRegistroAbierto && (
        <FormularioCultivo
          onGuardar={handleGuardarNuevoCultivo}
          onCerrar={() => setModalRegistroAbierto(false)}
        />
      )}

      {/* Barra de navegación fija inferior para celulares (Thumb Zone Ergonómica) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 grid grid-cols-3 h-16 items-center px-2">
        <button
          type="button"
          onClick={() => setTabActiva('cultivos')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            tabActiva === 'cultivos' ? 'text-emerald-400 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Sprout className="w-5 h-5" />
          <span className="text-[10px] mt-1">Cultivos</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('calendario')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            tabActiva === 'calendario' ? 'text-emerald-400 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1">Calendario</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('cosecha')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            tabActiva === 'cosecha' ? 'text-emerald-400 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-1">Cosechas</span>
        </button>
      </nav>
    </div>
  );
}
