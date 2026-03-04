import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  ProfesorWitchPersonaDocumento,
  CreateProfesorInput,
} from "@/lib/types"

export const profesoresApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<ProfesorWitchPersonaDocumento>>("/profesores/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<ProfesorWitchPersonaDocumento>>(`/profesores/getById/${id}`),

   searchIndex: (query: string) =>
      api.get<ApiResponse<ProfesorWitchPersonaDocumento[]>>(`/profesores/searchIndex/${encodeURIComponent(query)}`),

  create: (data: CreateProfesorInput) =>
    api.post<ApiResponse>("/profesores/create", data),

  update: (id: number, data: Partial<CreateProfesorInput>) =>
    api.put<ApiResponse>(`/profesores/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/profesores/delete/${id}`),
}
