import { api } from "../client"
import type { ApiResponse, AsignacionDocente, CreateAsignacionDocenteInput } from "@/lib/types"

export const asignacionesApi = {
  getByProfesor: (profesorId: number, periodoId?: number) => {
    const url = periodoId
      ? `/asignacion-docente/profesor/${profesorId}?periodo_id=${periodoId}`
      : `/asignacion-docente/profesor/${profesorId}`
    return api.get<ApiResponse<AsignacionDocente[]>>(url)
  },

  create: (data: CreateAsignacionDocenteInput) =>
    api.post<ApiResponse<AsignacionDocente>>("/asignacion-docente/create", data),

  update: (id: number, data: { materia?: string; horas_semanales?: number | null }) =>
    api.put<ApiResponse<AsignacionDocente>>(`/asignacion-docente/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<AsignacionDocente>>(`/asignacion-docente/delete/${id}`),
}
