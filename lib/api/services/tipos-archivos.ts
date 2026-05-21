import { api, validateWith } from "../client"
import type { ApiResponse, CreateTipoArchivoInput, UpdateTipoArchivoInput } from "@/lib/types"
import {
  ApiResponseSchema,
  TipoArchivoSchema,
} from "@/lib/schemas"

export const tiposArchivosApi = {
  getAll: () =>
    validateWith(
      ApiResponseSchema(TipoArchivoSchema.array()),
      api.get("/tipos-archivos/getAll")
    ),

  getByRol: (rol: string) =>
    validateWith(
      ApiResponseSchema(TipoArchivoSchema.array()),
      api.get(`/tipos-archivos/getByRol/${rol}`)
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(TipoArchivoSchema),
      api.get(`/tipos-archivos/getById/${id}`)
    ),

  create: (data: CreateTipoArchivoInput) =>
    api.post<ApiResponse>("/tipos-archivos/create", data),

  update: (id: number, data: UpdateTipoArchivoInput) =>
    api.put<ApiResponse>(`/tipos-archivos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/tipos-archivos/delete/${id}`),
}