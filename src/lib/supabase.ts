/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Alerta, EmailLog, UserSession } from '../types';
import { MOCK_ALERTAS } from '../data/mockData';

// We get variables using import.meta.env
const supabaseUrl = (((import.meta as any).env?.VITE_SUPABASE_URL) || '').trim();
const supabaseAnonKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '').trim();

// True if Supabase is properly configured with real credentials
export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

// Lazy initialization of Supabase client to prevent crashes if credentials are bad
let supabaseInstance: any = null;
export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return supabaseInstance;
}

// Simulated session storage keys
const AUTH_USER_KEY = 'rmaa_auth_user';
const SIM_ALERTAS_KEY = 'rmaa_sim_alertas';
const SIM_EMAILS_KEY = 'rmaa_sim_emails';

// Standard fallback mock administrator email
export const ADMINISTRATOR_EMAIL = 'claudia.filiel@gmail.com';

// Local storage helper for mock database fallback
function getLocalAlertas(): Alerta[] {
  const stored = localStorage.getItem(SIM_ALERTAS_KEY);
  if (stored) {
    try { 
      const parsed = JSON.parse(stored);
      // Reset if the cache contains the legacy real-name examples to protect privacy
      const hasLegacyData = parsed.some((a: any) => 
        a.nombreSujeto.includes('Carlos Manuel') || 
        a.nombreSujeto.includes('Mariela') || 
        a.nombreSujeto.includes('Javier') || 
        a.nombreSujeto.includes('Esteban') ||
        a.identificacion?.includes('41.298') ||
        a.identificacion?.includes('36.401')
      );
      if (!hasLegacyData) {
        return parsed; 
      }
    } catch { 
      return MOCK_ALERTAS; 
    }
  }
  // Initialize with enriched mock data (with creators' emails)
  const initialized = MOCK_ALERTAS.map(a => ({
    ...a,
    creadorEmail: 'refugio@ejemplo.org'
  }));
  localStorage.setItem(SIM_ALERTAS_KEY, JSON.stringify(initialized));
  return initialized;
}

function saveLocalAlertas(alertas: Alerta[]) {
  localStorage.setItem(SIM_ALERTAS_KEY, JSON.stringify(alertas));
}

// ---------------- AUTHENTICATION OPERATIONS ----------------
export async function getActiveSession(): Promise<UserSession | null> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching Supabase session:', error);
      } else if (session?.user) {
        // Return session mapping
        return {
          email: session.user.email || '',
          role: session.user.email === ADMINISTRATOR_EMAIL ? 'admin' : 'user',
          name: session.user.user_metadata?.name || 'Usuario Refugio',
          refugio: session.user.user_metadata?.refugio || 'Refugio Registrado'
        };
      }
    }
  }

  // Fallback to local session
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return null;
}

export async function loginUser(email: string, password?: string): Promise<UserSession> {
  const normalizedEmail = email.toLowerCase().trim();
  const isDemoAdmin = normalizedEmail === ADMINISTRATOR_EMAIL;
  
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password || '123456' // fallback default pass
      });
      if (error) throw error;
      if (data.user) {
        const session: UserSession = {
          email: data.user.email || normalizedEmail,
          role: data.user.email === ADMINISTRATOR_EMAIL ? 'admin' : 'user',
          name: data.user.user_metadata?.name || 'Usuario Conectado',
          refugio: data.user.user_metadata?.refugio || 'Refugio Supabase'
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session));
        return session;
      }
    }
  }

  // Fallback / Simulated login
  const session: UserSession = {
    email: normalizedEmail,
    role: isDemoAdmin ? 'admin' : 'user',
    name: isDemoAdmin ? 'Claudia Filiel (Admin)' : 'Refugio Amigo',
    refugio: isDemoAdmin ? 'Administrador Central' : 'Asociación Protectora Local'
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session));
  return session;
}

