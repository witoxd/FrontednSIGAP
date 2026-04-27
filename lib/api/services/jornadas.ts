import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, Jornada } from "@/lib/types"
import { CreateJornadaInput } from "@/lib/types"


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

  update: (id: number, data: Partial<CreateJornadaInput>) =>
    api.put<ApiResponse<Jornada>>(`/jornadas/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/jornadas/delete/${id}`),
}
