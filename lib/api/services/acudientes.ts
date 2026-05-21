import { api, validateWith } from "../client"
import type {
  ApiResponse,
  CreateAcudienteInput,
  UpdateAcudienteInput,
  AssignToEstudianteDTO,
} from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  AcudienteWithPersonaSchema,
  AcudienteDetallesSchema,
  AcudienteEstudianteSchema,
  AsignacionConEstudianteSchema,
  AcudienteDeEstudianteSchema,
} from "@/lib/schemas"

export const acudientesApi = {
  getAll: (limit = 20, offset = 0) =>
    validateWith(
      PaginatedApiResponseSchema(AcudienteWithPersonaSchema),
      api.get(`/acudientes/getAll?limit=${limit}&offset=${offset}`)
    ),

  getById: (acudienteId: number) =>
    validateWith(
      ApiResponseSchema(AcudienteWithPersonaSchema),
      api.get(`/acudientes/getById/${acudienteId}`)
    ),

  getDetalles: (acudienteId: number) =>
    validateWith(
      ApiResponseSchema(AcudienteDetallesSchema),
      api.get(`/acudientes/getDetalles/${acudienteId}`)
    ),

  searchIndex: (query: string) =>
    validateWith(
      ApiResponseSchema(AcudienteWithPersonaSchema.array()),
      api.get(`/acudientes/searchIndex/${encodeURIComponent(query)}`)
    ),

  getEstudiantes: (acudienteId: number) =>
    validateWith(
      ApiResponseSchema(AsignacionConEstudianteSchema.array()),
      api.get(`/acudientes/${acudienteId}/estudiantes`)
    ),

  getByEstudiante: (estudianteId: number) =>
    validateWith(
      ApiResponseSchema(AcudienteDeEstudianteSchema.array()),
      api.get(`/acudientes/${estudianteId}/estudiantes`)
    ),

  // Mutaciones — sin validateWith
  create: (dto: CreateAcudienteInput) =>
    api.post<ApiResponse>("/acudientes/create", dto),

  update: (acudienteId: number, dto: UpdateAcudienteInput) =>
    api.put<ApiResponse>(`/acudientes/update/${acudienteId}`, dto),

  delete: (acudienteId: number) =>
    api.delete<ApiResponse<void>>(`/acudientes/delete/${acudienteId}`),

  assignToEstudiante: (dto: AssignToEstudianteDTO) =>
    api.post<ApiResponse>("/acudientes/assignToEstudiante", dto),

  removeFromEstudiante: (estudianteId: number, acudienteId: number) =>
    api.patch<ApiResponse<void>>(
      `/acudientes/removeFromEstudiante/estudiante/${estudianteId}/acudiente/${acudienteId}`
    ),
}
