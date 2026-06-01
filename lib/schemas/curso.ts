import { z } from "zod"

const NivelEducativoSchema = z.enum(["Preescolar", "Primaria", "Secundaria", "Media"])

export const CursoSchema = z.object({
  curso_id:         z.number(),
  grado:            z.string(),
  nivel:            NivelEducativoSchema,
  grupo:            z.string(),
  jornada_id:       z.number(),
  jornada_nombre:   z.string().optional().nullable(),
  capacidad_maxima: z.number(),
  activo:           z.boolean(),
})

export const CursoDetallesSchema = CursoSchema.extend({
  directores: z.array(z.object({
    director_id:         z.number(),
    periodo_id:          z.number(),
    anio:                z.number(),
    periodo_descripcion: z.string().optional().nullable(),
    periodo_activo:      z.boolean().optional().nullable(),
    profesor_id:         z.number(),
    nombres:             z.string(),
    apellido_paterno:    z.string().optional().nullable(),
    apellido_materno:    z.string().optional().nullable(),
  })),
  asignaciones: z.array(z.object({
    asignacion_id:    z.number(),
    periodo_id:       z.number(),
    materia:          z.string(),
    horas_semanales:  z.number().optional().nullable(),
    profesor_id:      z.number(),
    nombres:          z.string(),
    apellido_paterno: z.string().optional().nullable(),
    apellido_materno: z.string().optional().nullable(),
  })),
})
