/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Alerta, AlertaMotivo, AlertaGravedad, AlertaEvidencia, SocialPlatform } from '../types';

export const MOCK_ALERTAS: Alerta[] = [
  {
    id: 'alt-1',
    nombreSujeto: 'Ejemplo UNO',
    identificacion: '11111111',
    telefono: '541155550101',
    localidad: 'Buenos Aires, Argentina',
    redesSociales: [
      { id: 'rs-1-1', platform: SocialPlatform.INSTAGRAM, handleOrUrl: '@ejemplo_uno_ig' },
      { id: 'rs-1-2', platform: SocialPlatform.FACEBOOK, handleOrUrl: 'facebook.com/ejemplo.uno.fb' }
    ],
    motivos: [
      AlertaMotivo.EXPLOTACION_CRIA,
      AlertaMotivo.DATOS_FALSOS
    ],
    gravedad: AlertaGravedad.CRITICA,
    evidencias: [
      AlertaEvidencia.CHAT_SCREENSHOT,
      AlertaEvidencia.TESTIMONIOS
    ],
    descripcionOtros: 'Se detectó que el sujeto solicitaba cachorros de razas grandes en múltiples refugios usando datos falsificados. Tras consultas e investigaciones preventivas, se constató que la intención era la reproducción y venta ilegal en instalaciones precarias sin condiciones de bienestar animal básico.',
    fechaCreacion: '2026-05-12T14:30:00Z',
    creadorRefugio: 'Refugio Patitas Felices',
    creadorEmail: 'contacto@resguardo.org',
    verificado: true
  },
  {
    id: 'alt-2',
    nombreSujeto: 'Ejemplo DOS',
    identificacion: '22222222',
    telefono: '5493415550202',
    localidad: 'Rosario, Santa Fe',
    redesSociales: [
      { id: 'rs-2-1', platform: SocialPlatform.INSTAGRAM, handleOrUrl: '@ejemplo_dos_ig' },
      { id: 'rs-2-2', platform: SocialPlatform.TIKTOK, handleOrUrl: '@ejemplo_dos_tt' }
    ],
    motivos: [
      AlertaMotivo.ABANDONO,
      AlertaMotivo.NEGATIVA_SEGUIMIENTO
    ],
    gravedad: AlertaGravedad.ALTA,
    evidencias: [
      AlertaEvidencia.PHOTOS_VIDEOS,
      AlertaEvidencia.TESTIMONIOS
    ],
    descripcionOtros: 'Adoptó un cachorro mestizo de 6 meses de edad. Cortó todo canal de comunicación para el seguimiento preventivo rutinario a las dos semanas de la adopción. Posteriormente, el animal fue rescatado de la vía pública en estado de desnutrición severo.',
    fechaCreacion: '2026-06-01T10:15:00Z',
    creadorRefugio: 'Sociedad Protectora Rosario',
    creadorEmail: 'contacto@resguardo.org',
    verificado: true
  },
  {
    id: 'alt-3',
    nombreSujeto: 'Ejemplo TRES',
    identificacion: '33333333',
    telefono: '346005550303',
    localidad: 'Madrid, España',
    redesSociales: [
      { id: 'rs-3-1', platform: SocialPlatform.X_TWITTER, handleOrUrl: '@ejemplo_tres_tw' }
    ],
    motivos: [
      AlertaMotivo.DEVOLUCION_REITERADA
    ],
    gravedad: AlertaGravedad.INFORMATIVA,
    evidencias: [
      AlertaEvidencia.ENTREVISTA_SOSPECHOSA
    ],
    descripcionOtros: 'Devolvió tres mascotas adoptadas en diferentes protectoras locales de la zona en menos de doce meses. Los motivos expresados evidencian falta de paciencia en los períodos de adaptación normales y compras/adopciones por impulso.',
    fechaCreacion: '2026-06-18T18:45:00Z',
    creadorRefugio: 'Asociación Gatos de la Sierra',
    creadorEmail: 'contacto@resguardo.org',
    verificado: false
  },
  {
    id: 'alt-4',
    nombreSujeto: 'Ejemplo CUATRO',
    identificacion: '44444444',
    telefono: '541155550404',
    localidad: 'Córdoba, Argentina',
    redesSociales: [
      { id: 'rs-4-1', platform: SocialPlatform.FACEBOOK, handleOrUrl: 'facebook.com/ejemplo.cuatro.fb' }
    ],
    motivos: [
      AlertaMotivo.MALTRATO_FISICO,
      AlertaMotivo.NEGLIGENCIA_SEVERA
    ],
    gravedad: AlertaGravedad.CRITICA,
    evidencias: [
      AlertaEvidencia.DENUNCIA_POLICIAL,
      AlertaEvidencia.PHOTOS_VIDEOS
    ],
    descripcionOtros: 'Se constató agresión física directa mediante denuncia formal realizada por vecinos de la zona con registros gráficos correspondientes. El animal se encuentra actualmente a resguardo judicial, bajo tratamiento médico especializado. Caso con causa civil/penal en trámite.',
    fechaCreacion: '2026-06-20T09:00:00Z',
    creadorRefugio: 'Agrupación Salvemos las Huellitas',
    creadorEmail: 'contacto@resguardo.org',
    verificado: true
  }
];
