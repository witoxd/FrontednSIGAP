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
  grupo_sanguineo: string
  grupo_etnico: string
  credo_religioso: string
  lugar_nacimiento: string
  serial_registro_civil: string
  expedida_en: string
}
export interface PersonaWithTipoDocumentoJSON {
  persona: PersonaWithTipoDocumento
}
export interface PersonaWithTipoDocumento {
  persona_id: number
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  tipo_documento: TipoDocumento
  numero_documento: string
  fecha_nacimiento: string
  genero: "Masculino" | "Femenino" | "Otro"
  grupo_sanguineo: string
  grupo_etnico: string
  credo_religioso: string
  lugar_nacimiento: string
  serial_registro_civil: string
  expedida_en: string
}

export interface CreatePersonaInput {
  persona: {
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    tipo_documento_id: number
    numero_documento: string
    fecha_nacimiento: string
    genero: "Masculino" | "Femenino" | "Otro"
    grupo_sanguineo?: string
    grupo_etnico?: string
    credo_religioso?: string
    lugar_nacimiento?: string
    serial_registro_civil?: string
    expedida_en?: string
  }
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

export interface User {
  persona_id: number
  username: string
  email: string
  contraseña: string
}

export interface CreateUsuarioInput {
  persona: Persona
  user: User
}



// =============================================================================
// ACUDIENTES
// Agregar al final de lib/types.ts
// =============================================================================

/**
 * Acudiente tal como lo devuelve el backend (solo sus datos propios).
 * No incluye persona ni estudiantes — esos vienen en tipos extendidos.
 */
export interface Acudiente {
  acudiente_id: number
  parentesco?: string
  ocupacion?: string
  nivel_estudio?: string
}

/**
 * Acudiente con la persona incluida (nested).
 * Es lo que devuelve GET /acudientes/getAll y GET /acudientes/getById/:id.
 *
 * Analogía: en la BD, Acudiente solo guarda "persona_id".
 * El backend hace JOIN y te devuelve el objeto completo.
 */
export interface AcudienteWithPersona {
  acudiente: Acudiente
  persona: PersonaWithTipoDocumento
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

/**
 * Para crear un acudiente nuevo.
 * El backend crea la Persona y el Acudiente en una sola transacción.
 */
export interface CreateAcudienteInput {
  persona: Persona
  acudiente: Acudiente
}

/**
 * Para actualizar un acudiente existente.
 * Igual que crear, pero todos los campos de persona son opcionales.
 */
export interface UpdateAcudienteInput {
  persona: Partial<CreateAcudienteInput["persona"]>
  acudiente: Partial<CreateAcudienteInput["acudiente"]>
}

// ── Tabla intermedia acudiente ↔ estudiante ───────────────────────────────────

/**
 * Fila de la tabla acudiente_estudiante.
 * Representa que un acudiente tiene relación con un estudiante.
 */
export interface AcudienteEstudiante {
  acudiente_estudiante_id: number
  estudiante_id: number
  acudiente_id: number
  tipo_relacion?: string
  es_principal?: boolean
}

/**
 * DTO para asignar un estudiante a un acudiente.
 * POST /acudientes/assignToEstudiante
 */
export interface AssignToEstudianteDTO {
  assignToEstudiante: {
    acudiente_id: number
    estudiante_id: number
    tipo_relacion?: string
    es_principal?: boolean
  }
}

/**
 * Estudiante resumido — lo que necesitamos mostrar
 * en la tabla de asignaciones y en el modal de búsqueda.
 */
export interface EstudianteResumen {
  /** persona_id del estudiante (es también su PK en la tabla estudiantes) */
  persona_id: number
  nombres: string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento: string
  /** ID real de la fila en tabla estudiantes */
  estudiante_id: number
}


export interface AsignacionConEstudiante {
  estudiante: EstudianteResumen
  relacion: AcudienteEstudiante
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
  estado_actual: "activo" | "finalizada" | "retirada"
  anio: number
}

export interface PREVIEWMatricula {
  matricula_id: number
  fecha_matricula: string
  nombres: string
  apellido_paterno?: string
  apellido_materno?: string
  curso_nombre: string
  grado: string
  jornada_nombre: string
  estado_actual: "activo" | "finalizada" | "retirada"
  anio: number
  periodo_descripcion: string
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
    fecha_matricula?: string
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
  aplica_a: "estudiante" | "profesor" | "administrativo" | "acudiente" | "matricula"
  requerido_en: "estudiante" | "profesor" | "administrativo" | "acudiente" | "matricula" | []
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

export interface UpdateTipoArchivoInput {
  tipo_archivo: Partial<CreateTipoArchivoInput>
}

export interface TipoArchivo extends CreateTipoArchivoInput {

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

export interface UpsertFichaDTO {
  ficha: {
    numero_hermanos?: number
    posicion_hermanos?: number
    nombre_hermano_mayor?: string
    parientes_hogar?: string
    total_parientes?: number
    motivo_traslado?: string
    limitaciones_fisicas?: string
    otras_limitaciones?: string
    talentos_especiales?: string
    otras_actividades?: string
    eps_ars?: string
    alergia?: string
    centro_atencion_medica?: string
    medio_transporte?: string
    transporte_propio?: boolean
    observaciones?: string
  }
}


export interface FichaEstudiante {
  ficha_id: number
  estudiante_id: number
  numero_hermanos?: number
  posicion_hermanos?: number
  nombre_hermano_mayor?: string
  parientes_hogar?: string
  total_parientes?: number
  motivo_traslado?: string
  limitaciones_fisicas?: string
  otras_limitaciones?: string
  talentos_especiales?: string
  otras_actividades?: string
  eps_ars?: string
  alergia?: string
  centro_atencion_medica?: string
  medio_transporte?: string
  transporte_propio?: boolean
  observaciones?: string
  created_at?: string
  updated_at?: string
}

export interface ColegioAnterior {
  colegio_ant_id: number
  estudiante_id: number
  nombre_colegio: string
  ciudad?: string
  grado_cursado?: string
  anio?: number
  orden?: number
}

export interface CreateColegioDTO {
  colegio: {
    nombre_colegio: string
    ciudad?: string
    grado_cursado?: string
    anio?: number
  }
}

export interface UpdateColegioDTO {
  colegio: {
    nombre_colegio?: string
    ciudad?: string
    grado_cursado?: string
    anio?: number
    orden?: number
  }
}

export interface ReplaceColegiosDTO {
  colegios: Array<{
    nombre_colegio: string
    ciudad?: string
    grado_cursado?: string
    anio?: number
  }>
}

export interface UpsertViviendaDTO {
  vivienda: {
    tipo_paredes?: string
    tipo_techo?: string
    tipo_pisos?: string
    num_banos?: number
    num_cuartos?: number
  }
}


export interface ViviendaEstudiante {
  vivienda_id: number
  estudiante_id: number
  tipo_paredes?: string
  tipo_techo?: string
  tipo_pisos?: string
  num_banos?: number
  num_cuartos?: number
  updated_at?: string
}

// ============================================================================
// EXPEDIENTE — endpoint compuesto GET/PUT /expediente/:estudianteId
// ============================================================================

export interface ExpedienteResponse {
  ficha: FichaEstudiante | null
  colegios: ColegioAnterior[]        // array — un estudiante puede tener varios
  vivienda: ViviendaEstudiante | null
}

export interface UpsertExpedienteDTO {
  ficha?: UpsertFichaDTO["ficha"]
  colegios?: ReplaceColegiosDTO["colegios"]  // también array
  vivienda?: UpsertViviendaDTO["vivienda"]
}

// =============================================================================
// CONTACTOS
// =============================================================================

export interface Contacto {

  contacto_id: number
  persona_id: number
  tipo_contacto: "telefono" | "celular" | "email" | "direccion" | "otro"
  valor: string
  es_principal: boolean
  activo: boolean

}

/**
 * contacto_id, es_principal y activo son opcionales —
 * el backend los asigna por defecto.
 */
export interface ContactoCreationAttributes {
  contacto: {
    persona_id: number
    tipo_contacto: "telefono" | "celular" | "email" | "direccion" | "otro"
    valor: string
    es_principal?: boolean
    activo?: boolean
  }
}

/**
 * Para actualizar un contacto existente.
 * Todos los campos son opcionales — solo se envían los que cambian.
 */
export interface UpdateContactoDTO {
  contacto: Partial<ContactoCreationAttributes>
}

/**
 * Para crear varios contactos en una sola request.
 */
export interface BulkCreateContactoDTO {
  contactos: ContactoCreationAttributes[]
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


// ============================================================================
// Tipos de rol
// ============================================================================

export enum ROLES {
  ADMIN = "admin",
  PROFESOR = "profesor",
  ESTUDIANTE = "estudiante",
  ADMINISTRATIVO = "administrativo",
  MATRICULA = "matricula"
}
