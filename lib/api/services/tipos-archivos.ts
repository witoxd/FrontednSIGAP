import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  CreateTipoArchivoInput,
  TipoArchivo,
  UpdateTipoArchivoInput
} from "@/lib/types"

export const tiposArchivosApi = {
  getAll: () =>
    api.get<PaginatedApiResponse<TipoArchivo>>("/tipos-archivos/getAll"),

  getByRol: (rol: string) =>
    api.get<PaginatedApiResponse<TipoArchivo>>(`/tipos-archivos/getByRol/${rol}`),

  getById: (id: number) =>
    api.get<ApiResponse<TipoArchivo>>(`/tipos-archivos/getById/${id}`),

  create: (data: CreateTipoArchivoInput) =>
    api.post<ApiResponse>("/tipos-archivos/create", data),

  update: (id: number, data: UpdateTipoArchivoInput) =>
    api.put<ApiResponse>(`/tipos-archivos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/tipos-archivos/delete/${id}`),
}