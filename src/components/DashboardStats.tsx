/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Alerta, EmailLog, UserSession } from '../types';
import { 
  computeStatistics, 
  getEmailLogs, 
  loginUser, 
  registerUser, 
  logoutUser, 
  isSupabaseConfigured,
  ADMINISTRATOR_EMAIL
} from '../lib/supabase';
import { 
  BarChart3, 
  Map, 
  Users, 
  Mail, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  LogOut, 
  FileSpreadsheet, 
  UserPlus, 
  LogIn,
  AlertOctagon,
  Eye,
  X,
  Search,
  Globe,
  RefreshCw,
  Send,
  MapPin,
  Info,
  ListFilter,
  ChevronRight
} from 'lucide-react';

interface DashboardStatsProps {
  alertas: Alerta[];
  userSession: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogoutSuccess: () => void;
  onRefreshData: () => void;
}

export default function DashboardStats({ 
  alertas, 
  userSession, 
  onLoginSuccess, 
  onLogoutSuccess,
  onRefreshData
}: DashboardStatsProps) {
  
  // Tab states inside Dashboard: 'stats' | 'profiles' | 'emails' | 'auth'
  const [activeTab, setActiveTab] = useState<'stats' | 'profiles' | 'emails' | 'auth'>('stats');

  // Auth Forms States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerRefugio, setRegisterRefugio] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Email viewing state
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);

  // Profiles Search state
  const [profileSearch, setProfileSearch] = useState('');

  // Interactive Province selection state
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [pinnedProvince, setPinnedProvince] = useState<string | null>(null);

  // Province-localities detailed table state
  const [tableSearch, setTableSearch] = useState('');
  const [tableProvinceFilter, setTableProvinceFilter] = useState('TODAS');

  // Helper to parse localidad into province & neighborhood/locality
  const parseLocalidad = (localidadStr: string) => {
    const parts = (localidadStr || '').split(',').map(p => p.trim()).filter(Boolean);
    let provincia = 'Sin especificar';
    let barrioLocalidad = 'Sin especificar';
    
    if (parts.length >= 3) {
      barrioLocalidad = parts[0];
      provincia = parts[1];
    } else if (parts.length === 2) {
      const p1Lower = parts[1].toLowerCase();
      const isCountry = ['argentina', 'españa', 'espana', 'uruguay', 'chile', 'méxico', 'mexico', 'colombia'].includes(p1Lower);
      if (isCountry) {
        provincia = parts[0];
        barrioLocalidad = parts[0];
      } else {
        barrioLocalidad = parts[0];
        provincia = parts[1];
      }
    } else if (parts.length === 1) {
      barrioLocalidad = parts[0];
      provincia = parts[0];
    }
    return { provincia, barrioLocalidad };
  };

  // Group all alerts by Province and their nested Neighborhoods/Jurisdictions
  const provinceMap: { [key: string]: { count: number; jurisdictionsMap: { [key: string]: { count: number; alerts: Alerta[] } } } } = {};
  
  alertas.forEach(alerta => {
    const { provincia, barrioLocalidad } = parseLocalidad(alerta.localidad);
    if (!provinceMap[provincia]) {
      provinceMap[provincia] = { count: 0, jurisdictionsMap: {} };
    }
    provinceMap[provincia].count++;
    
    if (!provinceMap[provincia].jurisdictionsMap[barrioLocalidad]) {
      provinceMap[provincia].jurisdictionsMap[barrioLocalidad] = { count: 0, alerts: [] };
    }
    provinceMap[provincia].jurisdictionsMap[barrioLocalidad].count++;
    provinceMap[provincia].jurisdictionsMap[barrioLocalidad].alerts.push(alerta);
  });

  const provinceStats = Object.entries(provinceMap).map(([province, details]) => {
    const jurisdictions = Object.entries(details.jurisdictionsMap).map(([name, jurDetails]) => ({
      name,
      count: jurDetails.count,
      alerts: jurDetails.alerts
    })).sort((a, b) => b.count - a.count);
    return {
      province,
      count: details.count,
      jurisdictions
    };
  }).sort((a, b) => b.count - a.count);

  // Active province for neighborhood detailing (on hover, on pin, or fallback to first one)
  const activeProvinceName = hoveredProvince || pinnedProvince || (provinceStats[0]?.province || null);
  const activeProvinceData = provinceStats.find(p => p.province === activeProvinceName);

  // Compute stats dynamically from active alerts list

  // Compute stats dynamically from active alerts list
  const stats = computeStatistics(alertas);
  const emailLogs = getEmailLogs();

  // Flatten and search all reported profiles
  const allProfiles = alertas.flatMap(a => 
    a.redesSociales.map(p => ({
      ...p,
      subjectId: a.id,
      subjectName: a.nombreSujeto,
      subjectLocation: a.localidad,
      subjectGravity: a.gravedad,
      subjectVerificado: a.verificado,
      creadorRefugio: a.creadorRefugio
    }))
  ).filter(p => 
    p.handleOrUrl.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.subjectName.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.platform.toLowerCase().includes(profileSearch.toLowerCase())
  );

  // Handle Authentication submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isRegisterMode) {
        if (!email.trim() || !registerName.trim() || !registerRefugio.trim()) {
          throw new Error('Todos los campos son obligatorios para registrarse.');
        }
        const session = await registerUser(email, registerName, registerRefugio);
        onLoginSuccess(session);
        setActiveTab('stats');
      } else {
        if (!email.trim()) {
          throw new Error('El correo electrónico es obligatorio.');
        }
        const session = await loginUser(email, password || undefined);
        onLoginSuccess(session);
        setActiveTab('stats');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error durante el proceso. Revisa los datos.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onLogoutSuccess();
    setActiveTab('auth');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden text-gray-800 animate-fade-in" id="dashboard-stats-root">
      
      {/* Top Banner indicating Supabase connection status */}
      <div className={`px-6 py-3 flex flex-wrap items-center justify-between text-xs font-mono font-medium border-b border-gray-100 ${
        isSupabaseConfigured 
          ? 'bg-emerald-50 text-emerald-800' 
          : 'bg-indigo-50 text-indigo-800'
      }`}>
        <div className="flex items-center gap-1.5">
          <Globe className="w-4 h-4 shrink-0" />
          <span>
            {isSupabaseConfigured 
              ? 'Conectado a la Base de Datos Supabase (Producción / Nube)' 
              : 'Modo de Simulación y Almacenamiento Local Activo (Fallback)'}
          </span>
        </div>
        <button 
          onClick={onRefreshData}
          className="hover:underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-black/5"
          title="Sincronizar Datos"
        >
          <RefreshCw className="w-3 h-3" />
          Sincronizar
        </button>
      </div>

      {/* Dashboard Tabs & User Info Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'stats' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Zonas y Resumen
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'profiles' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Perfiles Denunciados ({allProfiles.length})
          </button>

          {userSession && (
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'emails' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Copias por Correo ({emailLogs.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('auth')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'auth' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {userSession ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {userSession ? 'Gestionar Cuenta' : 'Iniciar Sesión / Registro'}
          </button>
        </div>

        {/* User Badge if logged-in */}
        {userSession && (
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="text-left">
              <p className="font-semibold text-slate-900 leading-none">{userSession.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{userSession.refugio}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors ml-2"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* PANEL CONTENTS */}
      <div className="p-6 md:p-8">

        {/* 1. AUTH TAB (Login / Register) */}
        {activeTab === 'auth' && (
          <div className="max-w-md mx-auto space-y-6">
            {userSession ? (
              // Logged-In Account Management Status
              <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                <div className="bg-emerald-100 text-emerald-800 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                  <Unlock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Sesión Activa y Validada</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Has iniciado sesión como <strong>{userSession.name}</strong> en representación de <strong>{userSession.refugio}</strong> ({userSession.email}).
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3 text-left text-xs text-slate-600 space-y-1">
                  <p>• <strong>Rol de Acceso:</strong> {userSession.role === 'admin' ? 'Administrador Central 👑' : 'Refugio / Colaborador Autorizado 🐾'}</p>
                  <p>• <strong>Auditoría de Datos:</strong> Tus reportes se ingresarán automáticamente con tus datos validados de remitente.</p>
                  <p>• <strong>Privacidad Abierta:</strong> Tienes privilegios para ver nombres de refugios reportantes.</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 text-white hover:bg-red-700 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión Activa
                  </button>
                </div>
              </div>
            ) : (
              // Login / Register Form
              <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-display font-black text-slate-900">
                    {isRegisterMode ? 'Registrar Refugio / Rescatista' : 'Acceso a la Red Central'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    {isRegisterMode 
                      ? 'Regístrate para obtener una cuenta que te permita guardar alertas asociadas a tu refugio y recibir copias.' 
                      : 'Inicia sesión para ingresar alertas, ver reportantes ocultos y gestionar las estadísticas por zonas.'}
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-900 block">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ej. protectora@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-gray-400">
                      Usa <code>{ADMINISTRATOR_EMAIL}</code> para simular acceso de administrador.
                    </p>
                  </div>

                  {/* Password (if configured, or optional simple pass) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-900 block flex justify-between">
                      <span>Contraseña de Acceso</span>
                      <span className="text-[10px] text-gray-400 font-normal">(Para cuentas reales Supabase)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Para modo simulación puedes dejarlo vacío o '123456'"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Fields for registration mode */}
                  {isRegisterMode && (
                    <>
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-900 block">
                          Tu Nombre Completo / Alias de Rescatista
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej. María Eugenia López"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Refugio */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-900 block">
                          Nombre de tu Refugio o Protectora
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej. Refugio Huellitas del Amor"
                          value={registerRefugio}
                          onChange={(e) => setRegisterRefugio(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {authError && (
                    <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isRegisterMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {authLoading ? 'Procesando...' : isRegisterMode ? 'Registrar Cuenta' : 'Iniciar Sesión'}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError('');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                  >
                    {isRegisterMode 
                      ? '¿Ya tienes una cuenta? Inicia Sesión' 
                      : '¿No tienes cuenta? Registra tu Refugio aquí'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. STATS TAB (Zonas y Resúmenes de Estadísticas) */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Upper stats widgets row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">Total Alertas</span>
                <strong className="text-3xl font-display font-black text-slate-900 block mt-1">{stats.totalAlerts}</strong>
              </div>
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-600 block font-semibold">Casos Críticos</span>
                <strong className="text-3xl font-display font-black text-red-600 block mt-1">{stats.criticalCount}</strong>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 block font-semibold">Alertas Preventivas</span>
                <strong className="text-3xl font-display font-black text-amber-700 block mt-1">{stats.unverifiedCount}</strong>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 block font-semibold">Redes Asociadas</span>
                <strong className="text-3xl font-display font-black text-indigo-600 block mt-1">
                  {alertas.reduce((acc, a) => acc + a.redesSociales.length, 0)}
                </strong>
              </div>
            </div>

            {/* Interactive Province Chart & Jurisdiction Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Side: Horizontal Bar Chart of Provinces (8 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-display font-bold text-sm text-slate-900">Alertas Registradas por Provincia</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Posiciona el cursor o haz clic en una provincia para desglosar sus jurisdicciones, barrios y perfiles denunciados.
                  </p>
                </div>

                {provinceStats.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {(() => {
                      const maxCount = Math.max(...provinceStats.map(p => p.count), 1);
                      return provinceStats.map((p, idx) => {
                        const pct = (p.count / maxCount) * 100;
                        const isSelected = activeProvinceName === p.province;
                        
                        return (
                          <div 
                            key={idx}
                            onMouseEnter={() => setHoveredProvince(p.province)}
                            onMouseLeave={() => setHoveredProvince(null)}
                            onClick={() => setPinnedProvince(pinnedProvince === p.province ? null : p.province)}
                            className={`group p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' 
                                : 'bg-slate-50/50 border-transparent hover:bg-slate-50 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Map className="w-3.5 h-3.5 text-indigo-500" />
                                {p.province}
                                {pinnedProvince === p.province && (
                                  <span className="bg-indigo-600 text-white px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-mono">Fijado</span>
                                )}
                              </span>
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                                {p.count} {p.count === 1 ? 'alerta' : 'alertas'}
                              </span>
                            </div>
                            
                            <div className="w-full bg-slate-100/80 h-3 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isSelected ? 'bg-indigo-600' : 'bg-indigo-400 group-hover:bg-indigo-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No hay suficientes datos de ubicación para generar el gráfico.
                  </div>
                )}
              </div>

              {/* Right Side: Hover/Active Neighborhoods panel (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950 text-slate-100 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden border border-slate-800">
                {/* Decorative mesh */}
                <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">
                      Desglose de Jurisdicciones / Barrios
                    </h4>
                  </div>

                  {activeProvinceData ? (
                    <div className="space-y-5">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 font-semibold block uppercase">Provincia Seleccionada</span>
                        <h5 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                          {activeProvinceData.province}
                        </h5>
                      </div>

                      <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                        {activeProvinceData.jurisdictions.map((jur, idx) => (
                          <div key={idx} className="bg-slate-900/80 border border-slate-800/60 p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">{jur.name}</span>
                              <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                                {jur.count} {jur.count === 1 ? 'caso' : 'casos'}
                              </span>
                            </div>
                            
                            {/* Listed Profiles inside this Jurisdiction */}
                            <div className="space-y-1.5 pl-2 border-l border-slate-800">
                              {jur.alerts.map((al, alIdx) => (
                                <div key={alIdx} className="text-[10px] text-slate-400 flex flex-col gap-0.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-200 font-medium">• {al.nombreSujeto}</span>
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-semibold uppercase ${
                                      al.gravedad.includes('Crítica') || al.gravedad.includes('Critica')
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                      {al.gravedad.split(' ')[0]}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 italic pl-2.5 line-clamp-1">
                                    {al.motivos[0] || 'Alerta guardada'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-2">
                      <Info className="w-8 h-8 text-slate-600" />
                      <p className="text-xs max-w-xs">
                        Pasa el cursor sobre alguna de las barras del gráfico para ver el desglose de barrios.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-400 mt-4 relative z-10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Datos actualizados en tiempo real por comunidad</span>
                </div>
              </div>
            </div>

            {/* Provincia / Localidad / Motivo de Alerta Detailed Table */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 space-y-5 shadow-xs" id="table-provincia-motivos">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    Índice de Reportes: Provincias, Localidades y Motivos
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Planilla completa de consulta preventiva de alertas registradas en el sistema.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Search bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, barrio, motivo..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Province Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={tableProvinceFilter}
                      onChange={(e) => setTableProvinceFilter(e.target.value)}
                      className="w-full sm:w-48 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none pr-8 font-medium text-slate-700"
                    >
                      <option value="TODAS">📍 Todas las Provincias</option>
                      {provinceStats.map((p, idx) => (
                        <option key={idx} value={p.province}>
                          {p.province} ({p.count})
                        </option>
                      ))}
                    </select>
                    <ListFilter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Table rendering */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold font-mono text-[10px] uppercase">
                      <th className="p-3">Provincia</th>
                      <th className="p-3">Localidad / Barrio</th>
                      <th className="p-3">Persona Reportada</th>
                      <th className="p-3">Motivo de Alerta / Denuncia</th>
                      <th className="p-3 text-right">Severidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredTableAlertas = alertas.filter(alerta => {
                        const { provincia, barrioLocalidad } = parseLocalidad(alerta.localidad);
                        const matchesProvince = tableProvinceFilter === 'TODAS' || provincia === tableProvinceFilter;
                        
                        const searchClean = tableSearch.toLowerCase().trim();
                        if (!searchClean) return matchesProvince;

                        const matchesSearch = 
                          provincia.toLowerCase().includes(searchClean) ||
                          barrioLocalidad.toLowerCase().includes(searchClean) ||
                          alerta.nombreSujeto.toLowerCase().includes(searchClean) ||
                          alerta.motivos.some(m => m.toLowerCase().includes(searchClean)) ||
                          (alerta.identificacion && alerta.identificacion.includes(searchClean)) ||
                          (alerta.telefono && alerta.telefono.includes(searchClean));

                        return matchesProvince && matchesSearch;
                      });

                      if (filteredTableAlertas.length > 0) {
                        return filteredTableAlertas.map((alerta, idx) => {
                          const { provincia, barrioLocalidad } = parseLocalidad(alerta.localidad);
                          
                          return (
                            <tr key={idx} className="border-b border-slate-100/50 hover:bg-slate-50/40 last:border-0 transition-colors duration-200">
                              {/* Provincia */}
                              <td className="p-3 font-bold text-slate-800">
                                <span className="flex items-center gap-1">
                                  <Map className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {provincia}
                                </span>
                              </td>
                              {/* Localidad / Barrio */}
                              <td className="p-3 text-slate-700 font-medium">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  {barrioLocalidad}
                                </span>
                              </td>
                              {/* Persona Reportada */}
                              <td className="p-3 text-slate-900 font-semibold">
                                {alerta.nombreSujeto}
                              </td>
                              {/* Motivos de Denuncia */}
                              <td className="p-3 text-slate-600 max-w-xs md:max-w-md lg:max-w-lg">
                                <div className="flex flex-wrap gap-1">
                                  {alerta.motivos.map((mot, motIdx) => (
                                    <span 
                                      key={motIdx} 
                                      className="inline-block bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100 text-[10px] leading-relaxed line-clamp-1"
                                      title={mot}
                                    >
                                      {mot}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              {/* Severidad */}
                              <td className="p-3 text-right">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  alerta.gravedad.includes('Crítica') || alerta.gravedad.includes('Critica')
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                    : alerta.gravedad.includes('Alta')
                                      ? 'bg-red-50 text-red-600 border border-red-100'
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {alerta.gravedad.split(' ')[0]}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      } else {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-xs italic">
                              No se encontraron registros de alerta que coincidan con la búsqueda.
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer of Privacy */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-[11px] text-slate-500 leading-relaxed text-center">
              ⚠️ <strong>Compromiso de Privacidad Integral:</strong> En cumplimiento con los estándares de seguridad y protección para nuestra comunidad de rescatistas, los datos personales de las personas u organizaciones denunciantes (correo electrónico, nombre del refugio o identidad del rescatista) son <strong>estrictamente confidenciales</strong> y no se muestran al público general bajo ninguna circunstancia.
            </div>
          </div>
        )}

        {/* 3. PROFILES TAB (Perfiles Denunciados) */}
        {activeTab === 'profiles' && (
          <div className="space-y-6 animate-fade-in" id="reported-profiles-subview">
            
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-slate-100">
              <div className="space-y-1">
                <p>
                  <strong>Búsqueda Cruzada de Perfiles:</strong> Como los perfiles falsos y las cuentas de redes sociales suelen repetirse (los números de teléfono o perfiles de Facebook/Instagram se reutilizan), este cuadro unifica todos los identificadores denunciados.
                </p>
                <p className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                  🔒 <strong>Privacidad del denunciante:</strong> Los datos de contacto y el nombre de los refugios/rescatistas reportantes están estrictamente ocultos al público para garantizar su absoluta seguridad y resguardo.
                </p>
              </div>
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar perfiles..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-semibold font-mono text-[10px] uppercase">
                    <th className="p-3">Red Social / Plataforma</th>
                    <th className="p-3">Nombre de Usuario / Enlace</th>
                    <th className="p-3">Persona Asociada</th>
                    <th className="p-3">Localidad</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allProfiles.length > 0 ? (
                    allProfiles.map((p, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-slate-50/50 last:border-0">
                        <td className="p-3">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {p.platform}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-900">{p.handleOrUrl}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{p.subjectName}</span>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              p.subjectGravity.includes('Crítica') ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                            }`} title={`Gravedad: ${p.subjectGravity}`}></span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-500">{p.subjectLocation}</td>
                        <td className="p-3 text-right">
                          <a
                            href={p.handleOrUrl.startsWith('http') ? p.handleOrUrl : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 px-2 py-1 rounded text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            Ir al Perfil
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                        No se encontraron perfiles cargados en la base de datos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EMAILS TAB (Bandeja de Salida Simulada) */}
        {activeTab === 'emails' && (
          <div className="space-y-6 animate-fade-in" id="simulated-emails-outbox">
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 flex gap-2.5">
              <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Bandeja de Copias de Seguridad del Sistema</span>
                Para cumplir estrictamente con los requisitos del usuario, cada vez que se registra un reporte, el motor de la app genera dos correos electrónicos: una copia al <strong>rescatista reportante</strong> y otra copia detallada al correo de la <strong>administradora (claudia.filiel@gmail.com)</strong>. Abajo puedes ver el historial exacto de correos que han sido disparados por la aplicación.
              </div>
            </div>

            {/* List of Email logs */}
            <div className="grid grid-cols-1 gap-3">
              {emailLogs.length > 0 ? (
                emailLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="bg-white border border-gray-150 hover:border-indigo-200 rounded-xl p-4 transition-all duration-200 flex justify-between items-center group shadow-sm"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Send className="w-2.5 h-2.5" />
                          {log.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(log.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 truncate">
                        {log.subject}
                      </h5>
                      <p className="text-[11px] text-slate-600">
                        Destinatario: <strong className="text-indigo-600">{log.to}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedEmailLog(log)}
                      className="bg-slate-50 border border-gray-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all p-2 rounded-xl"
                      title="Ver contenido del correo"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 italic bg-slate-50 rounded-xl border border-slate-100">
                  Aún no se han generado correos simulados. Registra una nueva alerta en el formulario para disparar el flujo de copias de seguridad.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* EMAIL EXPEDIENTE DIALOG */}
      {selectedEmailLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-email-viewer">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-bold text-slate-900">
                  Previsualización de Correo Electrónico
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEmailLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-700">
                <p><strong>De:</strong> {selectedEmailLog.from}</p>
                <p><strong>Para:</strong> {selectedEmailLog.to}</p>
                <p><strong>Asunto:</strong> {selectedEmailLog.subject}</p>
                <p><strong>Enviado:</strong> {new Date(selectedEmailLog.sentAt).toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-gray-900 block">Cuerpo del Correo:</span>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-96">
                  {selectedEmailLog.body}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-gray-100 px-6 py-4 flex justify-end sticky bottom-0">
              <button
                onClick={() => setSelectedEmailLog(null)}
                className="bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
