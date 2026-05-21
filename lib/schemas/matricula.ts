import { z } from "zod"

const EstadoMatriculaSchema = z.enum(["activa", "finalizada", "retirada", "inactiva"])

export const MatriculaSchema = z.object({
  matricula_id:   z.number(),
  estudiante_id:  z.number(),
  curso_id:       z.number(),
  periodo_id:     z.number(),
  fecha_matricula: z.string(),
  estado_actual:  EstadoMatriculaSchema,
  anio:           z.number(),
  jornada_id:     z.number().optional().nullable(),
})

export const MatriculaHistorialItemSchema = z.object({
  historial_id:           z.number(),
  curso_anterior_nombre:  z.string().optional().nullable(),
  curso_nuevo_nombre:     z.string().optional().nullable(),
  jornada_anterior_nombre: z.string().optional().nullable(),
  jornada_nuevo_nombre:   z.string().optional().nullable(),
  estado_anterior:        z.string(),
  estado_nuevo:           z.string(),
  modificado_en:          z.string(),
  motivo_cambio:          z.string().optional().nullable(),
  modificado_por_nombre:  z.string().optional().nullable(),
})

export const MatriculaConRelacionesSchema = MatriculaSchema.extend({
  estudiante_nombre: z.string().optional().nullable(),
  profesor_nombre:   z.string().optional().nullable(),
  curso_nombre:      z.string().optional().nullable(),
  jornada_nombre:    z.string().optional().nullable(),
})

export const MatriculaDeEstudianteSchema = z.object({
  matricula_id:         z.number(),
  estado_actual:        EstadoMatriculaSchema,
  fecha_matricula:      z.string(),
  fecha_retiro:         z.string().optional().nullable(),
  motivo_retiro:        z.string().optional().nullable(),
  anio:                 z.number(),
  curso_nombre:         z.string(),
  curso_grupo:          z.string().optional().nullable(),
  grado:                z.string().optional().nullable(),
  jornada_nombre:       z.string(),
  periodo_descripcion:  z.string().optional().nullable(),
  periodo_fecha_inicio: z.string().optional().nullable(),
  periodo_fecha_fin:    z.string().optional().nullable(),
  historial:            z.array(MatriculaHistorialItemSchema),
})

export const MatriculaDetallesSchema = z.object({
  estado_actual:   EstadoMatriculaSchema,
  fecha_matricula: z.string(),
  curso_id:        z.number().optional(),
  jornada_id:      z.number().optional(),
  fecha_retiro:    z.string().optional().nullable(),
  motivo_retiro:   z.string().optional().nullable(),
  anio:            z.number(),
  curso: z.object({
    nombre: z.string(),
    grado:  z.string(),
    // descripcion no viene del backend
    descripcion: z.string().optional().nullable(),
  }),
  jornada: z.object({
    nombre:      z.string(),
    hora_inicio: z.string().optional().nullable(),
    hora_fin:    z.string().optional().nullable(),
  }),
  periodo: z.object({
    descripcion: z.string().optional().nullable(),
    fecha_inicio: z.string().optional().nullable(),
    fecha_fin:    z.string().optional().nullable(),
  }),
  estudiante: z.object({
    nombres:          z.string(),
    apellido_paterno: z.string(),
    apellido_materno: z.string().optional().nullable(),
    numero_documento: z.string(),
    nombre_documento: z.string().optional().nullable(),
  }),
  archivos: z.array(z.object({
    nombre:      z.string(),
    url_archivo: z.string(),
    descripcion: z.string().optional().nullable(),
    fecha_carga: z.string(),
    tipo_archivo: z.object({ nombre: z.string() }),
  })),
  archivos_requeridos: z.array(z.object({
    nombre:      z.string(),
    descripcion: z.string().optional().nullable(),
    entregado:   z.boolean(),
    url_archivo: z.string().optional().nullable(),
    fecha_carga: z.string().optional().nullable(),
  })),
  historial: z.array(MatriculaHistorialItemSchema),
  sanciones: z.array(z.object({
    suspension_id:  z.number(),
    motivo:         z.string(),
    fecha_inicio:   z.string(),
    fecha_fin:      z.string(),
    tipo:           z.literal("suspension"),
    registrado_por: z.string().optional().nullable(),
    vigente:        z.boolean(),
  })).optional().default([]),
})
