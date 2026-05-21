import { z } from "zod"

export const PeriodoMatriculaSchema = z.object({
  periodo_id: z.number(),
  anio: z.number(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  activo: z.boolean(),
  descripcion: z.string().optional().nullable(),
  created_by: z.number().optional().nullable(),
  created_at: z.string().optional().nullable(),
})

export const PeriodoActivoResponseSchema = z.object({
  success: z.boolean(),
  data: PeriodoMatriculaSchema.nullable(),
  abierto: z.boolean(),
})

export const VigenciaResponseSchema = z.object({
  success: z.boolean(),
  abierto: z.boolean(),
  dias_restantes: z.number().optional().nullable(),
  mensaje: z.string(),
  periodo: PeriodoMatriculaSchema.optional(),
})
