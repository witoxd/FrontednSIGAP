import { z } from "zod"
import { api, validateWith } from "../client"
import { ProcesoInscripcionSchema, ProcesoVigenteResponseSchema } from "@/lib/schemas/proceso"
import type { ApiResponse } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ProcesoInscripcion = z.infer<typeof ProcesoInscripcionSchema>

export interface ProcesoVigenteResponse {
  success: boolean
  data:    ProcesoInscripcion | null
  abierto: boolean
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

const ListaSchema = z.object({ success: z.boolean(), data: z.array(ProcesoInscripcionSchema) })

// ── Service ───────────────────────────────────────────────────────────────────

export const procesosInscripcionApi = {
  getAll: () =>
    validateWith(ListaSchema, api.get("/procesos-inscripcion/getAll")),

  getById: (id: number) =>
    validateWith(
      z.object({ success: z.boolean(), data: ProcesoInscripcionSchema }),
      api.get(`/procesos-inscripcion/getById/${id}`)
    ),

  getByPeriodo: (periodoId: number) =>
    validateWith(ListaSchema, api.get(`/procesos-inscripcion/getByPeriodo/${periodoId}`)),

  getVigente: () =>
    validateWith(ProcesoVigenteResponseSchema, api.get("/procesos-inscripcion/vigente")),

  create: (data: CreateProcesoInput) =>
    api.post<ApiResponse<ProcesoInscripcion>>("/procesos-inscripcion/create", data),

  update: (id: number, data: UpdateProcesoInput) =>
    api.put<ApiResponse<ProcesoInscripcion>>(`/procesos-inscripcion/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/procesos-inscripcion/delete/${id}`),
}
