import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, TipoDocumento } from "@/lib/types"

export interface CreateTipoDocumentoInput {
  tipo_documento:{
  tipo_documento: string
  nombre_documento: string
  }
}

export const tiposDocumentoApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<TipoDocumento>>("/tipos-documento/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<TipoDocumento>>(`/tipos-documento/getById/${id}`),

  create: (data: CreateTipoDocumentoInput) =>
    api.post<ApiResponse<TipoDocumento>>("/tipos-documento/create", data),

  update: (id: number, data: Partial<CreateTipoDocumentoInput>) =>
    api.put<ApiResponse<TipoDocumento>>(`/tipos-documento/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/tipos-documento/delete/${id}`),
}
