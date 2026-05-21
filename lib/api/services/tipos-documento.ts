import { api, validateWith } from "../client"
import type { ApiResponse } from "@/lib/types"
import {
  ApiResponseSchema,
  TipoDocumentoSchema,
} from "@/lib/schemas"

export interface CreateTipoDocumentoInput {
  tipo_documento: {
    tipo_documento: string
    nombre_documento: string
  }
}

export const tiposDocumentoApi = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      ApiResponseSchema(TipoDocumentoSchema.array()),
      api.get("/tipos-documento/getAll", { limit, offset })
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(TipoDocumentoSchema),
      api.get(`/tipos-documento/getById/${id}`)
    ),

  create: (data: CreateTipoDocumentoInput) =>
    validateWith(
      ApiResponseSchema(TipoDocumentoSchema),
      api.post("/tipos-documento/create", data)
    ),

  update: (id: number, data: Partial<CreateTipoDocumentoInput>) =>
    validateWith(
      ApiResponseSchema(TipoDocumentoSchema),
      api.put(`/tipos-documento/update/${id}`, data)
    ),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/tipos-documento/delete/${id}`),
}
