/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Users, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Alerta, AlertaGravedad } from '../types';

interface HeaderProps {
  alertas: Alerta[];
}

export default function Header({ alertas }: HeaderProps) {
  // Compute basic quick statistics
  const total = alertas.length;
  const criticas = alertas.filter(a => a.gravedad === AlertaGravedad.CRITICA).length;
  const verificadas = alertas.filter(a => a.verificado).length;

  return (
    <header className="space-y-6 text-gray-800 animate-fade-in" id="header-root">
      {/* Brand Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-950 border border-slate-800/80 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
        {/* Modern high-end mesh gradient decorative shape */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-indigo-500/15 via-indigo-500/5 to-transparent rounded-full pointer-events-none translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-radial from-rose-500/10 via-transparent to-transparent rounded-full pointer-events-none translate-y-1/3"></div>
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-400 p-2 rounded-2xl border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span className="font-mono text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
              Plataforma de Protección y Bienestar Animal
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Registro de Malos Adoptantes
          </h1>
          <p className="text-xs md:text-sm text-slate-300/90 max-w-2xl leading-relaxed font-normal">
            Unificando información clave para refugios, protectores y rescatistas independientes. Nuestro objetivo es prevenir el maltrato, el abandono y resguardar la vida de los animales mediante un registro de alertas verídico y estructurado.
          </p>
        </div>
      </div>

      {/* Stats Indicators Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stats-banner-grid">
        {/* Stat 1: Total */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs hover:shadow-md transition-shadow duration-300">
          <div className="bg-indigo-50/70 p-3.5 rounded-xl text-indigo-600 border border-indigo-100/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider font-semibold">Alertas Totales</span>
            <strong className="text-2xl font-display font-bold text-slate-900">{total}</strong>
          </div>
        </div>

        {/* Stat 2: Critical alerts */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs hover:shadow-md transition-shadow duration-300">
          <div className="bg-rose-50/70 p-3.5 rounded-xl text-rose-600 border border-rose-100/40">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider font-semibold">Gravedad Crítica</span>
            <strong className="text-2xl font-display font-bold text-rose-600">{criticas}</strong>
          </div>
        </div>

        {/* Stat 3: Verified status */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs hover:shadow-md transition-shadow duration-300">
          <div className="bg-emerald-50/70 p-3.5 rounded-xl text-emerald-600 border border-emerald-100/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider font-semibold">Casos Verificados</span>
            <strong className="text-2xl font-display font-bold text-emerald-600">{verificadas}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
