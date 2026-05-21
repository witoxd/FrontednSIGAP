import { api, validateWith } from "../client"
import type { ApiResponse, CreateEgresadoInput } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  EgresadoSchema,
} from "@/lib/schemas"

export const egresadosApi = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      PaginatedApiResponseSchema(EgresadoSchema),
      api.get("/egresados/getAll", { limit, offset })
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(EgresadoSchema),
      api.get(`/egresados/getById/${id}`)
    ),

  create: (data: CreateEgresadoInput) =>
    api.post<ApiResponse>("/egresados/create", data),

  update: (id: number, data: Partial<CreateEgresadoInput>) =>
    api.put<ApiResponse>(`/egresados/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/egresados/delete/${id}`),
}
