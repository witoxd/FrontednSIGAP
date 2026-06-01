import { z } from "zod"

// Convierte null → undefined para que el tipo de salida sea `string | undefined`
// y sea compatible con las interfaces TypeScript existentes.
const nullToUndefined = z.string().nullish().transform((v) => v ?? undefined)

export const TipoDocumentoSchema = z.object({
  tipo_documento_id: z.number(),
  tipo_documento: z.string(),
  nombre_documento: z.string().optional().nullable(),
})

export const PersonaSchema = z.object({
  persona_id: z.number().optional(),
  nombres: z.string(),
  apellido_paterno: nullToUndefined,
  apellido_materno: nullToUndefined,
  tipo_documento_id: z.number(),
  numero_documento: z.string(),
  fecha_nacimiento: z.string(),
  genero: z.enum(["Masculino", "Femenino", "Otro"]),
  grupo_sanguineo: nullToUndefined,
  grupo_etnico: nullToUndefined,
  credo_religioso: nullToUndefined,
  lugar_nacimiento: nullToUndefined,
  serial_registro_civil: nullToUndefined,
  expedida_en: nullToUndefined,
})

export const PersonaWithTipoDocumentoSchema = z.object({
  persona_id: z.number(),
  nombres: z.string(),
  apellido_paterno: nullToUndefined,
  apellido_materno: nullToUndefined,
  tipo_documento: TipoDocumentoSchema,
  numero_documento: z.string(),
  fecha_nacimiento: z.string(),
  genero: z.enum(["Masculino", "Femenino", "Otro"]),
  grupo_sanguineo: nullToUndefined,
  grupo_etnico: nullToUndefined,
  credo_religioso: nullToUndefined,
  lugar_nacimiento: nullToUndefined,
  serial_registro_civil: nullToUndefined,
  expedida_en: nullToUndefined,
})
