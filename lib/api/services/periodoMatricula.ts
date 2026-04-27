import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PeriodoMatricula {
  periodo_id:   number
  anio:         number
  fecha_inicio: string
  fecha_fin:    string
  activo:       boolean
  descripcion?: string
  created_by?:  number
  created_at?:  string
}

export interface PeriodoActivoResponse {
  success: boolean
  data:    PeriodoMatricula | null
  abierto: boolean
}

export interface VigenciaResponse {
  success:        boolean
  abierto:        boolean
  dias_restantes?: number
  mensaje:        string
  periodo?:       PeriodoMatricula
}

export interface CreatePeriodoInput {
  periodo: {
    anio:        number
    fecha_inicio: string
    fecha_fin:    string
    descripcion?: string
  }
}

export interface UpdatePeriodoInput {
  periodo: Partial<CreatePeriodoInput["periodo"]>
}

// ── Service ───────────────────────────────────────────────────────────────────

export const periodoMatriculaApi = {
  getAll: () =>
    api.get<{ success: boolean; data: PeriodoMatricula[] }>("/periodos-matricula/getAll"),

  getById: (id: number) =>
    api.get<ApiResponse<PeriodoMatricula>>(`/periodos-matricula/getById/${id}`),

  /**
   * Devuelve el período activo. El campo `abierto` es el que el frontend
   * usa para decidir si habilitar el proceso — no leer solo `data`.
   */
  getActivo: () =>
    api.get<PeriodoActivoResponse>("/periodos-matricula/activo"),

  verificarVigencia: () =>
    api.get<VigenciaResponse>("/periodos-matricula/vigencia"),

  create: (data: CreatePeriodoInput) =>
    api.post<ApiResponse<PeriodoMatricula>>("/periodos-matricula/create", data),

  update: (id: number, data: UpdatePeriodoInput) =>
    api.put<ApiResponse<PeriodoMatricula>>(`/periodos-matricula/update/${id}`, data),

  activar: (id: number) =>
    api.patch<ApiResponse<PeriodoMatricula>>(`/periodos-matricula/activar/${id}`),

  desactivar: (id: number) =>
    api.patch<ApiResponse<PeriodoMatricula>>(`/periodos-matricula/desactivar/${id}`),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/periodos-matricula/delete/${id}`),
}
