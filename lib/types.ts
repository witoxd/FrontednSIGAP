// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: unknown[]
}

export interface PaginatedApiResponse<T = unknown> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    pages: number
  }
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    personaId: number
    username: string
    email: string
    roles: string[]
  }
}

// ============================================================================
// Domain Models
// ============================================================================

export interface Persona {
  persona_id: number
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  tipo_documento_id: number
  numero_documento: string
  fecha_nacimiento: string
  genero: "Masculino" | "Femenino" | "Otro"
}

export interface Usuario {
  usuario_id: number
  persona_id: number
  username: string
  email: string
  activo: boolean
  fecha_creacion: string
}

export interface Acudiente {
  acudiente_id: number
  persona_id: number
  parentesco: string
}

export interface Estudiante {
  estudiante_id: number
  persona_id: number
  estado: "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado"
  fecha_ingreso: string
}

export interface EstudianteConPersona extends Estudiante {
  persona?: Persona
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento?: string
  tipo_documento_id?: number
  fecha_nacimiento?: string
  genero?: string
}

export interface Profesor {
  profesor_id: number
  persona_id: number
  fecha_contratacion: string
  estado: "activo" | "inactivo"
}

export interface ProfesorConPersona extends Profesor {
  persona?: Persona
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento?: string
}

export interface Administrativo {
  administrativo_id: number
  persona_id: number
  cargo: string
  fecha_contratacion: string
  estado: boolean
}

export interface Curso {
  curso_id: number
  nombre: string
  grado: string
  descripcion?: string
}

export interface Matricula {
  matricula_id: number
  estudiante_id: number
  profesor_id: number
  curso_id: number
  fecha_matricula: string
  jornada_id: number
  estado: "activo" | "finalizada" | "retirada"
  anio_egreso: number
}

export interface MatriculaConRelaciones extends Matricula {
  estudiante_nombre?: string
  profesor_nombre?: string
  curso_nombre?: string
  jornada_nombre?: string
}

export interface Jornada {
  jornada_id: number
  nombre: string
  hora_inicio?: string
  hora_fin?: string
}

export interface TipoDocumento {
  tipo_documento_id: number
  tipo_documento: string
  nombre_documento: string
}

export interface Role {
  role_id: number
  nombre: "admin" | "profesor" | "estudiante" | "administrativo"
  descripcion?: string
}

export interface Archivo {
  archivo_id: number
  persona_id: number
  tipo_archivo: string
  nombre_archivo: string
  ruta_archivo: string
  fecha_subida: string
}

export interface TipoArchivo {
  tipo_archivo_id: number
  nombre: string
  descripcion?: string
  extensiones_permitidas?: string[]
  activo?: boolean
}


// ============================================================================
// Form / DTO Types
// ============================================================================

export interface CreatePersonaInput {
  nombres: string
  apellido_paterno?: string
  apellido_materno?: string
  tipo_documento_id: number
  numero_documento: string
  fecha_nacimiento: string
  genero: "Masculino" | "Femenino" | "Otro"
}

export interface CreateAdministrativoInput {
  persona: CreatePersonaInput
  administrativo: {
    cargo: string
    fecha_contratacion?: string
    estado?: boolean
  }
}

export interface CreateEstudianteInput {
  persona: CreatePersonaInput
  estudiante: {
    estado?: string
    fecha_ingreso?: string
  }
}

export interface EgresadoConRelaciones extends CreateEgresadoInput {
  estudiante_nombre?: string
  numero_documento?: string
}

export interface CreateEgresadoInput {
  estudiante_id: number
  fecha_egreso: string
  titulo_obtenido?: string
  observaciones?: string
}

export interface CreateProfesorInput {
  persona: CreatePersonaInput
  profesor: {
    fecha_contratacion?: string
    estado?: string
  }
}

export interface CreateAcudienteInput { 
  persona: CreatePersonaInput
  acudiente: {
    parentesco: string
  }
}

export interface CreateCursoInput {
  curso: {
    nombre: string
    grado: string
    descripcion?: string
  }
}

export interface CreateMatriculaInput {
  matricula: {
    estudiante_id: number
    profesor_id: number
    curso_id: number
    jornada_id: number
    estado?: string
    anio_egreso?: number
  }
}

export interface CreateArchivoInput {
  persona_id: number
  tipo_archivo: string
  nombre_archivo: string
  ruta_archivo: string
}

export interface BulkCreateArchivoMetadata {
  tipo_archivo_id: number
  descripcion: string
}

export interface BulkCreateArchivoResponse {
  success: boolean
  message: string
  total: number
  data: Archivo[]
}

export interface CreateTipoArchivoInput {
  tipo_archivo_id: number
  nombre: string
  descripcion?: string
  extensiones_permitidas?: string[]
  activo?: boolean
}

// ============================================================================
// Auth
// ============================================================================

export interface AuthUser {
  id: number
  personaId: number
  username: string
  email: string
  roles: string[]
}
