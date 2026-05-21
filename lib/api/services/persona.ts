
import { api, validateWith } from "../client"
import { ApiResponseSchema, PersonaWithTipoDocumentoSchema } from "@/lib/schemas"
import { z } from "zod"

const PersonaWithTipoDocumentoJSONSchema = z.object({
  persona: PersonaWithTipoDocumentoSchema,
})

export const personaApi = {
  searchIndex: (query: string) =>
    validateWith(
      ApiResponseSchema(PersonaWithTipoDocumentoJSONSchema.array()),
      api.get(`/personas/searchIndex/${encodeURIComponent(query)}`)
    ),
}