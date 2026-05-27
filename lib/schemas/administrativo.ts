import { z } from "zod"
import { PersonaWithTipoDocumentoSchema } from "./persona"
import { DocenteSchema } from "./profesor"

export const AdministrativoSchema = z.object({
  administrativo_id: z.number(),
  docente_id: z.number(),
  cargo: z.string().optional().nullable(),
})

export const AdministrativoWithPersonaDocumentoSchema = z.object({
  persona: PersonaWithTipoDocumentoSchema,
  docente: DocenteSchema,
  administrativo: AdministrativoSchema,
})
