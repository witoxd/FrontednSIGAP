import { api } from "../client"
import type { ApiResponse, GradoEscalafon, CreateGradoEscalafonInput } from "@/lib/types"

export const gradosEscalafonApi = {
  getAll: () => api.get<ApiResponse<GradoEscalafon[]>>("/grados-escalafon/getAll"),

  getByDecretoId: (decretoId: number) =>
    api.get<ApiResponse<GradoEscalafon[]>>(`/grados-escalafon/getByDecretoId/${decretoId}`),

  getById: (id: number) => api.get<ApiResponse<GradoEscalafon>>(`/grados-escalafon/getById/${id}`),

  create: (data: CreateGradoEscalafonInput) =>
    api.post<ApiResponse<GradoEscalafon>>("/grados-escalafon/create", { grado: data }),

  update: (id: number, data: Partial<CreateGradoEscalafonInput>) =>
    api.put<ApiResponse<GradoEscalafon>>(`/grados-escalafon/update/${id}`, { grado: data }),

  delete: (id: number) => api.delete<ApiResponse>(`/grados-escalafon/delete/${id}`),
}
