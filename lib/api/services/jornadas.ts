import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, Jornada } from "@/lib/types"

export interface CreateJornadaInput {
  nombre: string
  hora_inicio?: string
  hora_fin?: string
}

export const jornadasApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<Jornada>>("/jornadas/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<Jornada>>(`/jornadas/getById/${id}`),

  create: (data: CreateJornadaInput) =>
    api.post<ApiResponse>("/jornadas/create", data),
}
