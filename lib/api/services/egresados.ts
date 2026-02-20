import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse } from "@/lib/types"

export interface Egresado {
  egresado_id: number
  estudiante_id: number
  fecha_egreso: string
  titulo_obtenido?: string
  observaciones?: string
}

export interface EgresadoConRelaciones extends Egresado {
  estudiante_nombre?: string
  numero_documento?: string
}

export interface CreateEgresadoInput {
  estudiante_id: number
  fecha_egreso: string
  titulo_obtenido?: string
  observaciones?: string
}

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
