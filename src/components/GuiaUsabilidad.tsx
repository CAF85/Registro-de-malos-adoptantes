/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, CheckCircle2, ShieldAlert, Users, Compass, Eye, Sparkles, Scale } from 'lucide-react';

export default function GuiaUsabilidad() {
  return (
    <div className="space-y-8 animate-fade-in text-gray-800" id="guia-usabilidad-root">
      {/* Hero Banner */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="bg-amber-100 p-4 rounded-xl text-amber-800 self-start md:self-center">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-amber-900 mb-2">
            Guía de Buenas Prácticas, Usabilidad y Preguntas Clave
          </h2>
          <p className="text-sm md:text-base text-amber-800 leading-relaxed max-w-3xl">
            Para que un registro de malos adoptantes sea verdaderamente efectivo, debe ser **confiable, fácil de usar y legalmente seguro**. Aquí te explicamos el porqué de las preguntas seleccionadas, cómo optimizamos el formulario y las mejores vías de crecimiento para tu aplicación.
          </p>
        </div>
      </div>

      {/* Grid of Key Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Las Preguntas Cerradas Seleccionadas */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-semibold text-gray-900">
              Preguntas Cerradas Recomendadas
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Las preguntas cerradas son fundamentales en esta app porque **reducen la subjetividad**, permiten la **clasificación instantánea** y facilitan la búsqueda rápida. Recomendamos agruparlas en tres ejes esenciales:
          </p>

          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/20 rounded-r-lg">
              <h4 className="font-semibold text-sm text-indigo-900">Motivo de la Alerta (Selección Múltiple)</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Permite tipificar exactamente el comportamiento (maltrato físico, abandono voluntario, negligencia médica, datos falsos, cría ilegal). Esto previene que denuncias menores se confundan con casos graves de crueldad animal.
              </p>
            </div>
            
            <div className="border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/20 rounded-r-lg">
              <h4 className="font-semibold text-sm text-indigo-900">Nivel de Gravedad (Opción Única)</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Ayuda a priorizar la visualización en el listado. Clasifica desde <strong>Otro a considerar</strong> (casos especiales o sospechas) hasta <strong>Crítica</strong> (violencia física activa, peleas o cría clandestina).
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/20 rounded-r-lg">
              <h4 className="font-semibold text-sm text-indigo-900">Tipos de Evidencia Soportada</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Crucial para dar veracidad al reporte. Brinda opciones transparentes: capturas de chat, fotos/videos del estado del animal, testimonios cruzados de otros refugios, o denuncias policiales formales.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Optimización de Usabilidad implementada */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-semibold text-gray-900">
              Optimización de la Usabilidad
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Un rescatista suele estar bajo estrés o apuro. El formulario implementado aplica las siguientes directrices de experiencia de usuario (UX) para maximizar la efectividad:
          </p>

          <ul className="space-y-3.5">
            <li className="flex gap-3">
              <div className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900 block font-sans">División por Pasos (Progression-based disclosure)</strong>
                El formulario no abruma de entrada. Se divide en tres etapas secuenciales: 1) Identidad física de la persona, 2) Perfiles en redes sociales (dinámico), y 3) Motivos, gravedad y evidencias del caso.
              </div>
            </li>
            <li className="flex gap-3">
              <div className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900 block font-sans">Perfiles Dinámicos de Redes Sociales</strong>
                En lugar de un campo de texto plano, permitimos agregar múltiples redes de manera individual, seleccionando la plataforma (Instagram, Facebook, etc.). Esto normaliza los datos para búsquedas precisas.
              </div>
            </li>
            <li className="flex gap-3">
              <div className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900 block font-sans">Control del Límite de 1300 caracteres con Contador Vivo</strong>
                El campo libre ("Otro") incluye un indicador visual dinámico de caracteres restantes y un bloqueo para que no se exceda del límite. Esto fomenta reportes concretos y evita textos eternos y poco legibles.
              </div>
            </li>
            <li className="flex gap-3">
              <div className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900 block font-sans">Resumen de Confirmación</strong>
                Antes de guardar el reporte, mostramos un resumen detallado del mismo para evitar envíos accidentales o errores ortográficos en los identificadores o enlaces.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Recommended Improvements and Roadmap */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-display font-semibold text-gray-900">
            Opciones de Mejora y Futuro Crecimiento de tu App
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Sistema de Verificación
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Para evitar denuncias falsas o venganzas personales (un gran riesgo en este tipo de apps), implementa un flujo donde solo los <strong>refugios verificados</strong> con personería jurídica o reputación validada puedan publicar reportes marcados como "Verificados".
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Integración con API de Redes
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Permite la extracción de IDs numéricos estáticos de las redes. Los usuarios suelen cambiar su "nombre de usuario" (@handle), pero los IDs únicos de Facebook o Instagram no cambian. Almacenar este dato impide que se evada la búsqueda simplemente cambiando el nombre de perfil.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Búsqueda Fonética y DNI
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Los malos adoptantes a menudo mienten sobre la escritura de su nombre (ej. "Carlos" vs. "Karlos"). Una búsqueda que use algoritmos de aproximación fonética o priorice el documento de identidad oficial (DNI) aumenta drásticamente la tasa de coincidencia positiva.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Legal Warning */}
      <div className="bg-red-50 border border-red-200/50 rounded-2xl p-6 flex gap-4 items-start">
        <div className="bg-red-100 text-red-700 p-2 rounded-xl shrink-0">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm text-red-900 mb-1">
            Consideración Legal Crítica: Protección de Datos y Difamación
          </h4>
          <p className="text-xs text-red-800 leading-relaxed">
            Publicar datos personales (como nombres, teléfonos, DNI o enlaces a perfiles privados) puede infringir las leyes de protección de datos personales de tu país y constituir un delito de difamación si el hecho no está firmemente probado judicialmente. Para resguardar legalmente a los refugios, es aconsejable que la base de datos sea de <strong>acceso restringido mediante usuario/contraseña validada únicamente para rescatistas autorizados</strong>, en lugar de ser un listado público general en internet. Además, se debe habilitar siempre un canal claro para que cualquier persona que aparezca en el registro pueda ejercer su derecho de rectificación, descargo o remoción.
          </p>
        </div>
      </div>
    </div>
  );
}
