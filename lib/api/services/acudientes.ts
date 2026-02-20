import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  CreateAcudienteInput
} from "@/lib/types"



export const acudientesApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<CreateAcudienteInput>>("/acudientes/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<CreateAcudienteInput>>(`/acudientes/getById/${id}`),

  create: (data: CreateAcudienteInput) =>
    api.post<ApiResponse>("/acudientes/create", data),

  update: (id: number, data: Partial<CreateAcudienteInput>) =>
    api.put<ApiResponse>(`/acudientes/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/acudientes/delete/${id}`),

  assignToEstudiante: (data: { acudiente_id: number; estudiante_id: number }) =>
    api.post<ApiResponse>("/acudientes/assignToEstudiante", data),

  removeFromEstudiante: (estudianteId: number, acudienteId: number) =>
    api.patch<ApiResponse>(
      `/acudientes/removeFromEstudiante/estudiante/${estudianteId}/acudiente/${acudienteId}`,
      {}
    ),
}
