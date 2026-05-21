import { z } from "zod"

const nullToUndefined = z.string().nullish().transform((v) => v ?? undefined)

export const JornadaSchema = z.object({
  jornada_id: z.number(),
  nombre: z.string(),
  hora_inicio: nullToUndefined,
  hora_fin: nullToUndefined,
})
