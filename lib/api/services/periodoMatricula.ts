import { api, validateWith } from "../client"
import type { ApiResponse } from "@/lib/types"
import {
  ApiResponseSchema,
  PeriodoMatriculaSchema,
  PeriodoActivoResponseSchema,
  VigenciaResponseSchema,
} from "@/lib/schemas"
import { z } from "zod"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type PeriodoMatricula = z.infer<typeof PeriodoMatriculaSchema>
export type PeriodoActivoResponse = z.infer<typeof PeriodoActivoResponseSchema>
export type VigenciaResponse = z.infer<typeof VigenciaResponseSchema>

export interface CreatePeriodoInput {
  periodo: {
    anio:         number
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
    validateWith(
      z.object({ success: z.boolean(), data: PeriodoMatriculaSchema.array() }),
      api.get("/periodos-matricula/getAll")
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(PeriodoMatriculaSchema),
      api.get(`/periodos-matricula/getById/${id}`)
    ),

  getActivo: () =>
    validateWith(
      PeriodoActivoResponseSchema,
      api.get("/periodos-matricula/activo")
    ),

  verificarVigencia: () =>
    validateWith(
      VigenciaResponseSchema,
      api.get("/periodos-matricula/vigencia")
    ),

  create: (data: CreatePeriodoInput) =>
    validateWith(
      ApiResponseSchema(PeriodoMatriculaSchema),
      api.post("/periodos-matricula/create", data)
    ),

  update: (id: number, data: UpdatePeriodoInput) =>
    validateWith(
      ApiResponseSchema(PeriodoMatriculaSchema),
      api.put(`/periodos-matricula/update/${id}`, data)
    ),

  activar: (id: number) =>
    validateWith(
      ApiResponseSchema(PeriodoMatriculaSchema),
      api.patch(`/periodos-matricula/activar/${id}`)
    ),

  desactivar: (id: number) =>
    validateWith(
      ApiResponseSchema(PeriodoMatriculaSchema),
      api.patch(`/periodos-matricula/desactivar/${id}`)
    ),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/periodos-matricula/delete/${id}`),
}
