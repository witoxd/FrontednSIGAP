import { api, validateWith } from "../client"
import type { ApiResponse, CreateEstudianteInput, Suspension } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  EstudianteWithPersonaDocumentoSchema,
  AsignacionConEstudianteSchema,
  SuspensionSchema,
} from "@/lib/schemas"

export const estudiantesApi = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      PaginatedApiResponseSchema(EstudianteWithPersonaDocumentoSchema),
      api.get("/estudiantes/getAll", { limit, offset })
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(EstudianteWithPersonaDocumentoSchema),
      api.get(`/estudiantes/getById/${id}`)
    ),

  getByDocumento: (numero: string) =>
    validateWith(
      ApiResponseSchema(EstudianteWithPersonaDocumentoSchema),
      api.get(`/estudiantes/getByDocumento/${numero}`)
    ),

  searchIndex: (query: string) =>
    validateWith(
      ApiResponseSchema(EstudianteWithPersonaDocumentoSchema.array()),
      api.get(`/estudiantes/searchIndex/${encodeURIComponent(query)}`)
    ),

  // Mutaciones — la respuesta de create/update no pasa por JOIN, no validar con Zod
  create: (data: CreateEstudianteInput) =>
    api.post<ApiResponse>("/estudiantes/create", data),

  update: (id: number, data: Partial<CreateEstudianteInput>) =>
    api.put<ApiResponse>(`/estudiantes/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/estudiantes/delete/${id}`),

  getEstudiantesByAcudiente: (acudienteId: number) =>
    validateWith(
      ApiResponseSchema(AsignacionConEstudianteSchema.array()),
      api.get(`/estudiantes/${acudienteId}/acudientes`)
    ),

  // Acciones de estado
  suspender: (id: number, data: { motivo: string; fecha_inicio: string; fecha_fin: string }) =>
    api.post<ApiResponse>(`/estudiantes/${id}/suspender`, data),

  expulsar: (id: number, data: { motivo: string }) =>
    api.post<ApiResponse>(`/estudiantes/${id}/expulsar`, data),

  reactivar: (id: number) =>
    api.patch<ApiResponse>(`/estudiantes/${id}/reactivar`),

  egresar: (id: number, data?: { fecha_grado?: string }) =>
    api.post<ApiResponse>(`/estudiantes/${id}/egresar`, data ?? {}),

  getSuspensiones: (id: number) =>
    validateWith(
      ApiResponseSchema(SuspensionSchema.array()),
      api.get(`/estudiantes/${id}/suspensiones`)
    ),

  deleteSuspension: (id: number, suspensionId: number) =>
    api.delete<ApiResponse>(`/estudiantes/${id}/suspensiones/${suspensionId}`),
}
