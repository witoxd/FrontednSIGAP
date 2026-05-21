import { z } from "zod"

export const ProcesoInscripcionSchema = z.object({
  proceso_id:               z.number(),
  periodo_id:               z.number(),
  nombre:                   z.string(),
  fecha_inicio_inscripcion: z.string(),
  fecha_fin_inscripcion:    z.string(),
  activo:                   z.boolean(),
  created_at:               z.string().optional().nullable(),
  anio:                     z.number().optional().nullable(),
  periodo_descripcion:      z.string().optional().nullable(),
})

export const ProcesoVigenteResponseSchema = z.object({
  success: z.boolean(),
  data:    ProcesoInscripcionSchema.nullable(),
  abierto: z.boolean(),
})
