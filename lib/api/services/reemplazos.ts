import { api } from "../client"
import type { ApiResponse, ReemplazoProfesor, ReemplazosProfesorResponse } from "@/lib/types"

export const reemplazosApi = {
  getByProfesor: (profesorId: number) =>
    api.get<ApiResponse<ReemplazosProfesorResponse>>(`/reemplazos-profesor/profesor/${profesorId}`),

  create: (data: { profesor_id: number; reemplaza_a_profesor_id: number; fecha_inicio: string; motivo?: string }) =>
    api.post<ApiResponse<ReemplazoProfesor>>("/reemplazos-profesor/create", data),

  cerrar: (reemplazoId: number, fecha_fin: string) =>
    api.put<ApiResponse<ReemplazoProfesor>>(`/reemplazos-profesor/cerrar/${reemplazoId}`, { fecha_fin }),
}
