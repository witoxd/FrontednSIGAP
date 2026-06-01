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
  nombre_documento?: string | null
}

// ============================================================================
// Persona Models
// ============================================================================

export interface Persona {
  persona_id?: number
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
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
export interface PersonaWithTipoDocumentoJSON {
  persona: PersonaWithTipoDocumento
}
export interface PersonaWithTipoDocumento {
  persona_id: number
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  tipo_documento: TipoDocumento
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
  persona_id: number
  nombres: string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento: string
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

/**
 * Acudiente vinculado a un estudiante específico.
 * Devuelto por GET /acudientes/:estudianteId/estudiantes
 * Shape reducido: solo los campos que muestra SeccionAcudientes.
 */
export interface AcudienteDeEstudiante {
  persona: {
    persona_id:        number
    nombres:           string
    apellido_paterno?: string | null
    apellido_materno?: string | null
    numero_documento:  string
    tipo_documento?: {
      tipo_documento_id: number
      tipo_documento?:   string | null
      nombre_documento?: string | null
    } | null
  }
  acudiente:     Acudiente
  tipo_relacion: string | null
  es_principal:  boolean
}

export interface AcudienteDetalles {
  persona: PersonaWithTipoDocumento
  acudiente: Acudiente
  estudiantes: Array<{
    estudiante: {
      estudiante_id: number
      nombres: string
      apellido_paterno?: string | null
      apellido_materno?: string | null
      numero_documento: string
    }
    relacion: {
      tipo_relacion: string | null
      es_principal: boolean
    }
  }>
}



// ============================================================================
// Estudiante Models
// ============================================================================

export interface Estudiante {
  estudiante_id?: number
  persona_id?: number
  estado: "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado"
  estado_efectivo?: "activo" | "inactivo" | "egresado" | "suspendido" | "expulsado"
  fecha_ingreso: string
}

export interface Suspension {
  suspension_id: number
  estudiante_id: number
  matricula_id?: number | null
  motivo: string
  fecha_inicio: string
  fecha_fin: string
  created_at?: string | null
  creado_por_nombre?: string | null
  vigente?: boolean
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
// Docente Models (campos compartidos de contratación)
// ============================================================================

export interface Decreto {
  decreto_id: number
  codigo: string
  nombre: string
  descripcion?: string | null
}

export interface GradoEscalafon {
  grado_id: number
  decreto_id: number
  codigo: string
  descripcion?: string | null
  orden: number
  decreto_codigo?: string
  decreto_nombre?: string
}

export interface CreateDecretoInput {
  codigo: string
  nombre: string
  descripcion?: string
}

export interface CreateGradoEscalafonInput {
  decreto_id: number
  codigo: string
  descripcion?: string
  orden?: number
}

export interface Docente {
  docente_id: number
  persona_id?: number
  sede?: string | null
  jornada_id?: number | null
  jornada_nombre?: string | null
  tipo_contrato?: string | null
  estado: "activo" | "inactivo"
  fecha_contratacion: string
  // Campos académicos/profesionales
  decreto_id?: number | null
  decreto_codigo?: string | null
  decreto_nombre?: string | null
  titulo?: string | null
  area?: string | null
  posgrado?: string | null
  grado_escalafon_id?: number | null
  grado_escalafon_codigo?: string | null
  fecha_nombramiento?: string | null
  numero_resolucion?: string | null
  perfil_profesional?: string | null
}

// ============================================================================
// Profesor Models
// ============================================================================

export interface Profesor {
  profesor_id: number
  docente_id: number
}

export interface ProfesorContactoEmergencia {
  contacto_emergencia_id: number
  profesor_id: number
  nombre: string
  parentesco: string
  telefono: string
  celular?: string | null
  activo: boolean
}

export interface ProfesorDetalles {
  persona: PersonaWithTipoDocumento
  docente: Docente
  profesor: Profesor
  contactos_emergencia: Omit<ProfesorContactoEmergencia, "profesor_id" | "activo">[]
}

export interface CreateProfesorInput {
  persona: Persona
  profesor: {
    sede?: string
    jornada_id?: number
    tipo_contrato?: string
    estado?: "activo" | "inactivo"
    fecha_contratacion?: string
    decreto_id?: number
    grado_escalafon_id?: number
    area?: string
    titulo?: string
    posgrado?: string
    fecha_nombramiento?: string
    numero_resolucion?: string
    perfil_profesional?: string
  }
}

export interface ProfesorWitchPersonaDocumento {
  persona: PersonaWithTipoDocumento
  docente: Docente
  profesor: Profesor
}

// ============================================================================
// Admisnitrativo Models
// ============================================================================

export interface Administrativo {
  administrativo_id: number
  docente_id: number
  cargo?: string | null
}

export interface CreateAdministrativoInput {
  persona: Persona
  administrativo: {
    cargo?: string
    sede?: string
    jornada_id?: number
    tipo_contrato?: string
    estado?: "activo" | "inactivo"
    fecha_contratacion?: string
  }
}

export interface AdministrativoWithPersonaDocumento {
  persona: PersonaWithTipoDocumento
  docente: Docente
  administrativo: Administrativo
}

// ============================================================================
// Curso Models
// ============================================================================

export type NivelEducativo = "Preescolar" | "Primaria" | "Secundaria" | "Media"

export interface Curso {
  curso_id:         number
  grado:            string
  nivel:            NivelEducativo
  grupo:            string
  jornada_id:       number
  jornada_nombre?:  string
  capacidad_maxima: number
  activo:           boolean
}

export interface CursoDetalles extends Curso {
  directores: {
    director_id:         number
    periodo_id:          number
    anio:                number
    periodo_descripcion: string
    periodo_activo:      boolean
    profesor_id:         number
    nombres:             string
    apellido_paterno:    string
    apellido_materno:    string
  }[]
  asignaciones: {
    asignacion_id:       number
    periodo_id:          number
    materia:             string
    horas_semanales:     number | null
    profesor_id:         number
    nombres:             string
    apellido_paterno:    string
    apellido_materno:    string
  }[]
}

export interface EstudianteDeCurso {
  matricula_id:     number
  estudiante_id:    number
  estado_actual:    "activa" | "finalizada" | "retirada" | "inactiva"
  fecha_matricula:  string
  anio:             number
  periodo_id:       number
  periodo_descripcion?: string | null
  nombres:          string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  numero_documento?: string | null
  tipo_documento?:  string | null
}

export interface CreateCursoInput {
  curso: {
    grado:            string
    nivel:            NivelEducativo
    grupo:            string
    jornada_id:       number
    capacidad_maxima?: number
  }
}

// ============================================================================
// Matricula Models
// ============================================================================
export interface Matricula {
  matricula_id:   number
  estudiante_id:  number
  curso_id:       number
  periodo_id:     number
  fecha_matricula: string
  estado_actual:  "activa" | "finalizada" | "retirada" | "inactiva"
  anio:           number
  jornada_id?:    number
}

/** Snapshot de un cambio en una matrícula — devuelto por findHistorialByMatricula */
export interface MatriculaHistorialItem {
  historial_id:              number
  curso_anterior_nombre?:    string | null
  curso_nuevo_nombre?:       string | null
  jornada_anterior_nombre?:  string | null
  jornada_nuevo_nombre?:     string | null
  estado_anterior:           string
  estado_nuevo:              string
  modificado_en:             string
  motivo_cambio?:            string | null
  modificado_por_nombre?:    string | null
}

/** Shape completo que devuelve GET /matriculas/getDetalles/:id */
export interface MatriculaDetalles {
  estado_actual:   "activa" | "finalizada" | "retirada" | "inactiva"
  fecha_matricula: string
  fecha_retiro?:   string | null
  motivo_retiro?:  string | null
  anio:            number
  curso_id?:       number
  jornada_id?:     number
  curso: {
    nombre:       string
    grado:        string
    descripcion?: string | null
  }
  jornada: {
    nombre:       string
    hora_inicio?: string | null
    hora_fin?:    string | null
  }
  periodo: {
    descripcion?:  string | null
    fecha_inicio?: string | null
    fecha_fin?:    string | null
  }
  estudiante: {
    estudiante_id:     number
    nombres:           string
    apellido_paterno?: string | null
    apellido_materno?: string | null
    numero_documento:  string
    nombre_documento?: string | null
  }
  archivos: Array<{
    archivo_id:   number
    nombre:       string
    url_archivo:  string
    descripcion?: string | null
    fecha_carga:  string
    tipo_archivo: { nombre: string }
  }>
  archivos_requeridos: Array<{
    nombre:       string
    descripcion?: string | null
    entregado:    boolean
    archivo_id?:  number | null
    url_archivo?: string | null
    fecha_carga?: string | null
  }>
  historial: MatriculaHistorialItem[]
  sanciones: SancionMatricula[]
}

export interface SancionMatricula {
  suspension_id: number
  motivo: string
  fecha_inicio: string
  fecha_fin: string
  tipo: "suspension"
  registrado_por?: string | null
  vigente: boolean
}

/** Matrícula con todo lo que necesita el componente SeccionMatriculas */
export interface MatriculaDeEstudiante {
  matricula_id:        number
  estado_actual:       "activa" | "finalizada" | "retirada" | "inactiva"
  fecha_matricula:     string
  fecha_retiro?:        string | null
  motivo_retiro?:       string | null
  anio:                 number
  curso_nombre:         string
  curso_grupo?:         string | null
  grado?:               string | null
  jornada_nombre:       string
  periodo_descripcion?: string | null
  periodo_fecha_inicio?: string | null
  periodo_fecha_fin?:    string | null
  historial:           MatriculaHistorialItem[]
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
  estado_actual: "activa" | "finalizada" | "retirada" | "inactiva"
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
    estado: "activa" | "finalizada" | "retirada"
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
  nombre: string
  descripcion?: string
}

export interface Permiso {
  permiso_id: number
  nombre: string
  descripcion?: string | null
  recurso: string
  accion: "create" | "read" | "update" | "delete" | "manage"
}

export interface AuditoriaLog {
  auditoria_id: number
  tabla_nombre: string
  accion: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT"
  usuario_id: number | null
  fecha: string
  detalle: Record<string, unknown> | null
  username?: string | null
  nombres?: string | null
  apellido_paterno?: string | null
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

export type ContextoArchivo = "estudiante" | "profesor" | "administrativo" | "acudiente" | "matricula"

export interface TipoArchivo {
  tipo_archivo_id: number
  nombre: string
  descripcion?: string
  extensiones_permitidas?: string[]
  activo?: boolean
  aplica_a?: ContextoArchivo[]
  requerido_en?: ContextoArchivo[]
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

export interface TipoArchivo {
  tipo_archivo_id: number
  nombre: string
  descripcion?: string
  extensiones_permitidas?: string[]
  activo?: boolean
  aplica_a?: ContextoArchivo[]
  requerido_en?: ContextoArchivo[]
}

export interface CreateTipoArchivoInput {
  tipo_archivo: Omit<TipoArchivo, "tipo_archivo_id">
}

export interface UpdateTipoArchivoInput {
  tipo_archivo: Partial<Omit<TipoArchivo, "tipo_archivo_id">>
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
  contacto: Partial<ContactoCreationAttributes["contacto"]>
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


// ============================================================================
// AsignacionDocente Models
// ============================================================================

export interface AsignacionDocente {
  asignacion_id:       number
  curso_id:            number
  profesor_id:         number
  periodo_id:          number
  materia:             string
  horas_semanales:     number | null
  // campos joined (devueltos por findByProfesor)
  grado?:              string
  nivel?:              string
  grupo?:              string
  anio?:               number
  periodo_descripcion?: string
}

export interface CreateAsignacionDocenteInput {
  curso_id:        number
  profesor_id:     number
  periodo_id:      number
  materia:         string
  horas_semanales?: number | null
}

// ============================================================================
// DirectorGrupo Models
// ============================================================================

export interface DirectorGrupoProfesor {
  director_id:          number
  curso_id:             number
  periodo_id:           number
  profesor_id:          number
  grado:                string
  nivel:                string
  grupo:                string
  anio:                 number
  periodo_descripcion:  string
  periodo_activo:       boolean
}

export interface CreateDirectorGrupoInput {
  curso_id:   number
  periodo_id: number
  profesor_id: number
}

// ============================================================================
// Reemplazo Profesor
// ============================================================================

export interface ReemplazoProfesor {
  reemplazo_id:             number
  profesor_id:              number
  reemplaza_a_profesor_id:  number
  fecha_inicio:             string
  fecha_fin?:               string | null
  motivo?:                  string | null
  nombre_reemplazado?:      string
  nombre_reemplazante?:     string
}

export interface ReemplazosProfesorResponse {
  realizados: ReemplazoProfesor[]
  recibidos:  ReemplazoProfesor[]
}
