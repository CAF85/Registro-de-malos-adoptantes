/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Alerta, UserSession } from './types';
import Header from './components/Header';
import ListadoAlertas from './components/ListadoAlertas';
import FormAlerta from './components/FormAlerta';
import GuiaUsabilidad from './components/GuiaUsabilidad';
import DisclaimerModal from './components/DisclaimerModal';
import DashboardStats from './components/DashboardStats';
import { 
  fetchAlertas, 
  createAlerta, 
  getActiveSession, 
  isSupabaseConfigured 
} from './lib/supabase';
import { 
  Search, 
  PlusCircle, 
  BookOpen, 
  Check, 
  ShieldAlert, 
  Heart, 
  Sparkles, 
  Info,
  X,
  BarChart3,
  Unlock,
  Lock,
  Globe
} from 'lucide-react';

const DISCLAIMER_STORAGE_KEY = 'rmaa_disclaimer_accepted';

export default function App() {
  // Global Alertas State
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);

  // Authentication State
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // Disclaimer Acceptance State
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState<boolean>(false);
  
  // Successful submission alert modal state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successModalSubject, setSuccessModalSubject] = useState<string>('');
  
  // Tab State: 'listado' | 'nuevo' | 'dashboard' | 'guia'
  const [activeTab, setActiveTab] = useState<'listado' | 'nuevo' | 'dashboard' | 'guia'>('listado');
  
  // Custom Toast/Notification state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Initialize and load everything from database (Supabase or Fallback LocalStorage)
  const refreshAllData = async () => {
    setLoadingAlerts(true);
    try {
      // 1. Fetch Session
      const session = await getActiveSession();
      setUserSession(session);

      // 2. Fetch Alerts
      const items = await fetchAlertas();
      setAlertas(items);
    } catch (e) {
      console.error('Error refreshing alerts:', e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    // We want the disclaimer to appear on every page refresh, so we always start with false
    setIsDisclaimerAccepted(false);

    // Initial load
    refreshAllData();
  }, []);

  // Show auto-dismissing toast helper
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Add a new alert to global state and persist it (Cloud + Local Fallback)
  const handleAddAlerta = async (nuevaAlerta: Alerta) => {
    try {
      showToast('Guardando reporte y disparando copias por correo...', 'info');
      const saved = await createAlerta(nuevaAlerta);
      
      // Update state locally so UI updates instantly
      setAlertas(prev => [saved, ...prev]);
      
      // Switch back to search list
      setActiveTab('listado');
      
      // Show custom success modal and a success banner
      setSuccessModalSubject(nuevaAlerta.nombreSujeto);
      setShowSuccessModal(true);
      showToast(`La alerta para "${nuevaAlerta.nombreSujeto}" fue registrada de forma segura. Se ha enviado una copia a tu correo.`);
    } catch (err: any) {
      console.error('Error recording alert:', err);
      showToast('Error al registrar la alerta. Por favor reintenta.', 'info');
    }
  };

  const handleDisclaimerAccept = () => {
    setIsDisclaimerAccepted(true);
    showToast('Aviso legal aceptado. Bienvenido al portal centralizado.');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-gray-800 pb-16 antialiased" id="app-container">
      
      {/* 1. MANDATORY DISCLAIMER MODAL ON FIRST SESSION RUN */}
      {!isDisclaimerAccepted && (
        <DisclaimerModal onAccept={handleDisclaimerAccept} />
      )}

      {/* 2. SUCCESSFUL REGISTRATION POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="success-registration-modal">
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5 text-center animate-slide-up text-slate-800">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-black text-slate-950 tracking-tight uppercase">
                ¡Registro Exitoso!
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                La alerta para <strong className="text-slate-900">"{successModalSubject}"</strong> ha sido cargada y registrada satisfactoriamente en la base de datos de alertas preventivas.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-[11px] space-y-2 text-slate-600 leading-relaxed">
              <p>🛡️ <strong>Sincronización en la Nube:</strong> El registro preventivo ha sido almacenado de forma segura.</p>
              <p>📧 <strong>Notificación por Correo:</strong> Se ha despachado una copia con el folio sellado de tu reporte.</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide uppercase rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
              id="btn-close-success-modal"
            >
              Aceptar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* Top micro status bar / Legal notice */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 py-2.5 px-4 text-center flex flex-col sm:flex-row items-center justify-center gap-2 z-40 relative">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          La carga de estos datos no reemplaza la denuncia policial por maltrato.
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span>Uso restringido a Refugios y Rescatistas registrados.</span>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Elegant Header Statistics and Title */}
        <Header alertas={alertas} />

        {/* Custom Toast Notification Banner */}
        {toastMessage && (
          <div 
            className={`flex items-center justify-between p-4 rounded-xl border animate-fade-in shadow-md ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
            id="toast-notification"
          >
            <div className="flex items-center gap-3">
              <span className={`p-1.5 rounded-lg shrink-0 ${
                toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                <Check className="w-4 h-4" />
              </span>
              <p className="text-xs md:text-sm font-medium">{toastMessage.text}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs and Section Selector */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-2 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap gap-1.5">
            {/* Tab 1: Listado/Buscador */}
            <button
              onClick={() => setActiveTab('listado')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'listado'
                  ? 'bg-slate-950 text-white shadow-md shadow-slate-950/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/70'
              }`}
              id="tab-btn-listado"
            >
              <Search className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-indigo-500" />
              Consultar Registro
            </button>

            {/* Tab 2: Guías y Usabilidad */}
            <button
              onClick={() => setActiveTab('guia')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'guia'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
              }`}
              id="tab-btn-guia"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              Guías y Usabilidad
            </button>

            {/* Tab 3: Registrar Mal Adoptante */}
            <button
              onClick={() => setActiveTab('nuevo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'nuevo'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/15'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/60'
              }`}
              id="tab-btn-nuevo"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              Registrar Mal Adoptante 🚨
            </button>

            {/* Tab 4: Panel de Control & Estadísticas */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-950 text-white shadow-md shadow-slate-950/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/70'
              }`}
              id="tab-btn-dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              Estadísticas y Cuentas
            </button>
          </div>

          <div className="text-[11px] text-indigo-700 bg-indigo-50 font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 self-start md:self-auto font-mono">
            {isSupabaseConfigured ? (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Base de Datos: Supabase Activo</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Optimizado con Almacenamiento Seguro</span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic App Body depending on tab selection */}
        <main className="transition-all duration-200">
          
          {loadingAlerts ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center space-y-3 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-xs text-gray-500 font-medium">Sincronizando y cargando base de datos de alertas...</p>
            </div>
          ) : (
            <>
              {activeTab === 'listado' && (
                <ListadoAlertas 
                  alertas={alertas} 
                  userSession={userSession}
                  onSelectAlerta={(alerta) => {
                    showToast(`Abriendo expediente de ${alerta.nombreSujeto}...`, 'info');
                  }}
                  onOpenReportForm={() => setActiveTab('nuevo')}
                />
              )}

              {activeTab === 'nuevo' && (
                <FormAlerta 
                  onAddAlerta={handleAddAlerta}
                  onCancel={() => setActiveTab('listado')}
                  userSession={userSession}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardStats 
                  alertas={alertas}
                  userSession={userSession}
                  onLoginSuccess={(session) => {
                    setUserSession(session);
                    showToast(`Sesión iniciada con éxito. Rol: ${session.role === 'admin' ? 'Administrador' : 'Refugio Colaborador'}`);
                  }}
                  onLogoutSuccess={() => {
                    setUserSession(null);
                    showToast('Has cerrado tu sesión.');
                  }}
                  onRefreshData={refreshAllData}
                />
              )}

              {activeTab === 'guia' && (
                <GuiaUsabilidad />
              )}
            </>
          )}
        </main>

        {/* Footer info brand */}
        <footer className="pt-12 border-t border-gray-200 text-center space-y-3">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 font-medium">
            <span>Desarrollado con</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>para proteger a quienes no tienen voz.</span>
          </div>
          <p className="text-[10px] text-gray-400 max-w-xl mx-auto leading-relaxed font-mono">
            Registro de Malos Adoptantes y Maltratadores - Plataforma de resguardo. El ingreso de alertas no sustituye la denuncia penal formal (Ley Nacional de Protección Animal correspondiente).
          </p>
        </footer>

      </div>
    </div>
  );
}
