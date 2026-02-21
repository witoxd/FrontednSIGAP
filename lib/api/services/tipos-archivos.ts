import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  ProfesorConPersona,
  CreateTipoArchivoInput
} from "@/lib/types"

export const tiposArchivosApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<ProfesorConPersona>>("/tipos-archivos/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<ProfesorConPersona>>(`/tipos-archivos/getById/${id}`),

  create: (data: CreateTipoArchivoInput) =>
    api.post<ApiResponse>("/tipos-archivos/create", data),

  update: (id: number, data: Partial<CreateTipoArchivoInput>) =>
    api.put<ApiResponse>(`/tipos-archivos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/tipos-archivos/delete/${id}`),
}