import { z } from "zod"
import { PersonaWithTipoDocumentoSchema } from "./persona"
import { EstudianteResumenSchema } from "./estudiante"

const nullToUndefined = z.string().nullish().transform((v) => v ?? undefined)

export const AcudienteSchema = z.object({
  acudiente_id: z.number(),
  parentesco: nullToUndefined,
  ocupacion: nullToUndefined,
  nivel_estudio: nullToUndefined,
})

export const AcudienteWithPersonaSchema = z.object({
  persona: PersonaWithTipoDocumentoSchema,
  acudiente: AcudienteSchema,
})

export const AcudienteEstudianteSchema = z.object({
  acudiente_estudiante_id: z.number(),
  acudiente_id: z.number(),
  tipo_relacion: z.string().optional().nullable(),
  es_principal: z.boolean().optional(),
})

export const AsignacionConEstudianteSchema = z.object({
  estudiante: EstudianteResumenSchema,
  relacion: AcudienteEstudianteSchema,
})

export const AcudienteDeEstudianteSchema = z.object({
  persona: z.object({
    persona_id: z.number(),
    nombres: z.string(),
    apellido_paterno: z.string().optional().nullable(),
    apellido_materno: z.string().optional().nullable(),
    numero_documento: z.string(),
    tipo_documento: z.object({
      tipo_documento_id: z.number(),
      tipo_documento:    z.string().optional().nullable(),
      nombre_documento:  z.string().optional().nullable(),
    }).optional().nullable(),
  }),
  acudiente: AcudienteSchema,
  tipo_relacion: z.string().nullable(),
  es_principal: z.boolean(),
})

export const AcudienteDetallesSchema = AcudienteWithPersonaSchema.extend({
  estudiantes: z.array(z.object({
    estudiante: z.object({
      estudiante_id: z.number(),
      nombres: z.string(),
      apellido_paterno: z.string().optional().nullable(),
      apellido_materno: z.string().optional().nullable(),
      numero_documento: z.string(),
    }),
    relacion: z.object({
      tipo_relacion: z.string().nullable(),
      es_principal: z.boolean(),
    }),
  })),
})
