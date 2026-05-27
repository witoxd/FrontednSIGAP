import { z } from "zod"

export const DecretoSchema = z.object({
  decreto_id:  z.number(),
  codigo:      z.string(),
  nombre:      z.string(),
  descripcion: z.string().optional().nullable(),
})

export const GradoEscalafonSchema = z.object({
  grado_id:      z.number(),
  decreto_id:    z.number(),
  codigo:        z.string(),
  descripcion:   z.string().optional().nullable(),
  orden:         z.number(),
  decreto_codigo: z.string().optional(),
  decreto_nombre: z.string().optional(),
})
