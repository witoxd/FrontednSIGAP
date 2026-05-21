import { api } from "../client"
import type { ApiResponse, ProfesorContactoEmergencia } from "@/lib/types"

export const profesorContactoEmergenciaApi = {
  getByProfesor: (profesorId: number) =>
    api.get<ApiResponse<ProfesorContactoEmergencia[]>>(
      `/profesores/${profesorId}/contactos-emergencia`
    ),

  create: (profesorId: number, data: Omit<ProfesorContactoEmergencia, "contacto_emergencia_id" | "profesor_id" | "activo">) =>
    api.post<ApiResponse<ProfesorContactoEmergencia>>(
      `/profesores/${profesorId}/contactos-emergencia`,
      data
    ),

  update: (profesorId: number, contactoId: number, data: Partial<Omit<ProfesorContactoEmergencia, "contacto_emergencia_id" | "profesor_id" | "activo">>) =>
    api.put<ApiResponse<ProfesorContactoEmergencia>>(
      `/profesores/${profesorId}/contactos-emergencia/${contactoId}`,
      data
    ),

  delete: (profesorId: number, contactoId: number) =>
    api.delete<ApiResponse<void>>(
      `/profesores/${profesorId}/contactos-emergencia/${contactoId}`
    ),
}
