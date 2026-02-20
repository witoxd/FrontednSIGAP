/**
 * Exportación centralizada de todos los servicios API
 * 
 * Este archivo facilita la importación de servicios desde un único punto
 * Ejemplo de uso:
 * 
 * import { authApi, estudiantesApi, cursosApi } from '@/lib/api/services'
 */

// Servicios de autenticación y usuarios
export { authApi } from "./auth"
export { usersApi } from "./users"
export { rolesApi } from "./roles"

// Servicios de personas y relaciones
export { personasApi } from "./personas"
export { estudiantesApi } from "./estudiantes"
export { profesoresApi } from "./profesores"
export { admisnitrativosApui } from "./administrativos"
export { acudientesApi } from "./acudientes"
export { egresadosApi } from "./egresados"

// Servicios académicos
export { cursosApi } from "./cursos"
export { matriculasApi } from "./matriculas"
export { jornadasApi } from "./jornadas"

// Servicios de archivos y documentos
export { archivosApi } from "./archivos"
export { tiposDocumentoApi } from "./tipos-documento"

// Re-exportar tipos específicos
export type {
  AcudienteConPersona,
  CreateAcudienteInput,
} from "./acudientes"

export type {
  Archivo,
  CreateArchivoInput,
} from "./archivos"

export type {
  EgresadoConRelaciones,
  CreateEgresadoInput,
} from "./egresados"

export type {
  CreateJornadaInput,
} from "./jornadas"
