import { api, validateWith } from "../client"
import type { ApiResponse, CreateProfesorInput } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  ProfesorWithPersonaDocumentoSchema,
  ProfesorDetallesSchema,
} from "@/lib/schemas"

export const profesoresApi = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      PaginatedApiResponseSchema(ProfesorWithPersonaDocumentoSchema),
      api.get("/profesores/getAll", { limit, offset })
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(ProfesorWithPersonaDocumentoSchema),
      api.get(`/profesores/getById/${id}`)
    ),

  getDetalles: (id: number) =>
    validateWith(
      ApiResponseSchema(ProfesorDetallesSchema),
      api.get(`/profesores/getDetalles/${id}`)
    ),

  searchIndex: (query: string) =>
    validateWith(
      ApiResponseSchema(ProfesorWithPersonaDocumentoSchema.array()),
      api.get(`/profesores/searchIndex/${encodeURIComponent(query)}`)
    ),

  create: (data: CreateProfesorInput) =>
    api.post<ApiResponse>("/profesores/create", data),

  update: (id: number, data: Partial<CreateProfesorInput>) =>
    api.put<ApiResponse>(`/profesores/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/profesores/delete/${id}`),
}
