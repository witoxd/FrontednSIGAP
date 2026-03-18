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

  // ── Estudiantes asignados ───────────────────────────────────────────────────

  /**
   * Obtiene los estudiantes asignados a un acudiente.
   *
   * ⚠️  ENDPOINT PENDIENTE — el backend aún no lo implementa.
   * Cuando esté listo: GET /acudientes/:id/estudiantes
   * Por ahora retorna [] sin hacer request real.
   */
  getEstudiantes: async (_acudienteId: number): Promise<ApiResponse<AsignacionConEstudiante[]>> => {
    console.warn(
      "[acudientesApi.getEstudiantes] Endpoint /acudientes/:id/estudiantes aún no implementado. " +
      "Retornando array vacío hasta que el backend esté listo."
    )
    return { data: [], message: "pendiente", success: true }
  },

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
