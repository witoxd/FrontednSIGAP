import { api } from "../client"
import type { ApiResponse } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PeriodoMatricula {
  periodo_id:   number
  anio:         number
  fecha_inicio: string   // ISO string desde el backend
  fecha_fin:    string
  activo:       boolean
  descripcion?: string
  created_by?:  number
  created_at?:  string
}

/**
 * Respuesta de /periodos-matricula/activo
 * El campo `abierto` es el que el frontend usa para decidir
 * si mostrar el botón "Nueva matrícula" — no leer solo `data`.
 */
export interface PeriodoActivoResponse {
  success: boolean
  data:    PeriodoMatricula | null
  abierto: boolean
}

// ── Service ───────────────────────────────────────────────────────────────────

export const periodoMatriculaApi = {
  /**
   * Consulta si hay un período de matrícula activo.
   * El frontend debe llamar esto al montar la página de matrículas
   * para decidir si habilitar o no el botón "Nueva matrícula".
   *
   * No usar SWR aquí: el período puede cambiar mientras el admin
   * tiene la página abierta, así que se llama manualmente cuando
   * el usuario intenta crear una matrícula, no solo al montar.
   */
  getActivo: () =>
    api.get<PeriodoActivoResponse>("/periodos-matricula/activo"),
}
