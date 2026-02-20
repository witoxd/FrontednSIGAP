import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, CreateEgresadoInput, EgresadoConRelaciones } from "@/lib/types"

export const egresadosApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<EgresadoConRelaciones>>("/egresados/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<EgresadoConRelaciones>>(`/egresados/getById/${id}`),

  create: (data: CreateEgresadoInput) =>
    api.post<ApiResponse>("/egresados/create", data),

  update: (id: number, data: Partial<CreateEgresadoInput>) =>
    api.put<ApiResponse>(`/egresados/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/egresados/delete/${id}`),
}
