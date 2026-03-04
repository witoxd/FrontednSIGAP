// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: unknown[]
}

export interface PaginatedApiResponse<T> {
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

export interface TipoDocumento {
  tipo_documento_id: number
  tipo_documento: string
  nombre_documento: string
}

// ============================================================================
// Persona Models
// ============================================================================

export interface Persona {
  persona_id?: number
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  tipo_documento_id: number
  numero_documento: string
  fecha_nacimiento: string
  genero: "Masculino" | "Femenino" | "Otro"
}

export interface PersonaWithTipoDocumento{
    persona_id: number
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  tipo_documento: TipoDocumento
  numero_documento: string
  fecha_nacimiento: string
  genero: "Masculino" | "Femenino" | "Otro"
}

// ============================================================================
// User Models
// ============================================================================

export interface Usuario {
  usuario_id: number
  persona_id: number
  username: string
  email: string
  activo: boolean
  fecha_creacion: string
}

// ============================================================================
// Acudiente Models
// ============================================================================

export interface Acudiente {
  acudiente_id: number
  persona_id: number
  parentesco: string
  ocupacion?: string       
  nivel_estudio?: string   
}

//DTO
export interface CreateAcudienteImput {
  perosna: Persona
  acudiente: Acudiente
}

export interface AcudienteWithPerosnaDocumento {
  persona: PersonaWithTipoDocumento
  acudiente: Acudiente
}


// ============================================================================
// Estudiante Models
// ============================================================================

export interface Estudiante {
  estudiante_id?: number
  persona_id?: number
  estado: "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado"
  fecha_ingreso: string
}

export interface CreateEstudianteInput {
  persona: Persona
  estudiante: Estudiante
}

export interface EstudianteWithPersonaDocumento {
  persona: PersonaWithTipoDocumento
  estudiante: Estudiante
}

// ============================================================================
// Colegio_Anteriores Models
// ============================================================================

export interface ColegioAnteriorAttributes {
  colegio_ant_id: number
  estudiante_id: number
  nombre_colegio: string
  ciudad?: string        
  grado_cursado?: string
  anio?: number
  orden?: number        
}

// ============================================================================
// Profesor Models
// ============================================================================

export interface Profesor {
  profesor_id?: number
  persona_id?: number
  fecha_contratacion: string
  estado: "activo" | "inactivo"
}

export interface CreateProfesorInput {
  persona: Persona
  profesor: Profesor
}

export interface ProfesorWitchPersonaDocumento {
  persona: PersonaWithTipoDocumento
  profesor: Profesor
}

// ============================================================================
// Admisnitrativo Models
// ============================================================================

export interface Administrativo {
  administrativo_id: number
  persona_id: number
  cargo: string
  fecha_contratacion: string
  estado: boolean
}

export interface CreateAdministrativoInput {
  persona: Persona
  administrativo: Administrativo
}

export interface AdministrativoWithPersonaDocumento {
  persona: PersonaWithTipoDocumento
  administrativo: Administrativo
}

// ============================================================================
// Curso Models
// ============================================================================

export interface Curso {
  curso_id: number
  nombre: string
  grado: string
  descripcion?: string
}

export interface CreateCursoInput {
  curso: {
    nombre: string
    grado: string
    descripcion?: string
  }
}

// ============================================================================
// Matricula Models
// ============================================================================
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

export interface CreateMatriculaInput {
  matricula: {
    estudiante_id: number
    profesor_id: number
    curso_id: number
    jornada_id: number
    estado: "activo" | "finalizada" | "retirada"
    anio_egreso?: number
    fecha_matricula: string
  }
}

// ============================================================================
// Jornada Models
// ============================================================================

export interface Jornada {
  jornada_id: number
  nombre: string
  hora_inicio?: string
  hora_fin?: string
}

export interface CreateJornadaInput {
  nombre: string
  hora_inicio?: string
  hora_fin?: string
}

// ============================================================================
// Role Models
// ============================================================================

export interface Role {
  role_id: number
  nombre: "admin" | "profesor" | "estudiante" | "administrativo"
  descripcion?: string
}

// ============================================================================
// Archivos Models y TipoArchivos
// ============================================================================

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
// Form / DTO Types
// ============================================================================



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
