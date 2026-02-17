import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  Curso,
  CreateCursoInput,
} from "@/lib/types"

export const cursosApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<Curso>>("/cursos/getAll", { limit, offset }),

  getById: (id: number) =>
    api.get<ApiResponse<Curso>>(`/cursos/getById/${id}`),

  create: (data: CreateCursoInput) =>
    api.post<ApiResponse>("/cursos/create", data),

  update: (id: number, data: { curso: Partial<Curso> }) =>
    api.put<ApiResponse>(`/cursos/update/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse>(`/cursos/delete/${id}`),
}
