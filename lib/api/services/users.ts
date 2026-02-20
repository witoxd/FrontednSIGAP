import { api } from "../client"
import type { ApiResponse, Usuario } from "@/lib/types"

export const usersApi = {
  search: (query?: string) =>
    api.get<ApiResponse<Usuario[]>>("/users/search", query ? { query } : {}),

  getById: (id: number) =>
    api.get<ApiResponse<Usuario>>(`/users/getById/${id}`),

  create: (data: {
    persona_id: number
    username: string
    email: string
    contraseña: string
  }) => api.post<ApiResponse>("/users/create", data),

  updateStatus: (id: number, activo: boolean) =>
    api.patch<ApiResponse>(`/users/${id}/status`, { activo }),
}
