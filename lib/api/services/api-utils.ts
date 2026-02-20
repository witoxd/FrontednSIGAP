/**
 * Utilidades y helpers para trabajar con los servicios API
 * 
 * Este archivo proporciona funciones de ayuda y patrones comunes
 * para facilitar el trabajo con las APIs
 */

import useSWR, { type SWRConfiguration } from "swr"
import { swrFetcher } from "../fetcher"
import type { PaginatedApiResponse } from "@/lib/types"

// ============================================================================
// Hooks personalizados para SWR
// ============================================================================

/**
 * Hook para obtener datos paginados de cualquier endpoint
 * 
 * Ejemplo de uso:
 * ```tsx
 * const { data, error, isLoading } = usePaginatedData<Estudiante>(
 *   '/estudiantes/getAll',
 *   { limit: 20, offset: 0 }
 * )
 * ```
 */
export function usePaginatedData<T>(
  endpoint: string,
  params: { limit?: number; offset?: number } = {},
  config?: SWRConfiguration
) {
  const { limit = 50, offset = 0 } = params
  const key = `${endpoint}?limit=${limit}&offset=${offset}`

  const { data, error, isLoading, mutate } = useSWR<PaginatedApiResponse<T>>(
    key,
    () => swrFetcher<PaginatedApiResponse<T>>(key),
    config
  )

  return {
    data: data?.data,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook para obtener un recurso individual por ID
 * 
 * Ejemplo de uso:
 * ```tsx
 * const { data, error, isLoading } = useResourceById<Estudiante>(
 *   '/estudiantes/getById',
 *   1
 * )
 * ```
 */
export function useResourceById<T>(
  baseEndpoint: string,
  id: number | null,
  config?: SWRConfiguration
) {
  // Crear key solo si id existe
  const key = id ? `${baseEndpoint}/${id}` : null

  const { data, error, isLoading, mutate } = useSWR<{ data: T }>(
    key, // key puede ser null y SWR lo maneja
    key ? (keyArg) => swrFetcher<{ data: T }>(keyArg) : null, // fetcher condicional
    config
  )

  return {
    data: data?.data,
    error,
    isLoading,
    mutate,
  }
}

// ============================================================================
// Utilidades de paginación
// ============================================================================

export interface PaginationState {
  currentPage: number
  totalPages: number
  limit: number
  offset: number
  total: number
}

/**
 * Calcula el estado de paginación basado en la respuesta del servidor
 */
export function calculatePagination(
  pagination: {
    total: number
    limit: number
    offset: number
    pages: number
  },
  currentPage: number
): PaginationState {
  return {
    currentPage,
    totalPages: pagination.pages,
    limit: pagination.limit,
    offset: pagination.offset,
    total: pagination.total,
  }
}

/**
 * Obtiene el offset para una página específica
 */
export function getOffsetForPage(page: number, limit: number): number {
  return (page - 1) * limit
}

// ============================================================================
// Utilidades de formateo
// ============================================================================

/**
 * Formatea una fecha ISO a formato legible
 * 
 * Ejemplo: "2024-01-15T00:00:00.000Z" -> "15/01/2024"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Formatea una fecha ISO a formato datetime legible
 * 
 * Ejemplo: "2024-01-15T14:30:00.000Z" -> "15/01/2024 14:30"
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formatea un nombre completo desde sus componentes
 */
export function formatFullName(
  nombres: string,
  apellido_paterno?: string,
  apellido_materno?: string
): string {
  const parts = [nombres, apellido_paterno, apellido_materno].filter(Boolean)
  return parts.join(" ")
}

// ============================================================================
// Utilidades de validación
// ============================================================================

/**
 * Valida un número de documento colombiano (cédula)
 */
export function isValidDocumento(documento: string): boolean {
  // Debe ser numérico y tener entre 6 y 10 dígitos
  return /^\d{6,10}$/.test(documento)
}

/**
 * Valida un correo electrónico
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida que una fecha de nacimiento sea válida (persona debe tener al menos 5 años)
 */
export function isValidBirthDate(dateString: string): boolean {
  const birthDate = new Date(dateString)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  return age >= 5 && age <= 120
}

// ============================================================================
// Utilidades de manejo de errores
// ============================================================================

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

/**
 * Extrae un mensaje de error legible de una respuesta de error
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "Error desconocido"

  if (typeof error === "string") return error

  if (error instanceof Error) return error.message

  if (typeof error === "object" && "message" in error) {
    return String(error.message)
  }

  return "Ocurrió un error inesperado"
}

/**
 * Maneja errores de API y retorna un mensaje amigable
 */
export function handleApiError(error: unknown): string {
  const message = getErrorMessage(error)

  // Mensajes personalizados para errores comunes
  if (message.includes("401")) {
    return "Sesión expirada. Por favor, inicia sesión nuevamente."
  }

  if (message.includes("403")) {
    return "No tienes permisos para realizar esta acción."
  }

  if (message.includes("404")) {
    return "El recurso solicitado no fue encontrado."
  }

  if (message.includes("500")) {
    return "Error en el servidor. Por favor, intenta más tarde."
  }

  return message
}

// ============================================================================
// Utilidades de búsqueda y filtrado
// ============================================================================

/**
 * Filtra una lista de elementos por un término de búsqueda
 * Búsqueda case-insensitive en múltiples campos
 */
export function searchInFields<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items

  const term = searchTerm.toLowerCase()

  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(term)
    })
  )
}

/**
 * Ordena una lista de elementos por un campo específico
 */
export function sortByField<T>(
  items: T[],
  field: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const aValue = a[field]
    const bValue = b[field]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0

    return order === "asc" ? comparison : -comparison
  })
}
