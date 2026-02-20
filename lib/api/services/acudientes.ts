import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
} from "@/lib/types"

// Tipos específicos para Acudientes
export interface Acudiente {
  acudiente_id: number
  persona_id: number
  parentesco: string
}

export interface AcudienteConPersona extends Acudiente {
  persona?: {
    persona_id: number
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    numero_documento: string
    tipo_documento_id: number
    fecha_nacimiento: string
    genero: string
  }
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento?: string
}

export interface CreateAcudienteInput {
  acudiente: {
    parentesco: string
  }
  persona: {
    nombres?: string
    apellido_paterno?: string
    apellido_materno?: string
    tipo_documento_id?: number
    numero_documento: string
    fecha_nacimiento?: string
    genero?: string
  }
}

export const acudientesApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<AcudienteConPersona>>("/acudientes/getAll", {
      limit,
      offset,
    }),

  getById: (id: number) =>
    api.get<ApiResponse<AcudienteConPersona>>(`/acudientes/getById/${id}`),

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
