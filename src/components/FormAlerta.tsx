/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  SocialPlatform, 
  AlertaMotivo, 
  AlertaGravedad, 
  AlertaEvidencia, 
  SocialProfile, 
  Alerta,
  UserSession
} from '../types';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  User, 
  MapPin, 
  Phone, 
  Hash, 
  FileText,
  HelpCircle,
  X,
  Mail,
  ShieldCheck,
  Upload,
  Music,
  Video,
  FileImage
} from 'lucide-react';
import { saveSubscriber } from '../lib/supabase';

export const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires (CABA)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán"
];

interface FormAlertaProps {
  onAddAlerta: (alerta: Alerta) => void;
  onCancel: () => void;
  userSession: UserSession | null;
}

export default function FormAlerta({ onAddAlerta, onCancel, userSession }: FormAlertaProps) {
  // Current Form Step: 1, 2, 3, 4 (Review)
  const [step, setStep] = useState<number>(1);

  // Field states
  const [nombreSujeto, setNombreSujeto] = useState<string>('');
  const [identificacion, setIdentificacion] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [localidad, setLocalidad] = useState<string>('');
  const [creadorRefugio, setCreadorRefugio] = useState<string>('');
  const [creadorEmail, setCreadorEmail] = useState<string>('');

  // Location Selector states
  const [pais, setPais] = useState<string>('Argentina');
  const [provincia, setProvincia] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [paisPersonalizado, setPaisPersonalizado] = useState<string>('');
  const [provinciaPersonalizada, setProvinciaPersonalizada] = useState<string>('');
  
  // Geolocation states
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationDetectError, setLocationDetectError] = useState<string>('');
  const [locationDetectSuccess, setLocationDetectSuccess] = useState<string>('');

  // Subscription Preferences
  const [deseaAlertas, setDeseaAlertas] = useState<boolean>(false);
  const [alcanceAlertas, setAlcanceAlertas] = useState<'localidad' | 'pais'>('localidad');
  const [emailAlertas, setEmailAlertas] = useState<string>('');

  // Sync sub-location fields back to unified localidad string
  useEffect(() => {
    const finalPais = pais === 'Argentina' ? 'Argentina' : paisPersonalizado.trim();
    const finalProvincia = pais === 'Argentina' ? provincia : provinciaPersonalizada.trim();
    const parts = [ciudad.trim(), finalProvincia, finalPais].filter(Boolean);
    setLocalidad(parts.join(', '));
  }, [pais, provincia, ciudad, paisPersonalizado, provinciaPersonalizada]);



  // Autocomplete using userSession if available
  useEffect(() => {
    if (userSession) {
      setCreadorEmail(userSession.email);
      setCreadorRefugio(userSession.refugio || userSession.name || '');
    }
  }, [userSession]);

  // Autodetect Location Handler via Geolocation + Nominatim OpenStreetMap
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationDetectError('');
    setLocationDetectSuccess('');

    if (!navigator.geolocation) {
      setLocationDetectError('La geolocalización no está soportada por tu navegador.');
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'es'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Error al conectar con el servidor geográfico.');
          }

          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const country = addr.country || '';
            const state = addr.state || addr.province || addr.region || '';
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || '';

            if (country.toLowerCase().includes('argentina')) {
              setPais('Argentina');
              const matchedProv = PROVINCIAS_ARGENTINA.find(p => 
                state.toLowerCase().includes(p.toLowerCase()) || 
                p.toLowerCase().includes(state.toLowerCase())
              );
              if (matchedProv) {
                setProvincia(matchedProv);
              } else {
                if (state.toLowerCase().includes('federal') || state.toLowerCase().includes('caba') || (state.toLowerCase().includes('buenos aires') && city.toLowerCase().includes('buenos aires'))) {
                  setProvincia('Ciudad Autónoma de Buenos Aires (CABA)');
                } else {
                  setProvincia('');
                }
              }
            } else {
              setPais('Otro');
              setPaisPersonalizado(country);
              setProvinciaPersonalizada(state);
            }
            setCiudad(city);
            setLocationDetectSuccess(`¡Ubicación detectada: ${city ? city + ', ' : ''}${state || country}!`);
            
            // Clear any validation errors for location
            setErrors(prev => {
              const copy = { ...prev };
              delete copy.provincia;
              delete copy.ciudad;
              delete copy.paisPersonalizado;
              delete copy.provinciaPersonalizada;
              return copy;
            });
          } else {
            throw new Error('No se pudo determinar el domicilio exacto.');
          }
        } catch (err: any) {
          console.error(err);
          setLocationDetectError('No se pudo consultar el servicio geográfico. Por favor, selecciona manualmente abajo.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.warn(error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationDetectError('Permiso de geolocalización denegado por el navegador.');
        } else {
          setLocationDetectError('No se pudo obtener la señal de ubicación de tu dispositivo.');
        }
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Social profiles state
  const [redesSociales, setRedesSociales] = useState<SocialProfile[]>([]);

  // Closed questions states
  const [selectedMotivos, setSelectedMotivos] = useState<AlertaMotivo[]>([]);
  const [gravedad, setGravedad] = useState<AlertaGravedad>(AlertaGravedad.MEDIA);
  const [selectedEvidencias, setSelectedEvidencias] = useState<AlertaEvidencia[]>([]);
  const [detalleOtroGravedad, setDetalleOtroGravedad] = useState<string>('');
  const [adjuntos, setAdjuntos] = useState<{ name: string; size: number; type: string; base64?: string }[]>([]);

  // Open "Otro" text area state (max 1300 characters)
  const [descripcionOtros, setDescripcionOtros] = useState<string>('');

  // Form error messages state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Help tooltip toggle
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Character limit constant
  const MAX_CHAR_LIMIT = 1300;

  // File Upload State and Drag-and-Drop Handers
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    const validExtensions = [
      'png', 'jpg', 'jpeg', 'webp', 'gif', // Photos
      'mp3', 'wav', 'ogg', 'm4a',          // Audio
      'mp4',                               // Video
      'pdf'                                // PDF
    ];

    const newFiles = Array.from(fileList);
    const updatedAdjuntos = [...adjuntos];
    let hasError = false;
    let errorMsg = '';

    for (const file of newFiles) {
      if (updatedAdjuntos.length >= 10) {
        hasError = true;
        errorMsg = 'Límite máximo alcanzado. Solo se permiten hasta 10 archivos de evidencia.';
        break;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isValid = validExtensions.includes(fileExt);

      if (!isValid) {
        hasError = true;
        errorMsg = `El archivo "${file.name}" tiene un formato no permitido. Solo se aceptan Fotos, Videos (MP4), Audios (MP3/WAV/etc.) y PDFs.`;
        continue;
      }

      // Check if file is already added
      const isDuplicate = updatedAdjuntos.some(a => a.name === file.name && a.size === file.size);
      if (isDuplicate) {
        continue;
      }

      const tempFileObj = {
        name: file.name,
        size: file.size,
        type: file.type || `application/${fileExt}` || 'unknown',
        base64: ''
      };

      if (file.size < 5 * 1024 * 1024) { // Only read base64 if < 5MB
        const reader = new FileReader();
        reader.onloadend = () => {
          setAdjuntos(prev => prev.map(a => a.name === tempFileObj.name ? { ...a, base64: reader.result as string } : a));
        };
        reader.readAsDataURL(file);
      }

      updatedAdjuntos.push(tempFileObj);
    }

    setAdjuntos(updatedAdjuntos);
    if (hasError) {
      setErrors(prev => ({ ...prev, adjuntos: errorMsg }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.adjuntos;
        return copy;
      });
    }
  };

  const removeAdjunto = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.adjuntos;
      return copy;
    });
  };

  // Social profile methods
  const addSocialProfile = () => {
    const newId = `profile-${Date.now()}`;
    setRedesSociales([...redesSociales, { id: newId, platform: SocialPlatform.INSTAGRAM, handleOrUrl: '' }]);
  };

  const removeSocialProfile = (id: string) => {
    setRedesSociales(redesSociales.filter(profile => profile.id !== id));
  };

  const updateSocialProfile = (id: string, field: keyof SocialProfile, value: any) => {
    setRedesSociales(
      redesSociales.map(profile => {
        if (profile.id === id) {
          return { ...profile, [field]: value };
        }
        return profile;
      })
    );
    // Clear social error if any
    if (errors.social) {
      const newErrors = { ...errors };
      delete newErrors.social;
      setErrors(newErrors);
    }
  };

  // Toggle reasons (motivos) selection
  const toggleMotivo = (motivo: AlertaMotivo) => {
    if (selectedMotivos.includes(motivo)) {
      setSelectedMotivos(selectedMotivos.filter(m => m !== motivo));
    } else {
      setSelectedMotivos([...selectedMotivos, motivo]);
    }
  };

  // Toggle evidence selection
  const toggleEvidencia = (evidencia: AlertaEvidencia) => {
    if (selectedEvidencias.includes(evidencia)) {
      setSelectedEvidencias(selectedEvidencias.filter(e => e !== evidencia));
    } else {
      setSelectedEvidencias([...selectedEvidencias, evidencia]);
    }
  };

  // Input validation per step
  const validateStep = (currentStep: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (currentStep === 1) {
      if (!nombreSujeto.trim()) {
        newErrors.nombreSujeto = 'El nombre o alias del reportado es obligatorio.';
      } else if (nombreSujeto.trim().length < 4) {
        newErrors.nombreSujeto = 'Ingresa un nombre o alias descriptivo (mínimo 4 caracteres).';
      }
      
      // Geographical inputs validation
      if (pais === 'Argentina') {
        if (!provincia) {
          newErrors.provincia = 'Debes seleccionar la provincia de procedencia.';
        }
        if (!ciudad.trim()) {
          newErrors.ciudad = 'Debes ingresar la localidad, ciudad o barrio.';
        }
      } else {
        if (!paisPersonalizado.trim()) {
          newErrors.paisPersonalizado = 'Debes escribir el nombre del país.';
        }
        if (!provinciaPersonalizada.trim()) {
          newErrors.provinciaPersonalizada = 'Debes escribir el estado o provincia.';
        }
        if (!ciudad.trim()) {
          newErrors.ciudad = 'Debes escribir la ciudad o localidad.';
        }
      }

      if (!creadorRefugio.trim()) {
        newErrors.creadorRefugio = 'El nombre de tu refugio, protectora o tu nombre como rescatista es obligatorio.';
      }

      if (!creadorEmail.trim()) {
        newErrors.creadorEmail = 'Tu correo electrónico es obligatorio para recibir la copia del reporte.';
      } else if (!/\S+@\S+\.\S+/.test(creadorEmail)) {
        newErrors.creadorEmail = 'Ingresa un formato de correo electrónico válido (ej. refugio@correo.com).';
      }

      // Subscription validation
      if (deseaAlertas) {
        if (!emailAlertas.trim()) {
          newErrors.emailAlertas = 'El correo electrónico para recibir las alertas es obligatorio.';
        } else if (!/\S+@\S+\.\S+/.test(emailAlertas)) {
          newErrors.emailAlertas = 'Ingresa un formato de correo válido (ej. usuario@correo.com) para recibir avisos.';
        }
      }
    }

    if (currentStep === 2) {
      const hasEmpty = redesSociales.some(p => !p.handleOrUrl.trim());
      if (hasEmpty) {
        newErrors.social = 'Por favor completa el enlace o usuario de todas las redes cargadas.';
      }
    }

    if (currentStep === 3) {
      if (selectedMotivos.length === 0 && !descripcionOtros.trim()) {
        newErrors.motivos = 'Debes seleccionar al menos un motivo cerrado o describir detalladamente el caso en "Otro".';
      }

      if (descripcionOtros.length > MAX_CHAR_LIMIT) {
        newErrors.descripcionOtros = `El campo "Otro" no debe exceder los ${MAX_CHAR_LIMIT} caracteres.`;
      }

      if (gravedad === AlertaGravedad.INFORMATIVA && !detalleOtroGravedad.trim()) {
        newErrors.detalleOtroGravedad = 'Por favor, describe en detalle qué significa este caso especial ("Otro a considerar").';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Submit report to App.tsx State
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    let finalDescripcionOtros = descripcionOtros.trim();
    if (gravedad === AlertaGravedad.INFORMATIVA && detalleOtroGravedad.trim()) {
      finalDescripcionOtros = `[Detalle Otro a considerar: ${detalleOtroGravedad.trim()}]${finalDescripcionOtros ? '\n\n' + finalDescripcionOtros : ''}`;
    }

    // Save user to simulated subscriber listing if they checked opt-in
    if (deseaAlertas) {
      const finalProv = pais === 'Argentina' ? provincia : provinciaPersonalizada.trim();
      saveSubscriber({
        email: emailAlertas.trim().toLowerCase(),
        scope: alcanceAlertas === 'localidad' ? 'local' : 'national',
        localidad: finalProv
      });
    }

    const nuevaAlerta: Alerta = {
      id: `alert-${Date.now()}`,
      nombreSujeto: nombreSujeto.trim(),
      identificacion: identificacion.trim() || undefined,
      telefono: telefono.trim() || undefined,
      localidad: localidad.trim(),
      redesSociales: redesSociales.map(p => ({ ...p, handleOrUrl: p.handleOrUrl.trim() })),
      motivos: selectedMotivos,
      gravedad: gravedad,
      evidencias: selectedEvidencias,
      descripcionOtros: finalDescripcionOtros,
      fechaCreacion: new Date().toISOString(),
      creadorRefugio: creadorRefugio.trim(),
      creadorEmail: creadorEmail.trim().toLowerCase(),
      verificado: userSession?.role === 'admin', // auto-verified if loaded by admin
      adjuntos: adjuntos
    };

    onAddAlerta(nuevaAlerta);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden text-gray-800 animate-fade-in" id="form-alerta-wrapper">
      {/* Step Indicator Header */}
      <div className="bg-slate-50 border-b border-gray-100 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              Paso {step} de 4
            </span>
            <h2 className="text-base font-display font-semibold text-slate-900 mt-1">
              {step === 1 && 'Identidad de la Persona'}
              {step === 2 && 'Perfiles en Redes Sociales'}
              {step === 3 && 'Motivos y Detalles de la Alerta'}
              {step === 4 && 'Revisión Final de Alerta'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cancelar y volver"
            id="btn-cancel-form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {/* STEP 1: IDENTIDAD DE LA PERSONA */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in" id="form-step-1">
            <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl flex gap-3 text-amber-900 text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p className="leading-relaxed">
                <strong>¿Cómo rellenar este formulario?</strong> Para evitar cualquier confusión, este paso está dividido en dos secciones obligatorias. En la primera parte debes ingresar la información de la <strong>persona denunciada (el mal adoptante)</strong>, y en la segunda parte debes colocar <strong>tus datos como rescatista/refugio reportante</strong> (los cuales son 100% privados y no se muestran al público).
              </p>
            </div>

            {/* SECCIÓN 1: DATOS DEL DENUNCIADO (EL MAL ADOPTANTE) */}
            <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5 md:p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
                <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Sección 1</span>
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Datos del Mal Adoptante a Registrar (Denunciado)
                </h3>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <label htmlFor="nombreSujeto" className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  Nombre Completo o Alias del Mal Adoptante <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  id="nombreSujeto"
                  type="text"
                  placeholder="Ej. Juan Pérez (o alias como 'Juancito' - No ingresar el '@')"
                  value={nombreSujeto}
                  onChange={(e) => {
                    setNombreSujeto(e.target.value);
                    if (errors.nombreSujeto) setErrors({ ...errors, nombreSujeto: '' });
                  }}
                  className={`w-full bg-white border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all ${
                    errors.nombreSujeto ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                  }`}
                />
                <p className="text-[11px] text-slate-500">
                  💡 <strong>¿Lleva '@'?</strong> No es necesario ingresar el símbolo <code>@</code> en este campo (ej. escribe <code>Juancito</code> o <code>Juan Pérez</code>). Si tienes el usuario de su red social, podrás registrarlo con su respectivo <code>@</code> en el <strong>Paso 2</strong>.
                </p>
                {errors.nombreSujeto && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errors.nombreSujeto}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identificación (DNI / RUT) */}
                <div className="space-y-2">
                  <label htmlFor="identificacion" className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-rose-500" />
                    Documento / Identificación del Denunciado (Opcional)
                  </label>
                  <input
                    id="identificacion"
                    type="text"
                    placeholder="Ej. 11111111 (Solo números sin puntos ni guiones)"
                    value={identificacion}
                    onChange={(e) => setIdentificacion(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-gray-500">Solo números sin puntos, espacios o guiones.</p>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label htmlFor="telefono" className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    Número de Teléfono del Denunciado (Opcional)
                  </label>
                  <input
                    id="telefono"
                    type="text"
                    placeholder="Ej. 541155550101 (Solo números sin signos ni espacios)"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-gray-500">Solo números sin prefijo "+", espacios o guiones.</p>
                </div>
              </div>

              {/* UBICACIÓN GEOGRÁFICA SELECTOR */}
              <div className="space-y-4 pt-2">
                <div className="border-t border-slate-150 my-4"></div>
                
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                  Ubicación de Residencia / Zona de Operación
                </h4>

                {/* Autodetectar botón */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      ¿Completar automáticamente?
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      El sistema utilizará tu señal GPS o dirección IP pública (100% segura) para rellenar los datos de zona geográfica al instante.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border transition-all cursor-pointer select-none shrink-0 ${
                      isDetectingLocation 
                        ? 'bg-slate-100 text-slate-400 border-slate-200' 
                        : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50 shadow-xs active:scale-95'
                    }`}
                  >
                    {isDetectingLocation ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        Obteniendo ubicación...
                      </>
                    ) : (
                      <>
                        <span>📍 Autodetectar Ubicación</span>
                      </>
                    )}
                  </button>
                </div>

                {locationDetectError && (
                  <div className="text-[11px] text-amber-700 font-medium flex items-start gap-1.5 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <strong>Aviso de Autocompletado:</strong> {locationDetectError}
                    </div>
                  </div>
                )}
                {locationDetectSuccess && (
                  <div className="text-[11px] text-emerald-800 font-medium flex items-start gap-1.5 bg-emerald-50 border border-emerald-150 p-3 rounded-xl">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      {locationDetectSuccess}
                    </div>
                  </div>
                )}

                {/* Inputs de Ubicación en Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                  {/* País */}
                  <div className="space-y-1.5">
                    <label htmlFor="select-pais" className="block text-[11px] font-bold uppercase text-slate-500">
                      País
                    </label>
                    <select
                      id="select-pais"
                      value={pais}
                      onChange={(e) => {
                        setPais(e.target.value);
                        setProvincia('');
                        setCiudad('');
                        setPaisPersonalizado('');
                        setProvinciaPersonalizada('');
                      }}
                      className="w-full bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    >
                      <option value="Argentina">🇦🇷 Argentina</option>
                      <option value="Otro">🌐 Otro País / Internacional</option>
                    </select>
                  </div>

                  {/* Provincia o Provincia personalizada */}
                  {pais === 'Argentina' ? (
                    <div className="space-y-1.5">
                      <label htmlFor="select-provincia" className="block text-[11px] font-bold uppercase text-slate-500">
                        Provincia <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        id="select-provincia"
                        value={provincia}
                        onChange={(e) => {
                          setProvincia(e.target.value);
                          if (errors.provincia) setErrors({ ...errors, provincia: '' });
                        }}
                        className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 ${
                          errors.provincia ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                        }`}
                      >
                        <option value="">-- Selecciona Provincia --</option>
                        {PROVINCIAS_ARGENTINA.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                      </select>
                      {errors.provincia && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-sans">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {errors.provincia}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="input-pais-personalizado" className="block text-[11px] font-bold uppercase text-slate-500">
                          Especificar País <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          id="input-pais-personalizado"
                          type="text"
                          placeholder="Ej. Uruguay"
                          value={paisPersonalizado}
                          onChange={(e) => {
                            setPaisPersonalizado(e.target.value);
                            if (errors.paisPersonalizado) setErrors({ ...errors, paisPersonalizado: '' });
                          }}
                          className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 ${
                            errors.paisPersonalizado ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {errors.paisPersonalizado && (
                          <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-sans">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {errors.paisPersonalizado}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="input-provincia-personalizada" className="block text-[11px] font-bold uppercase text-slate-500">
                          Provincia / Estado <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          id="input-provincia-personalizada"
                          type="text"
                          placeholder="Ej. Montevideo"
                          value={provinciaPersonalizada}
                          onChange={(e) => {
                            setProvinciaPersonalizada(e.target.value);
                            if (errors.provinciaPersonalizada) setErrors({ ...errors, provinciaPersonalizada: '' });
                          }}
                          className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 ${
                            errors.provinciaPersonalizada ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {errors.provinciaPersonalizada && (
                          <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-sans">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {errors.provinciaPersonalizada}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Ciudad / Localidad */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label htmlFor="input-ciudad" className="block text-[11px] font-bold uppercase text-slate-500">
                      Localidad / Barrio <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-ciudad"
                      type="text"
                      placeholder="Ej. San Isidro"
                      value={ciudad}
                      onChange={(e) => {
                        setCiudad(e.target.value);
                        if (errors.ciudad) setErrors({ ...errors, ciudad: '' });
                      }}
                      className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 ${
                        errors.ciudad ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.ciudad && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-sans">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {errors.ciudad}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-[11px] text-slate-600 font-medium">
                    Ubicación que se guardará: <strong className="text-rose-700">{localidad || '(Completa los campos obligatorios)'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL DENUNCIANTE (TUS DATOS - 100% CONFIDENCIALES) */}
            <div className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-5 md:p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Sección 2</span>
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Tus Datos como Remitente / Rescatista (100% Confidencial y Oculto)
                </h3>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-900 text-xs leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  🛡️ <strong>Garantía de Resguardo Absoluto:</strong> Tu identidad (nombre de rescatista o refugio) y tu correo electrónico <strong>están protegidos y NUNCA se mostrarán al público en general</strong>. Sólo se utilizan de manera de auditoría interna para control de fraudes, validación y para enviarte una copia sellada de tu reporte por correo.
                </p>
              </div>

              {userSession && (
                <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sesión activa verificada. Los datos de tu perfil rescatista se han autocompletado con total seguridad.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Refugio que reporta */}
                <div className="space-y-2">
                  <label htmlFor="creadorRefugio" className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Nombre de tu Refugio o Nombre como Rescatista <span className="text-indigo-600 font-bold">*</span>
                  </label>
                  <input
                    id="creadorRefugio"
                    type="text"
                    disabled={!!userSession}
                    placeholder="Ej. Protectora Patitas del Oeste"
                    value={creadorRefugio}
                    onChange={(e) => {
                      setCreadorRefugio(e.target.value);
                      if (errors.creadorRefugio) setErrors({ ...errors, creadorRefugio: '' });
                    }}
                    className={`w-full bg-white border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                      errors.creadorRefugio ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                    } ${userSession ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                  />
                  {errors.creadorRefugio && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {errors.creadorRefugio}
                    </p>
                  )}
                </div>

                {/* Correo de copia */}
                <div className="space-y-2">
                  <label htmlFor="creadorEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Tu Correo Electrónico de Contacto <span className="text-indigo-600 font-bold">*</span>
                  </label>
                  <input
                    id="creadorEmail"
                    type="email"
                    disabled={!!userSession}
                    placeholder="Ej. mi.refugio@correo.com"
                    value={creadorEmail}
                    onChange={(e) => {
                      setCreadorEmail(e.target.value);
                      if (errors.creadorEmail) setErrors({ ...errors, creadorEmail: '' });
                    }}
                    className={`w-full bg-white border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                      errors.creadorEmail ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                    } ${userSession ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                  />
                  {errors.creadorEmail && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {errors.creadorEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* BOLETÍN / SUSCRIPCIÓN A NUEVAS ALERTAS */}
              <div className="border-t border-indigo-100/50 pt-5 mt-4 space-y-4">
                <div className="flex items-start gap-2.5">
                  <input
                    id="checkbox-alertas"
                    type="checkbox"
                    checked={deseaAlertas}
                    onChange={(e) => setDeseaAlertas(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <label htmlFor="checkbox-alertas" className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center gap-1">
                      <span>🔔 Deseo suscribirme para recibir avisos de nuevos reportes registrados</span>
                    </label>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Si tildas esta opción, el sistema te enviará alertas automáticas por correo electrónico cada vez que se registre una nueva denuncia en el país o en tu localidad, protegiendo siempre la confidencialidad del informante (excluyendo datos personales).
                    </p>
                  </div>
                </div>

                {deseaAlertas && (
                  <div className="bg-white border border-indigo-100 rounded-xl p-4 ml-6 space-y-4 animate-fade-in shadow-xs">
                    {/* Selección de Alcance */}
                    <div className="space-y-2">
                      <span className="block text-[11px] font-bold uppercase text-indigo-600 font-mono">
                        Alcance de las Notificaciones
                      </span>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="radio"
                            name="alcanceAlertas"
                            value="localidad"
                            checked={alcanceAlertas === 'localidad'}
                            onChange={() => setAlcanceAlertas('localidad')}
                            className="text-indigo-600 focus:ring-indigo-500 font-medium cursor-pointer"
                          />
                          <span>Solo reportes de mi provincia ({provincia || provinciaPersonalizada || 'No seleccionada'})</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="radio"
                            name="alcanceAlertas"
                            value="pais"
                            checked={alcanceAlertas === 'pais'}
                            onChange={() => setAlcanceAlertas('pais')}
                            className="text-indigo-600 focus:ring-indigo-500 font-medium cursor-pointer"
                          />
                          <span>Reportes de todo el país (Nivel Nacional)</span>
                        </label>
                      </div>
                    </div>

                    {/* Email de Envío de alertas */}
                    <div className="space-y-1.5 max-w-md">
                      <label htmlFor="input-email-alertas" className="block text-[11px] font-bold uppercase text-slate-500 font-semibold">
                        Correo Electrónico para Recibir Alertas <span className="text-indigo-600 font-bold">*</span>
                      </label>
                      <input
                        id="input-email-alertas"
                        type="email"
                        placeholder="Ej. mi.refugio.alertas@correo.com"
                        value={emailAlertas}
                        onChange={(e) => {
                          setEmailAlertas(e.target.value);
                          if (errors.emailAlertas) setErrors({ ...errors, emailAlertas: '' });
                        }}
                        className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          errors.emailAlertas ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                        }`}
                      />
                      {errors.emailAlertas ? (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-sans">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {errors.emailAlertas}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500">
                          Por defecto se autocompleta con tu correo de contacto principal, pero puedes especificar uno alternativo.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REDES SOCIALES DEL INFRACTOR */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in" id="form-step-2">
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex gap-3 text-emerald-800 text-xs">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">¿Por qué perfiles individuales?</span>
                La usabilidad mejora al permitir el registro granular. No escribas solo "Facebook" de forma general, coloca el enlace directo o el usuario exacto para que el buscador de la aplicación logre coincidencias perfectas.
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-800">
                  Perfiles en Redes Sociales ({redesSociales.length})
                </span>
                <button
                  type="button"
                  onClick={addSocialProfile}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                  id="btn-add-social"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Red Social
                </button>
              </div>

              <div className="space-y-3">
                {redesSociales.map((profile, index) => (
                  <div key={profile.id} className="flex gap-2 items-center bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    <select
                      value={profile.platform}
                      onChange={(e) => updateSocialProfile(profile.id, 'platform', e.target.value as SocialPlatform)}
                      className="bg-white border border-gray-200 px-2.5 py-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 w-36 shrink-0"
                    >
                      {Object.values(SocialPlatform).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder={
                        profile.platform === SocialPlatform.INSTAGRAM ? 'Ej. @usuario_infractor' :
                        profile.platform === SocialPlatform.FACEBOOK ? 'Ej. facebook.com/nombre.apellido' :
                        'Nombre de usuario o enlace directo...'
                      }
                      value={profile.handleOrUrl}
                      onChange={(e) => updateSocialProfile(profile.id, 'handleOrUrl', e.target.value)}
                      className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />

                    <button
                      type="button"
                      onClick={() => removeSocialProfile(profile.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                      title="Eliminar red social"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {errors.social && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {errors.social}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PREGUNTAS CERRADAS Y "OTRO" (MAX 1300 CHR) */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in" id="form-step-3">
            {/* Motivos - Preguntas Cerradas */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  Motivos de la Alerta (Selección Múltiple) <span className="text-red-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(activeTooltip === 'motivos' ? null : 'motivos')}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                  title="¿Por qué preguntas cerradas?"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {activeTooltip === 'motivos' && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed relative">
                  <button 
                    type="button" 
                    onClick={() => setActiveTooltip(null)} 
                    className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <strong>¿Por qué estas preguntas cerradas?</strong><br />
                  Permiten categorizar las alertas sin depender de la redacción libre. Esto optimiza la base de datos permitiendo filtros de búsqueda rápidos y precisos que otros refugios puedan interpretar al instante.
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5">
                {Object.values(AlertaMotivo).map((motivo) => {
                  const isChecked = selectedMotivos.includes(motivo);
                  return (
                    <label 
                      key={motivo} 
                      className={`flex gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all items-start ${
                        isChecked 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-medium' 
                          : 'bg-slate-50/40 border-gray-100 text-slate-600 hover:bg-slate-50 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMotivo(motivo)}
                        className="mt-0.5 accent-indigo-600 shrink-0"
                      />
                      <span className="leading-relaxed">{motivo}</span>
                    </label>
                  );
                })}
              </div>
              {errors.motivos && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {errors.motivos}
                </p>
              )}
            </div>

            {/* Gravedad (Opción Única) */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-slate-900 block">
                Nivel de Gravedad Asignado <span className="text-red-500">*</span>
              </span>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(AlertaGravedad).map((g) => {
                  const isSelected = gravedad === g;
                  let colorClass = 'border-amber-200 text-amber-900 bg-amber-50/30';
                  let activeDot = 'bg-amber-500';

                  if (g === AlertaGravedad.CRITICA) {
                    colorClass = isSelected ? 'bg-red-50 border-red-200 text-red-950 font-medium shadow-xs' : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100/40';
                    activeDot = 'bg-red-500';
                  } else if (g === AlertaGravedad.ALTA) {
                    colorClass = isSelected ? 'bg-orange-50 border-orange-200 text-orange-950 font-medium shadow-xs' : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100/40';
                    activeDot = 'bg-orange-500';
                  } else if (g === AlertaGravedad.MEDIA) {
                    colorClass = isSelected ? 'bg-yellow-50 border-yellow-200 text-yellow-950 font-medium shadow-xs' : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100/40';
                    activeDot = 'bg-yellow-500';
                  } else {
                    colorClass = isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-medium shadow-xs' : 'bg-slate-50/50 border-gray-100 text-slate-600 hover:bg-slate-100/40';
                    activeDot = 'bg-indigo-500';
                  }

                  const parts = g.match(/^([^(]+)\s*(.*)$/);
                  const titleText = parts ? parts[1].trim() : g;
                  const explanationText = parts && parts[2] ? parts[2].trim() : '';

                  return (
                    <label 
                      key={g} 
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${colorClass}`}
                    >
                      <input
                        type="radio"
                        name="gravedad"
                        checked={isSelected}
                        onChange={() => {
                          setGravedad(g);
                          if (g !== AlertaGravedad.INFORMATIVA) {
                            setDetalleOtroGravedad('');
                          }
                        }}
                        className="accent-slate-700 cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className={`w-2 h-2 rounded-full ${activeDot}`}></span>
                          {titleText}
                        </span>
                        {explanationText && (
                          <span className="text-slate-500 text-[11px] font-normal pl-3.5 leading-relaxed">
                            {explanationText}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Space to detail "Otro a considerar" */}
              {gravedad === AlertaGravedad.INFORMATIVA && (
                <div className="mt-3 p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-xl space-y-2 animate-fade-in">
                  <label htmlFor="detalleOtroGravedad" className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    💡 Detalle para 'Otro a considerar' <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="detalleOtroGravedad"
                    rows={2}
                    placeholder="Detalla aquí por qué consideras que este caso debe registrarse (por ejemplo: sospechas fundadas, comportamiento sospechoso en la entrevista, etc.)"
                    value={detalleOtroGravedad}
                    onChange={(e) => {
                      setDetalleOtroGravedad(e.target.value);
                      if (errors.detalleOtroGravedad) setErrors({ ...errors, detalleOtroGravedad: '' });
                    }}
                    className={`w-full bg-white border px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none ${
                      errors.detalleOtroGravedad ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.detalleOtroGravedad && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {errors.detalleOtroGravedad}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Evidencias a compartir */}
            <div className="space-y-4 pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-slate-900 block">
                Evidencias a compartir
              </span>

              {/* Checkboxes de tipo de evidencia */}
              <div className="space-y-2">
                <span className="text-[11px] text-gray-500 block font-medium">Selecciona el tipo de evidencias que posees:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(AlertaEvidencia).map((evidencia) => {
                    const isChecked = selectedEvidencias.includes(evidencia);
                    return (
                      <label 
                        key={evidencia} 
                        className={`flex gap-2.5 p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all items-center ${
                          isChecked 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium' 
                            : 'bg-slate-50/40 border-gray-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEvidencia(evidencia)}
                          className="accent-emerald-600 shrink-0"
                        />
                        <span>{evidencia}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Drag and Drop File Uploader Card */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Adjuntar archivos de respaldo (Fotos, Videos, Audios y PDF)
                </label>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/40' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
                  }`}
                >
                  <input 
                    type="file"
                    id="file-input"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,video/mp4,application/pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-indigo-600 hover:text-indigo-700">Haz clic para buscar</span> o arrastra y suelta tus archivos aquí
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
                      <strong>Formatos permitidos:</strong> Fotos (PNG, JPG, WEBP, GIF), Videos en MP4, Audios/Música (MP3, WAV, OGG, M4A) y Documentos (PDF).
                      <br />
                      <span className="font-medium text-indigo-600">Permite hasta 10 archivos en total.</span>
                    </p>
                  </div>
                </div>

                {errors.adjuntos && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1 bg-red-50 p-2.5 rounded-lg border border-red-100">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errors.adjuntos}
                  </p>
                )}

                {/* List of attachments */}
                {adjuntos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 px-1">
                      <span>Archivos listos para enviar ({adjuntos.length} de 10)</span>
                      <button 
                        type="button" 
                        onClick={() => setAdjuntos([])}
                        className="text-red-500 hover:text-red-600 hover:underline border-0 bg-transparent p-0 cursor-pointer"
                      >
                        Quitar todos
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {adjuntos.map((file, index) => {
                        let IconComponent = FileText;
                        if (file.type.startsWith('image/')) {
                          IconComponent = FileImage;
                        } else if (file.type.startsWith('video/')) {
                          IconComponent = Video;
                        } else if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.ogg') || file.name.endsWith('.m4a')) {
                          IconComponent = Music;
                        }

                        const sizeInKb = (file.size / 1024).toFixed(1);
                        const sizeText = file.size > 1024 * 1024 
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                          : `${sizeInKb} KB`;

                        return (
                          <div 
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                              {file.base64 && file.type.startsWith('image/') ? (
                                <img 
                                  src={file.base64} 
                                  alt={file.name} 
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="p-2 bg-white text-slate-600 border border-slate-100 rounded-lg shrink-0">
                                  <IconComponent className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {sizeText} • {file.type.split('/').pop()?.toUpperCase() || 'ARCHIVO'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAdjunto(index)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all shrink-0 border-0 bg-transparent cursor-pointer"
                              title="Eliminar archivo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cuadro "Otro" - Limite estricto 1300 caracteres */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <label htmlFor="descripcionOtros" className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  Otro / Detalles Adicionales de la Alerta
                </label>
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                  descripcionOtros.length >= MAX_CHAR_LIMIT - 50 
                    ? 'bg-red-50 text-red-600 font-bold' 
                    : descripcionOtros.length >= MAX_CHAR_LIMIT - 200 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {descripcionOtros.length} / {MAX_CHAR_LIMIT} caracteres
                </span>
              </div>
              <textarea
                id="descripcionOtros"
                rows={4}
                maxLength={MAX_CHAR_LIMIT}
                placeholder="Ingresa aquí detalles específicos que no queden cubiertos por las preguntas cerradas anteriores (Ej. actitudes en la entrevista, testimonios de vecinos, historial detallado...). Límite máximo 1300 caracteres."
                value={descripcionOtros}
                onChange={(e) => {
                  setDescripcionOtros(e.target.value);
                  if (errors.descripcionOtros) setErrors({ ...errors, descripcionOtros: '' });
                }}
                className={`w-full bg-slate-50 border px-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none ${
                  errors.descripcionOtros ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                }`}
              />
              {errors.descripcionOtros && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {errors.descripcionOtros}
                </p>
              )}
              <p className="text-[10px] text-gray-500">
                Usa este campo para aportar información singular. Trata de mantener la descripción objetiva y basada en hechos constatables.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMACIÓN Y REVISIÓN */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in" id="form-step-4">
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-900 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Paso de Usabilidad Crítico: Envío de Copias</strong>
                Al confirmar la alerta, **nuestro sistema enviará automáticamente una copia en PDF/texto** a tu correo electrónico registrado (<code>{creadorEmail}</code>) y otra copia para auditoría al Administrador Central.
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Reportado</span>
                  <strong className="text-sm text-slate-900">{nombreSujeto}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Localidad</span>
                  <strong className="text-slate-800">{localidad}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Identificación</span>
                  <span className="text-slate-800">{identificacion || 'No provisto'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Teléfono</span>
                  <span className="text-slate-800">{telefono || 'No provisto'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Tus datos (Privados)</span>
                  <strong className="text-indigo-700">{creadorRefugio} ({creadorEmail})</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Nivel de Gravedad</span>
                  <span className={`inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 mt-0.5 ${
                    gravedad === AlertaGravedad.CRITICA ? 'bg-red-50 text-red-700' :
                    gravedad === AlertaGravedad.ALTA ? 'bg-orange-50 text-orange-700' :
                    gravedad === AlertaGravedad.MEDIA ? 'bg-yellow-50 text-yellow-800' :
                    'bg-indigo-50 text-indigo-700'
                  }`}>
                    {gravedad}
                  </span>
                </div>
              </div>

              {/* Redes Sociales cargadas */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold mb-1.5">Perfiles Vinculados</span>
                <div className="flex flex-wrap gap-2">
                  {redesSociales.map((profile, i) => (
                    <span key={i} className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono text-[10px]">
                      <span className="text-indigo-600 font-semibold">{profile.platform}:</span>
                      {profile.handleOrUrl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Motivos cargados */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold mb-1.5">Motivos Seleccionados</span>
                {selectedMotivos.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                    {selectedMotivos.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-amber-600 italic font-medium">Ningún motivo cerrado seleccionado (se confía únicamente en descripción libre).</span>
                )}
              </div>

              {/* Evidencias cargadas */}
              {selectedEvidencias.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold mb-1.5">Evidencias que constan</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvidencias.map((e, idx) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md px-2 py-0.5 text-[10px]">
                        ✓ {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripcion otros */}
              {descripcionOtros.trim() && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold mb-1">Detalles de "Otro"</span>
                  <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 italic leading-relaxed whitespace-pre-line text-[11px]">
                    "{descripcionOtros}"
                  </p>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-xl text-amber-950 text-xs leading-relaxed">
              <strong>Declaración de Responsabilidad:</strong> Al registrar este reporte, declaro bajo juramento que los datos suministrados son fidedignos y que poseo o mi organización posee las evidencias declaradas en caso de requerirse aclaraciones adicionales.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-back-form"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 font-medium text-xs px-4 py-2 transition-colors cursor-pointer"
              id="btn-cancel-bottom"
            >
              Cancelar
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={(e) => handleNext(e)}
                className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                id="btn-next-form"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide uppercase px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10 hover:shadow-lg hover:shadow-rose-600/20 active:scale-98 cursor-pointer"
                id="btn-submit-form"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                Registrar Mal Adoptante y Notificar
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
