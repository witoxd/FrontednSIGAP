import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  CreateAcudienteImput,
  AcudienteWithPerosnaDocumento
} from "@/lib/types"



export const acudientesApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<AcudienteWithPerosnaDocumento>>("/acudientes/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<AcudienteWithPerosnaDocumento>>(`/acudientes/getById/${id}`),

  create: (data: CreateAcudienteImput) =>
    api.post<ApiResponse>("/acudientes/create", data),

  update: (id: number, data: Partial<CreateAcudienteImput>) =>
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
