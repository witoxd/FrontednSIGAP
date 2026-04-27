import { api } from "../client"
import type { ApiResponse } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ProcesoInscripcion {
  proceso_id:               number
  periodo_id:               number
  nombre:                   string   // "Ordinaria", "Extraordinaria", "Especial"
  fecha_inicio_inscripcion: string
  fecha_fin_inscripcion:    string
  activo:                   boolean
  created_at?:              string
  // Campos extra que devuelve el getAll (JOIN con periodos_matricula)
  anio?:                    number
  periodo_descripcion?:     string
}

/**
 * Respuesta de /procesos-inscripcion/vigente
 * `abierto` indica si hoy cae dentro de la ventana de algún proceso.
 */
export interface ProcesoVigenteResponse {
  success: boolean
  data:    ProcesoInscripcion | null
  abierto: boolean | false
}

export interface CreateProcesoInput {
  proceso: {
    periodo_id:               number
    nombre:                   string
    fecha_inicio_inscripcion: string
    fecha_fin_inscripcion:    string
    activo?:                  boolean
  }
}

export interface UpdateProcesoInput {
  proceso: Partial<CreateProcesoInput["proceso"]>
}

// ── Service ───────────────────────────────────────────────────────────────────

export const procesosInscripcionApi = {
  getAll: () =>
    api.get<{ success: boolean; data: ProcesoInscripcion[] }>("/procesos-inscripcion/getAll"),

  getById: (id: number) =>
    api.get<ApiResponse<ProcesoInscripcion>>(`/procesos-inscripcion/getById/${id}`),

  getByPeriodo: (periodoId: number) =>
    api.get<{ success: boolean; data: ProcesoInscripcion[] }>(
      `/procesos-inscripcion/getByPeriodo/${periodoId}`
    ),

  /**
   * Devuelve el proceso cuya ventana de fechas incluye hoy, dentro del
   * período activo. Es el equivalente a "¿se puede matricular ahora?".
   * El campo `abierto` es la fuente de verdad para habilitar la UI.
   */
  getVigente: () =>
    api.get<ProcesoVigenteResponse>("/procesos-inscripcion/vigente"),

  create: (data: CreateProcesoInput) =>
    api.post<ApiResponse<ProcesoInscripcion>>("/procesos-inscripcion/create", data),

  update: (id: number, data: UpdateProcesoInput) =>
    api.put<ApiResponse<ProcesoInscripcion>>(`/procesos-inscripcion/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/procesos-inscripcion/delete/${id}`),
}
