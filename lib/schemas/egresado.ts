import { z } from "zod"
import { PersonaWithTipoDocumentoSchema } from "./persona"

// El backend retorna { persona: {...}, egresado: { egresado_id, fecha_grado, estudiante: {...} } }
export const EgresadoSchema = z.object({
  persona: PersonaWithTipoDocumentoSchema,
  egresado: z.object({
    egresado_id: z.number(),
    fecha_grado: z.string(),
    estudiante: z.object({
      estudiante_id: z.number(),
      fecha_ingreso: z.string().optional().nullable(),
      estado:        z.string(),
    }),
  }),
})
