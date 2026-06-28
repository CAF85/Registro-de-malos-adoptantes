/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SocialPlatform {
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
  X_TWITTER = 'X / Twitter',
  TIKTOK = 'TikTok',
  WHATSAPP = 'WhatsApp (Número)',
  OTHER = 'Otro / Enlace Web',
}

export interface SocialProfile {
  id: string;
  platform: SocialPlatform;
  handleOrUrl: string;
}

export enum AlertaMotivo {
  MALTRATO_FISICO = 'Maltrato físico directo o violencia física constatada',
  NEGLIGENCIA_SEVERA = 'Negligencia severa (privación de alimento, agua, refugio o atención veterinaria)',
  ABANDONO = 'Abandono de un animal previamente adoptado',
  DEVOLUCION_REITERADA = 'Devoluciones múltiples de mascotas por motivos injustificados o negligentes',
  DATOS_FALSOS = 'Presentación de información, identidad o documentos falsos en el proceso de adopción',
  EXPLOTACION_CRIA = 'Uso de animales para peleas, cría clandestina ilegal o explotación comercial',
  NEGATIVA_SEGUIMIENTO = 'Negativa a firmar contratos de adopción o impedir el seguimiento post-adopción',
  FALTA_CONDICIONES = 'Hogar inseguro o falta de condiciones mínimas de espacio, salubridad y seguridad',
}

export enum AlertaGravedad {
  CRITICA = 'Crítica (Peligro inminente de vida, maltrato directo, peleas)',
  ALTA = 'Alta (Abandono previo, explotación comercial o negligencia grave)',
  MEDIA = 'Media (Mentiras en adopción, negativa a seguimiento, malas condiciones)',
  INFORMATIVA = 'Otro a considerar (Cualquier otra sospecha, caso especial o comportamiento que consideres riesgoso)',
}

export enum AlertaEvidencia {
  CHAT_SCREENSHOT = 'Capturas de pantalla de conversaciones (WhatsApp/Mensajería)',
  PHOTOS_VIDEOS = 'Registro fotográfico o fílmico de las condiciones o estado físico',
  DENUNCIA_POLICIAL = 'Denuncia judicial o policial formal radicada',
  TESTIMONIOS = 'Testimonios verificados de otros refugios o rescatistas',
  ENTREVISTA_SOSPECHOSA = 'Ninguna - Basado exclusivamente en inconsistencias graves detectadas en entrevista',
}

export interface Alerta {
  id: string;
  nombreSujeto: string;
  identificacion?: string; // DNI, RUT, Cédula (opcional para proteger privacidad si se desea, pero muy útil para búsquedas exactas)
  telefono?: string;
  localidad: string;
  redesSociales: SocialProfile[];
  motivos: AlertaMotivo[];
  gravedad: AlertaGravedad;
  evidencias: AlertaEvidencia[];
  descripcionOtros: string; // "Otro" - Máximo 1300 caracteres
  fechaCreacion: string;
  creadorRefugio: string; // Nombre del refugio o rescatista que reporta
  creadorEmail: string; // Correo para recibir copia de la alerta (OBLIGATORIO para el remitente)
  verificado: boolean;
  adjuntos?: { name: string; size: number; type: string; base64?: string }[];
}

export interface EmailLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'simulado' | 'enviado' | 'error';
}

export interface UserSession {
  email: string;
  role: 'admin' | 'user';
  name?: string;
  refugio?: string;
}