export async function registerUser(email: string, name: string, refugio: string): Promise<UserSession> {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: 'defaultPassword123!', // Simple default for demo signup, Vercel instructions will cover how to manage
        options: {
          data: { name, refugio }
        }
      });
      if (error) throw error;
      if (data.user) {
        const session: UserSession = {
          email: normalizedEmail,
          role: normalizedEmail === ADMINISTRATOR_EMAIL ? 'admin' : 'user',
          name,
          refugio
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session));
        return session;
      }
    }
  }

  // Fallback
  const session: UserSession = {
    email: normalizedEmail,
    role: normalizedEmail === ADMINISTRATOR_EMAIL ? 'admin' : 'user',
    name,
    refugio
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session));
  return session;
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
  localStorage.removeItem(AUTH_USER_KEY);
}


// ---------------- ALERTA OPERATIONS ----------------

export async function fetchAlertas(): Promise<Alerta[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .order('fechaCreacion', { ascending: false });
        
      if (!error && data) {
        // Map from flat DB schema to structured JSON (Supabase parses JSON columns automatically if defined)
        return data.map((item: any) => ({
          id: item.id,
          nombreSujeto: item.nombre_sujeto,
          identificacion: item.identificacion,
          telefono: item.telefono,
          localidad: item.localidad,
          redesSociales: typeof item.redes_sociales === 'string' ? JSON.parse(item.redes_sociales) : item.redes_sociales,
          motivos: typeof item.motivos === 'string' ? JSON.parse(item.motivos) : item.motivos,
          gravedad: item.gravedad,
          evidencias: typeof item.evidencias === 'string' ? JSON.parse(item.evidencias) : item.evidencias,
          descripcionOtros: item.descripcion_otros,
          fechaCreacion: item.fecha_creacion,
          creadorRefugio: item.creador_refugio,
          creadorEmail: item.creador_email || 'anonimo@refugio.org',
          verificado: item.verificado
        }));
      }
      console.error('Supabase fetch failed, falling back to offline simulation:', error);
    }
  }

  return getLocalAlertas();
}

export async function createAlerta(alerta: Alerta): Promise<Alerta> {
  // Trigger simulation of emails
  await triggerEmailDelivery(alerta);

  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      // Map structures to db snake case format
      const dbRow = {
        id: alerta.id,
        nombre_sujeto: alerta.nombreSujeto,
        identificacion: alerta.identificacion,
        telefono: alerta.telefono,
        localidad: alerta.localidad,
        redes_sociales: alerta.redesSociales, // stores as jsonb
        motivos: alerta.motivos, // stores as jsonb
        gravedad: alerta.gravedad,
        evidencias: alerta.evidencias, // stores as jsonb
        descripcion_otros: alerta.descripcionOtros,
        fecha_creacion: alerta.fechaCreacion,
        creador_refugio: alerta.creadorRefugio,
        creador_email: alerta.creadorEmail,
        verificado: alerta.verificado
      };

      const { error } = await supabase
        .from('alertas')
        .insert([dbRow]);

      if (!error) {
        return alerta;
      }
      console.error('Supabase insert failed, falling back to local storage:', error);
    }
  }

  const current = getLocalAlertas();
  const updated = [alerta, ...current];
  saveLocalAlertas(updated);
  return alerta;
}


// ---------------- EMAIL SIMULATION, SUBSCRIPTIONS & LOGS ----------------

export interface Subscriber {
  email: string;
  scope: 'local' | 'national';
  localidad: string; // Holds the Province/State name to match (e.g., "Buenos Aires")
}

const SIM_SUBSCRIBERS_KEY = 'rmaa_sim_subscribers';

export function getSubscribers(): Subscriber[] {
  const stored = localStorage.getItem(SIM_SUBSCRIBERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { return []; }
  }
  return [];
}

