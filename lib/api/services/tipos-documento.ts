import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, TipoDocumento } from "@/lib/types"

export const tiposDocumentoApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<TipoDocumento>>("/tipos-documento/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<TipoDocumento>>(`/tipos-documento/getById/${id}`),
}
