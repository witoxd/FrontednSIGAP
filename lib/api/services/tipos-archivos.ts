import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  CreateTipoArchivoInput
} from "@/lib/types"

export const tiposArchivosApi = {
  getAll: () =>
    api.get<PaginatedApiResponse<CreateTipoArchivoInput>>("/tipos-archivos/getAll"),

  getById: (id: number) =>
    api.get<ApiResponse<CreateTipoArchivoInput>>(`/tipos-archivos/getById/${id}`),

  create: (data: CreateTipoArchivoInput) =>
    api.post<ApiResponse>("/tipos-archivos/create", data),

  update: (id: number, data: Partial<CreateTipoArchivoInput>) =>
    api.put<ApiResponse>(`/tipos-archivos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/tipos-archivos/delete/${id}`),
}