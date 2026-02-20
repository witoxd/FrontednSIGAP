import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, Archivo, CreateArchivoInput } from "@/lib/types"


export const archivosApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<Archivo>>("/archivos/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<Archivo>>(`/archivos/getById/${id}`),

  getByPersonaId: (personaId: number) =>
    api.get<ApiResponse<Archivo[]>>(`/archivos/getByPersonaId/${personaId}`),

  create: (data: CreateArchivoInput) =>
    api.post<ApiResponse>("/archivos/create", data),

  bulkCreate: (data: CreateArchivoInput[]) =>
    api.post<ApiResponse>("/archivos/bulkcreate", data),

  update: (id: number, data: Partial<CreateArchivoInput>) =>
    api.put<ApiResponse>(`/archivos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/archivos/delete/${id}`),

  download: (id: number) =>
    api.get<Blob>(`/archivos/download/${id}`),

  view: (id: number) =>
    api.get<Blob>(`/archivos/view/${id}`),
}
