import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  AcudienteWithPersona,
  CreateAcudienteInput,
  UpdateAcudienteInput,
  AssignToEstudianteDTO,
  AcudienteEstudiante,
  AsignacionConEstudiante,
} from "@/lib/types"

export const acudientesApi = {
  // ── CRUD básico ─────────────────────────────────────────────────────────────

  getAll: (limit = 20, offset = 0) =>
    api.get<PaginatedApiResponse<AcudienteWithPersona>>(
      `/acudientes/getAll?limit=${limit}&offset=${offset}`
    ),

  getById: (acudienteId: number) =>
    api.get<ApiResponse<AcudienteWithPersona>>(`/acudientes/getById/${acudienteId}`),

  create: (dto: CreateAcudienteInput) =>
    api.post<ApiResponse<AcudienteWithPersona>>("/acudientes/create", dto),

  update: (acudienteId: number, dto: UpdateAcudienteInput) =>
    api.put<ApiResponse<AcudienteWithPersona>>(`/acudientes/update/${acudienteId}`, dto),

  delete: (acudienteId: number) =>
    api.delete<ApiResponse<void>>(`/acudientes/delete/${acudienteId}`),

  searchIndex: (query: string) =>
    api.get<ApiResponse<any[]>>(`/acudientes/searchIndex/${encodeURIComponent(query)}`),

  // ── Estudiantes asignados ───────────────────────────────────────────────────


    getEstudiantes: async (acudienteId: number) =>
    api.get<ApiResponse<AsignacionConEstudiante[]>>(`/acudientes/${acudienteId}/estudiantes`),

    getByEstudiante: (estudianteId: number) =>
    api.get<ApiResponse<any[]>>(`/acudientes/${estudianteId}/estudiantes`),
 

  // ── Asignación ──────────────────────────────────────────────────────────────

  /**
   * Asigna un estudiante a un acudiente.
   * POST /acudientes/assignToEstudiante
   *
   * El DTO envuelve los datos en la clave "assignToEstudiante"
   * tal como lo espera el backend.
   */
  assignToEstudiante: (dto: AssignToEstudianteDTO) =>
    api.post<ApiResponse<AcudienteEstudiante>>("/acudientes/assignToEstudiante", dto),

  /**
   * Desasigna un estudiante de un acudiente.
   * PATCH /acudientes/removeFromEstudiante/estudiante/:estudianteId/acudiente/:acudienteId
   */
  removeFromEstudiante: (estudianteId: number, acudienteId: number) =>
    api.patch<ApiResponse<void>>(
      `/acudientes/removeFromEstudiante/estudiante/${estudianteId}/acudiente/${acudienteId}`
    ),
}
