/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Check, FileText, AlertTriangle, Scale } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export default function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="disclaimer-modal-root">
      <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-5 text-gray-800 animate-slide-up max-h-[90vh] overflow-y-auto">
        
        {/* Warning Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-display font-black text-slate-950 tracking-tight">
            AVISO LEGAL Y DE RESPONSABILIDAD
          </h2>
          <p className="text-[10px] text-rose-600 font-mono font-bold tracking-widest uppercase">
            Plataforma de Protección y Bienestar Animal
          </p>
        </div>

        {/* Informative text box */}
        <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed border-y border-slate-100 py-4">
          <div className="flex gap-3 items-start bg-amber-50/80 border border-amber-100 p-3 rounded-xl text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>AVISO DE EXCLUSIÓN DE REEMPLAZO PENAL:</strong> La carga de datos, reportes o alertas en esta plataforma <strong>NO REEMPLAZA</strong> la denuncia formal ante las autoridades policiales o judiciales competentes por maltrato animal.
            </p>
          </div>

          <p>
            Esta plataforma de consulta de alertas preventivas está restringida de forma exclusiva a refugios, protectores y rescatistas registrados para resguardar la vida y bienestar animal en procesos de adopción.
          </p>

          <div className="flex gap-3 items-start bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <Scale className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-bold text-slate-900 block mb-0.5">Responsabilidad de la Información:</span>
              Como usuario, declara bajo juramento la veracidad de los reportes. Se compromete a poseer evidencias físicas verificables que respalden de forma objetiva la alerta registrada.
            </div>
          </div>
        </div>

        {/* Checkbox confirmation */}
        <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors border border-slate-100">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-rose-600 cursor-pointer w-4 h-4 shrink-0"
            id="checkbox-accept-disclaimer"
          />
          <span className="text-[11px] text-slate-700 font-medium leading-snug">
            He leído y entiendo que este registro no reemplaza la denuncia penal, y asumo la responsabilidad ética del uso de la información.
          </span>
        </label>

        {/* Submit action */}
        <div className="pt-1">
          <button
            onClick={onAccept}
            disabled={!agreed}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
              agreed 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 cursor-pointer active:scale-98' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            id="btn-accept-disclaimer"
          >
            <Check className="w-4 h-4" />
            Aceptar y Continuar a la Aplicación
          </button>
        </div>

      </div>
    </div>
  );
}
