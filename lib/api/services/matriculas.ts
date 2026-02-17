import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  MatriculaConRelaciones,
  CreateMatriculaInput,
} from "@/lib/types"

export const matriculasApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<MatriculaConRelaciones>>(
      "/matriculas/getAll",
      { limit, offset }
    ),

  getById: (id: number) =>
    api.get<ApiResponse<MatriculaConRelaciones>>(`/matriculas/getById/${id}`),

  create: (data: CreateMatriculaInput) =>
    api.post<ApiResponse>("/matriculas/create", data),

  update: (id: number, data: Partial<CreateMatriculaInput>) =>
    api.put<ApiResponse>(`/matriculas/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/matriculas/delete/${id}`),
}
