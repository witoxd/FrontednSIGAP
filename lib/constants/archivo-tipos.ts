export const TIPO_ARCHIVO_IDS = {
  FOTO_PERFIL: 1,
  DOCUMENTO_IDENTIDAD: 2,
  CERTIFICADO_ESTUDIOS: 3,
  CONTRATO: 4,
  HOJA_VIDA: 5,
  OTROS: 99,
} as const

export const TIPO_ARCHIVO_NOMBRES = {
  [TIPO_ARCHIVO_IDS.FOTO_PERFIL]: 'Foto de Perfil',
  [TIPO_ARCHIVO_IDS.DOCUMENTO_IDENTIDAD]: 'Documento de Identidad',
  [TIPO_ARCHIVO_IDS.CERTIFICADO_ESTUDIOS]: 'Certificado de Estudios',
  [TIPO_ARCHIVO_IDS.CONTRATO]: 'Contrato',
  [TIPO_ARCHIVO_IDS.HOJA_VIDA]: 'Hoja de Vida',
  [TIPO_ARCHIVO_IDS.OTROS]: 'Otros',
} as const

export const FOTO_PERFIL_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
} as const
