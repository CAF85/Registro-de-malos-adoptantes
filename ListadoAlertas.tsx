/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Alerta, AlertaGravedad, AlertaMotivo, SocialPlatform, UserSession } from '../types';
import { 
  Search, 
  Filter, 
  AlertOctagon, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Eye,
  PlusCircle,
  X,
  FileText,
  MessageSquare
} from 'lucide-react';

interface ListadoAlertasProps {
  alertas: Alerta[];
  onSelectAlerta: (alerta: Alerta) => void;
  onOpenReportForm: () => void;
  userSession: UserSession | null;
}

export default function ListadoAlertas({ alertas, onSelectAlerta, onOpenReportForm, userSession }: ListadoAlertasProps) {

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGravedad, setSelectedGravedad] = useState<AlertaGravedad | 'TODAS'>('TODAS');
  const [selectedMotivoFilter, setSelectedMotivoFilter] = useState<AlertaMotivo | 'TODOS'>('TODOS');
  
  // Modal state for quick detail view (within list)
  const [activeDetailAlerta, setActiveDetailAlerta] = useState<Alerta | null>(null);

  // Helper to normalize text for comparison (removes accents, lowercase, trims)
  const normalizeText = (text: string): string => {
    return (text || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Helper to normalize numeric values (only digits)
  const normalizeNumbers = (text: string): string => {
    return (text || '').replace(/\D/g, "");
  };

  // Filter alerts based on search term and filters
  const filteredAlertas = alertas.filter(alerta => {
    const termClean = normalizeText(searchTerm);
    const termNumeric = normalizeNumbers(searchTerm);

    // If there is no search term, everything matches search criteria
    let matchesSearch = true;

    if (termClean) {
      // 1. Text match (Name, Location, Social Profiles, Creator Shelter)
      const matchesText = 
        normalizeText(alerta.nombreSujeto).includes(termClean) ||
        normalizeText(alerta.localidad).includes(termClean) ||
        alerta.redesSociales.some(rs => normalizeText(rs.handleOrUrl).includes(termClean)) ||
        (userSession && alerta.creadorRefugio && normalizeText(alerta.creadorRefugio).includes(termClean));

      // 2. Numeric match (DNI, Telephone - comparing strictly digits only)
      const matchesNumeric = 
        (termNumeric && alerta.identificacion && normalizeNumbers(alerta.identificacion).includes(termNumeric)) ||
        (termNumeric && alerta.telefono && normalizeNumbers(alerta.telefono).includes(termNumeric));

      matchesSearch = !!(matchesText || matchesNumeric);
    }

    // Gravity filter match
    const matchesGravedad = selectedGravedad === 'TODAS' || alerta.gravedad === selectedGravedad;

    // Reason filter match
    const matchesMotivo = selectedMotivoFilter === 'TODOS' || alerta.motivos.includes(selectedMotivoFilter);

    return matchesSearch && matchesGravedad && matchesMotivo;
  });

  // Date formatter helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 text-gray-800" id="listado-alertas-root">
      
      {/* Search and Filters Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
        
        {/* Usability Prompt for Search */}
        <div className="flex items-center gap-2 text-xs text-indigo-800 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
          <Info className="w-4 h-4 shrink-0 text-indigo-600" />
          <p className="leading-relaxed">
            <strong>Consejo de Búsqueda:</strong> Puedes buscar por <strong>nombre completo</strong>, <strong>DNI / identificación</strong>, <strong>localidad</strong>, o el <strong>nombre de usuario de sus redes sociales</strong> (ej. <i>@carlospereyra</i>).
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, red social, DNI, teléfono o localidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              id="input-search-alertas"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Gravity Filter */}
          <div className="w-full lg:w-60">
            <select
              value={selectedGravedad}
              onChange={(e) => setSelectedGravedad(e.target.value as AlertaGravedad | 'TODAS')}
              className="w-full bg-slate-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-medium"
              id="select-filter-gravedad"
            >
              <option value="TODAS">Gravedad: Todas</option>
              {Object.values(AlertaGravedad).map(g => (
                <option key={g} value={g}>Gravedad: {g.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Reason/Motivo Filter */}
          <div className="w-full lg:w-72">
            <select
              value={selectedMotivoFilter}
              onChange={(e) => setSelectedMotivoFilter(e.target.value as AlertaMotivo | 'TODOS')}
              className="w-full bg-slate-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-medium"
              id="select-filter-motivo"
            >
              <option value="TODOS">Motivo: Todos los casos</option>
              {Object.values(AlertaMotivo).map(m => (
                <option key={m} value={m}>Motivo: {m.substring(0, 32)}...</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Metrics & Action Row */}
      <div className="flex justify-between items-center px-2">
        <div className="text-xs text-gray-500">
          Mostrando <strong className="text-gray-900 font-semibold">{filteredAlertas.length}</strong> de <strong className="text-gray-900 font-semibold">{alertas.length}</strong> alertas registradas
        </div>
        
        <button
          onClick={onOpenReportForm}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10 hover:shadow-lg hover:shadow-rose-600/20 active:scale-98 cursor-pointer"
          id="btn-add-alerta-directory"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          Registrar Mal Adoptante
        </button>
      </div>

      {/* Alerts Grid */}
      {filteredAlertas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="grid-alertas">
          {filteredAlertas.map((alerta) => {
            // Check urgency colors
            let gravityBadgeColor = '';
            let severityBorderClass = '';
            let severityIconColor = '';
            
            if (alerta.gravedad === AlertaGravedad.CRITICA) {
              gravityBadgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
              severityBorderClass = 'border-l-[5px] border-l-rose-500';
              severityIconColor = 'text-rose-500';
            } else if (alerta.gravedad === AlertaGravedad.ALTA) {
              gravityBadgeColor = 'bg-orange-50 text-orange-800 border-orange-200';
              severityBorderClass = 'border-l-[5px] border-l-orange-500';
              severityIconColor = 'text-orange-500';
            } else if (alerta.gravedad === AlertaGravedad.MEDIA) {
              gravityBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
              severityBorderClass = 'border-l-[5px] border-l-amber-500';
              severityIconColor = 'text-amber-500';
            } else {
              gravityBadgeColor = 'bg-sky-50 text-sky-800 border-sky-200';
              severityBorderClass = 'border-l-[5px] border-l-sky-500';
              severityIconColor = 'text-sky-500';
            }

            return (
              <div 
                key={alerta.id}
                className={`bg-white border border-gray-100/90 rounded-2xl p-6 hover:shadow-lg hover:border-slate-200/80 transition-all duration-300 flex flex-col justify-between group relative shadow-xs ${severityBorderClass}`}
                id={`alerta-card-${alerta.id}`}
              >
                {/* Upper Badge & Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    {/* Gravity Badge */}
                    <span className={`text-[10px] font-bold tracking-wider uppercase border px-2.5 py-0.5 rounded-full ${gravityBadgeColor}`}>
                      {alerta.gravedad.split(' ')[0]}
                    </span>

                    {/* Verification Status */}
                    {alerta.verificado ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verificado por Refugio
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                        Alerta Preventiva
                      </span>
                    )}
                  </div>

                  {/* Subject Name and metadata */}
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {alerta.nombreSujeto}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {alerta.localidad}
                      </span>
                      {alerta.identificacion && (
                        <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-slate-600">
                          ID: {alerta.identificacion}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Social Media Chips */}
                  <div className="pt-1.5">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-mono uppercase tracking-wider font-semibold">Canales de Contacto:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {alerta.redesSociales.map((profile) => (
                        <span 
                          key={profile.id}
                          className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/50 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <span className="text-indigo-600 font-bold">{profile.platform}</span>
                          <span className="text-slate-500 truncate max-w-[130px]">{profile.handleOrUrl}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reasons summary list */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider font-semibold">Criterios de alerta:</span>
                    {alerta.motivos.length > 0 ? (
                      <div className="space-y-1.5">
                        {alerta.motivos.slice(0, 2).map((motivo, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-xs text-slate-700 font-medium">
                            <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                            <span className="line-clamp-1">{motivo}</span>
                          </div>
                        ))}
                        {alerta.motivos.length > 2 && (
                          <span className="text-[10px] text-indigo-600 font-semibold pl-3 block">
                            + {alerta.motivos.length - 2} motivos más...
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 italic block font-medium">Especificado en campo libre ("Otro").</span>
                    )}
                  </div>

                  {/* Brief Description Snippet */}
                  {alerta.descripcionOtros && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50/40 p-3 rounded-xl border border-slate-100/60 leading-relaxed">
                      "{alerta.descripcionOtros}"
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatDate(alerta.fechaCreacion)}
                  </span>

                  <button
                    onClick={() => setActiveDetailAlerta(alerta)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                    id={`btn-view-${alerta.id}`}
                  >
                    Ver Expediente
                    <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="bg-slate-100 p-4 rounded-full w-14 h-14 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-bold text-gray-900">Ningún caso coincide con la búsqueda</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Prueba a buscar por otro término o limpia los filtros. Si sabes de un caso de riesgo que aún no figure, puedes cargarlo en la base de datos de alertas.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGravedad('TODAS');
                setSelectedMotivoFilter('TODOS');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        </div>
      )}

      {/* DETALLES EXPEDIENTE MODAL */}
      {activeDetailAlerta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-detail">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  Expediente de Alerta
                </span>
                <h3 className="text-lg font-display font-bold text-slate-900 mt-1">
                  {activeDetailAlerta.nombreSujeto}
                </h3>
              </div>
              <button 
                onClick={() => setActiveDetailAlerta(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Main Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs text-slate-700 border border-slate-100">
                <div>
                  <span className="text-gray-400 block font-mono text-[9px] uppercase tracking-wider mb-0.5">Identificación</span>
                  <strong className="text-slate-900">{activeDetailAlerta.identificacion || 'No registrado'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-mono text-[9px] uppercase tracking-wider mb-0.5">Teléfono</span>
                  <strong className="text-slate-900">{activeDetailAlerta.telefono || 'No registrado'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-mono text-[9px] uppercase tracking-wider mb-0.5">Ubicación / Zona</span>
                  <strong className="text-slate-900">{activeDetailAlerta.localidad}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-mono text-[9px] uppercase tracking-wider mb-0.5">Registrado por</span>
                  <strong className="text-indigo-600 font-semibold">
                    {userSession ? activeDetailAlerta.creadorRefugio : 'Oculto por Privacidad 🔒'}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-mono text-[9px] uppercase tracking-wider mb-0.5">Fecha del reporte</span>
                  <span className="font-mono text-slate-600">{formatDate(activeDetailAlerta.fechaCreacion)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-mono text-[9px] uppercase tracking-wider mb-0.5">Estado de Validación</span>
                  <span className={`inline-flex items-center gap-1 font-semibold rounded-md px-2 py-0.5 mt-0.5 text-[10px] ${
                    activeDetailAlerta.verificado 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {activeDetailAlerta.verificado ? '✓ Reporte Verificado' : '⚠ Reporte Preventivo'}
                  </span>
                </div>
              </div>

              {/* Redes Sociales - Direct Navigation */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-900 block">Redes Sociales Vinculadas</span>
                <p className="text-[10px] text-gray-500">Haz clic para ir directamente al perfil si es posible:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeDetailAlerta.redesSociales.map((profile) => {
                    const isUrl = profile.handleOrUrl.startsWith('http') || profile.handleOrUrl.includes('.com');
                    const destinationUrl = isUrl ? profile.handleOrUrl : `https://${profile.platform === SocialPlatform.FACEBOOK ? 'facebook.com' : 'instagram.com'}/${profile.handleOrUrl.replace('@', '')}`;
                    
                    return (
                      <a 
                        key={profile.id}
                        href={destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-gray-200 hover:border-indigo-400 p-3 rounded-xl flex items-center justify-between group transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {profile.platform}
                          </span>
                          <span className="font-mono text-slate-700 font-medium truncate max-w-[160px]">
                            {profile.handleOrUrl}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Motivos - Closed Questions Details */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-gray-900 block">
                  Criterios Específicos Satisfechos (Preguntas Cerradas)
                </span>
                {activeDetailAlerta.motivos.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeDetailAlerta.motivos.map((motivo, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-red-50/20 border border-red-100/50 p-2.5 rounded-lg text-xs text-red-950">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{motivo}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No se especificó ningún motivo cerrado.</p>
                )}
              </div>

              {/* Evidencias constatadas */}
              {activeDetailAlerta.evidencias.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-900 block">Evidencia Física de Respaldo</span>
                  <div className="flex flex-wrap gap-2">
                    {activeDetailAlerta.evidencias.map((e, idx) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                        ✓ {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripcion otros / Cuadro libre */}
              {activeDetailAlerta.descripcionOtros && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-900 block">
                    Detalle Adicional del Reporte ("Otro")
                  </span>
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs text-slate-800 italic leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
                    "{activeDetailAlerta.descripcionOtros}"
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center sticky bottom-0">
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                activeDetailAlerta.gravedad === AlertaGravedad.CRITICA ? 'bg-red-50 text-red-700 border border-red-100' :
                activeDetailAlerta.gravedad === AlertaGravedad.ALTA ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                Gravedad del Caso: {activeDetailAlerta.gravedad}
              </span>
              <button
                onClick={() => setActiveDetailAlerta(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
