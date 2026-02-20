

// ============================================================================
// Acudientes
// ============================================================================

export interface Acudiente {
  acudiente_id: number
  persona_id: number
  parentesco: string
}

export interface AcudienteConPersona extends Acudiente {
  persona?: {
    persona_id: number
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    numero_documento: string
    tipo_documento_id: number
    fecha_nacimiento: string
    genero: string
  }
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento?: string
}

export interface CreateAcudienteInput {
  acudiente: {
    parentesco: string
  }
  persona: {
    nombres?: string
    apellido_paterno?: string
    apellido_materno?: string
    tipo_documento_id?: number
    numero_documento: string
    fecha_nacimiento?: string
    genero?: string
  }
}

// ============================================================================
// Archivos
// ============================================================================

export interface Archivo {
  archivo_id: number
  persona_id: number
  tipo_archivo: string
  nombre_archivo: string
  ruta_archivo: string
  fecha_subida: string
  tamaño_bytes?: number
}

export interface CreateArchivoInput {
  persona_id: number
  tipo_archivo: string
  nombre_archivo: string
  ruta_archivo: string
  tamaño_bytes?: number
}

// ============================================================================
// Egresados
// ============================================================================

export interface Egresado {
  egresado_id: number
  estudiante_id: number
  fecha_egreso: string
  titulo_obtenido?: string
  observaciones?: string
}

export interface EgresadoConRelaciones extends Egresado {
  estudiante_nombre?: string
  numero_documento?: string
}

export interface CreateEgresadoInput {
  estudiante_id: number
  fecha_egreso: string
  titulo_obtenido?: string
  observaciones?: string
}

// ============================================================================
// Jornadas
// ============================================================================

export interface CreateJornadaInput {
  nombre: string
  hora_inicio?: string
  hora_fin?: string
}
