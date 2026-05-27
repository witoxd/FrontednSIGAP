import { api } from "../client"
import type { ApiResponse, Decreto, CreateDecretoInput } from "@/lib/types"

export const decretosApi = {
  getAll: () => api.get<ApiResponse<Decreto[]>>("/decretos/getAll"),

  getById: (id: number) => api.get<ApiResponse<Decreto>>(`/decretos/getById/${id}`),

  create: (data: CreateDecretoInput) =>
    api.post<ApiResponse<Decreto>>("/decretos/create", { decreto: data }),

  update: (id: number, data: Partial<CreateDecretoInput>) =>
    api.put<ApiResponse<Decreto>>(`/decretos/update/${id}`, { decreto: data }),

  delete: (id: number) => api.delete<ApiResponse>(`/decretos/delete/${id}`),
}