export function saveSubscriber(sub: Subscriber) {
  const subscribers = getSubscribers();
  const normalizedEmail = sub.email.toLowerCase().trim();
  const exists = subscribers.some(s => s.email.toLowerCase().trim() === normalizedEmail && s.scope === sub.scope && s.localidad === sub.localidad);
  if (!exists) {
    subscribers.push({
      email: normalizedEmail,
      scope: sub.scope,
      localidad: sub.localidad
    });
    localStorage.setItem(SIM_SUBSCRIBERS_KEY, JSON.stringify(subscribers));
  }
}

export function getEmailLogs(): EmailLog[] {
  const stored = localStorage.getItem(SIM_EMAILS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { return []; }
  }
  return [];
}

export async function triggerEmailDelivery(alerta: Alerta): Promise<void> {
  const subject = `[Registro Malos Adoptantes] Nueva Alerta Registrada: ${alerta.nombreSujeto}`;
  const htmlBody = `
========================================
RESUMEN DE ALERTA DE SEGURIDAD ANIMAL
========================================
Fecha de Registro: ${new Date(alerta.fechaCreacion).toLocaleString()}
ID de Alerta: ${alerta.id}
Nombre/Alias Reportado: ${alerta.nombreSujeto}
Ubicación: ${alerta.localidad}
Identificación/DNI: ${alerta.identificacion || 'No registrado'}
Número de Teléfono: ${alerta.telefono || 'No registrado'}

----------------------------------------
REDES SOCIALES VINCULADAS:
${alerta.redesSociales.map(r => `• [${r.platform}] ${r.handleOrUrl}`).join('\n')}

----------------------------------------
MOTIVOS SELECCIONADOS:
${alerta.motivos.map(m => `• ${m}`).join('\n')}
Gravedad Asignada: ${alerta.gravedad}

----------------------------------------
EVIDENCIAS DECLARADAS:
${alerta.evidencias.map(e => `• ${e}`).join('\n')}

----------------------------------------
INFORMACIÓN ADICIONAL ("OTRO"):
"${alerta.descripcionOtros || 'Sin descripción adicional'}"

----------------------------------------
ORGANIZACIÓN REMITENTE (DATOS COMPLETOS):
Nombre: ${alerta.creadorRefugio}
Correo de Copia: ${alerta.creadorEmail}

---
Aviso legal: Esta copia es confidencial y ha sido generada automáticamente para constancia. Por favor, asegúrese de haber radicado la denuncia penal/policial por maltrato animal en su comisaría o fiscalía correspondiente.
  `;

  const logs = getEmailLogs();
  const logsToAdd: EmailLog[] = [];

  // Log 1: Sent to Rescuer
  logsToAdd.push({
    id: `email-rescuer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    from: 'sistema@registro-malosadoptantes.org',
    to: alerta.creadorEmail,
    subject: `Copia de Reporte: ${subject}`,
    body: htmlBody,
    sentAt: new Date().toISOString(),
    status: 'simulado'
  });

  // Log 2: Sent to Admin Claudia Filiel (filielclaudia@gmail.com / ADMINISTRATOR_EMAIL)
  logsToAdd.push({
    id: `email-admin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    from: 'sistema@registro-malosadoptantes.org',
    to: ADMINISTRATOR_EMAIL,
    subject: `ALERTA ADMINISTRATIVA DETALLADA: ${subject}`,
    body: htmlBody,
    sentAt: new Date().toISOString(),
    status: 'simulado'
  });

  // 1. DNI / IDENTIFICATION MATCH WARNINGS
  const currentIdent = (alerta.identificacion || '').trim().replace(/\D/g, '');
  if (currentIdent) {
    const allAlerts = getLocalAlertas(); // Fetch local/current list
    const matches = allAlerts.filter(a => {
      const aIdent = (a.identificacion || '').trim().replace(/\D/g, '');
      return a.id !== alerta.id && aIdent === currentIdent;
    });

    if (matches.length > 0) {
      // Send warning to new reporter
      const matchingAlertsSummary = matches.map(m => `• Alerta ID: ${m.id} registrada el ${new Date(m.fechaCreacion).toLocaleDateString()} por el refugio/rescatista "${m.creadorRefugio}"`).join('\n');
      const duplicateSubject = `⚠️ [ANTECEDENTES DETECTADOS] Coincidencia de Documento de Identidad (DNI: ${alerta.identificacion})`;
      const duplicateBody = `
========================================
ALERTA DE SEGURIDAD: ANTECEDENTES COINCIDENTES DETECTADOS
========================================
Hola ${alerta.creadorRefugio},

El sistema de seguridad del Registro ha detectado que la persona que acabas de registrar, "${alerta.nombreSujeto}" con Documento Nº ${alerta.identificacion}, ya posee reportes previos en nuestra base de datos nacional.

REPORTES COINCIDENTES ENCONTRADOS:
${matchingAlertsSummary}

Te sugerimos ponerte en contacto con la administradora central (claudia.filiel@gmail.com) o revisar el buscador para coordinar con los otros refugios que efectuaron las alertas anteriores. Esto ayuda a fortalecer el resguardo y evitar adopciones negligentes.

---
Plataforma Unificada de Resguardo Animal.
      `;

      logsToAdd.push({
        id: `email-duplicate-new-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        from: 'sistema@registro-malosadoptantes.org',
        to: alerta.creadorEmail,
        subject: duplicateSubject,
        body: duplicateBody,
        sentAt: new Date().toISOString(),
        status: 'simulado'
      });

      // Send warning to each previous reporter
      matches.forEach(prevAlerta => {
        const prevDuplicateBody = `
========================================
ALERTA DE SEGURIDAD: NUEVA COINCIDENCIA DETECTADA
========================================
Hola ${prevAlerta.creadorRefugio},

Te escribimos para informarte que un nuevo refugio/rescatista ("${alerta.creadorRefugio}") ha registrado una alerta en la plataforma para un sujeto con el mismo Documento Nº ${alerta.identificacion} que registraste anteriormente.

DATOS DE LA NUEVA COINCIDENCIA REGISTRADA:
• Nombre del Sujeto: ${alerta.nombreSujeto}
• Localidad: ${alerta.localidad}
• Motivos: ${alerta.motivos.join(', ')}
• Fecha de Carga: ${new Date(alerta.fechaCreacion).toLocaleString()}

Recomendamos coordinar esfuerzos de resguardo de manera conjunta. Puedes contactar al nuevo reportante en el correo: ${alerta.creadorEmail}.

---
Plataforma Unificada de Resguardo Animal.
        `;

        logsToAdd.push({
          id: `email-duplicate-prev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          from: 'sistema@registro-malosadoptantes.org',
          to: prevAlerta.creadorEmail,
          subject: `⚠️ [NUEVO REPORTE COINCIDENTE] Se registró otra alerta con el mismo DNI (${alerta.identificacion})`,
          body: prevDuplicateBody,
          sentAt: new Date().toISOString(),
          status: 'simulado'
        });
      });
    }
  }

  // 2. DISPATCH EMAIL TO SUBSCRIBERS (Omitting reporter's personal details)
  const subscribers = getSubscribers();
  if (subscribers.length > 0) {
    const reportProvince = (alerta.localidad || '').split(',')[1]?.trim() || '';

    subscribers.forEach(sub => {
      const isNational = sub.scope === 'national';
      const isLocalMatch = sub.scope === 'local' && reportProvince && sub.localidad.toLowerCase().trim() === reportProvince.toLowerCase().trim();

      if (isNational || isLocalMatch) {
        const subSubject = `📢 [AVISO DE NUEVA DENUNCIA] Reporte registrado en ${isNational ? 'el país' : `tu localidad (${reportProvince})`}`;
        const subBody = `
========================================
NOTIFICACIÓN DE ALERTA DE NUEVA DENUNCIA (SUSCRIPCIÓN)
========================================
Se ha recibido un nuevo registro de mal adoptante en la plataforma. De acuerdo con tus preferencias de suscripción, te compartimos la información relevante (omitiendo datos de la organización denunciante por confidencialidad).

DATOS DEL MAL ADOPTANTE REPORTADO:
• Nombre/Alias: ${alerta.nombreSujeto}
• Ubicación: ${alerta.localidad}
• DNI/Identificación: ${alerta.identificacion || 'No registrado'}
• Teléfono: ${alerta.telefono || 'No registrado'}

REDES SOCIALES ASOCIADAS:
${alerta.redesSociales.map(r => `• [${r.platform}] ${r.handleOrUrl}`).join('\n')}

DETALLE DE LA ALERTA:
• Gravedad: ${alerta.gravedad}
• Motivos:
${alerta.motivos.map(m => `  - ${m}`).join('\n')}
• Evidencias aportadas:
${alerta.evidencias.map(e => `  - ${e}`).join('\n')}

INFORMACIÓN ADICIONAL ("OTRO"):
"${alerta.descripcionOtros || 'Sin descripción adicional'}"

----------------------------------------
DATOS DEL DENUNCIANTE (CONFIDENCIAL):
• Organización Remitente: [REDACTADO POR CONFIDENCIALIDAD]
• Correo Electrónico: [OCULTO POR CONFIDENCIALIDAD]

---
Te has suscrito para recibir alertas de la zona: ${isNational ? 'Todo el País' : reportProvince}. Si deseas cancelar la suscripción, puedes hacerlo desde el portal de Registro de Malos Adoptantes.
        `;

        logsToAdd.push({
          id: `email-subscriber-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          from: 'alertas@registro-malosadoptantes.org',
          to: sub.email,
          subject: subSubject,
          body: subBody,
          sentAt: new Date().toISOString(),
          status: 'simulado'
        });
      }
    });
  }

  const updatedLogs = [...logsToAdd, ...logs];
  localStorage.setItem(SIM_EMAILS_KEY, JSON.stringify(updatedLogs));
}


// ---------------- STATISTICS AND DATA MANAGEMENT ----------------

export interface Statistics {
  totalAlerts: number;
  byZone: { zone: string; count: number }[];
  bySocialPlatform: { platform: string; count: number }[];
  byMotivo: { motivo: string; count: number }[];
  unverifiedCount: number;
  criticalCount: number;
}

export function computeStatistics(alertas: Alerta[]): Statistics {
  const byZoneMap: { [key: string]: number } = {};
  const byPlatformMap: { [key: string]: number } = {};
  const byMotivoMap: { [key: string]: number } = {};
  let criticalCount = 0;
  let unverifiedCount = 0;

  alertas.forEach(a => {
    // 1. Compute gravity counts
    if (a.gravedad.includes('Crítica') || a.gravedad.includes('Critica')) {
      criticalCount++;
    }
    if (!a.verificado) {
      unverifiedCount++;
    }

    // 2. Zone parsing (group by city/locality - take first segment before comma for aggregation, or keep full)
    const zoneKey = a.localidad.split(',')[0].trim();
    byZoneMap[zoneKey] = (byZoneMap[zoneKey] || 0) + 1;

    // 3. Platform parsing
    a.redesSociales.forEach(p => {
      byPlatformMap[p.platform] = (byPlatformMap[p.platform] || 0) + 1;
    });

    // 4. Reason parsing
    a.motivos.forEach(m => {
      byMotivoMap[m] = (byMotivoMap[m] || 0) + 1;
    });
  });

  // Sort and format Zone
  const byZone = Object.entries(byZoneMap)
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count);

  // Sort and format Platform
  const bySocialPlatform = Object.entries(byPlatformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  // Sort and format Motivo
  const byMotivo = Object.entries(byMotivoMap)
    .map(([motivo, count]) => ({ motivo, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalAlerts: alertas.length,
    byZone,
    bySocialPlatform,
    byMotivo,
    unverifiedCount,
    criticalCount
  };
}
