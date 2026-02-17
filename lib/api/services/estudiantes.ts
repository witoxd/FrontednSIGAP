import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  EstudianteConPersona,
  CreateEstudianteInput,
} from "@/lib/types"

export const estudiantesApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<EstudianteConPersona>>("/estudiantes/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<{ persona: unknown; estudiante: EstudianteConPersona }>>(
      `/estudiantes/getById/${id}`
    ),

  getByDocumento: (numero: string) =>
    api.get<ApiResponse<EstudianteConPersona>>(
      `/estudiantes/getByDocumento/${numero}`
    ),

  create: (data: CreateEstudianteInput) =>
    api.post<ApiResponse>("/estudiantes/create", data),

  update: (id: number, data: Partial<CreateEstudianteInput>) =>
    api.put<ApiResponse>(`/estudiantes/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/estudiantes/delete/${id}`),
}
