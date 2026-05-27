import { z } from "zod"
import { PersonaWithTipoDocumentoSchema } from "./persona"

const nullToUndefinedNum = z.number().nullish().transform((v) => v ?? undefined)

export const DocenteSchema = z.object({
  docente_id: z.number(),
  persona_id: nullToUndefinedNum,
  sede: z.string().optional().nullable(),
  jornada_id: z.number().optional().nullable(),
  jornada_nombre: z.string().optional().nullable(),
  tipo_contrato: z.string().optional().nullable(),
  estado: z.enum(["activo", "inactivo"]),
  fecha_contratacion: z.string(),
  // Campos académicos/profesionales
  decreto_id: z.number().optional().nullable(),
  decreto_codigo: z.string().optional().nullable(),
  decreto_nombre: z.string().optional().nullable(),
  titulo: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  posgrado: z.string().optional().nullable(),
  grado_escalafon_id: z.number().optional().nullable(),
  grado_escalafon_codigo: z.string().optional().nullable(),
  fecha_nombramiento: z.string().optional().nullable(),
  numero_resolucion: z.string().optional().nullable(),
  perfil_profesional: z.string().optional().nullable(),
})

export const ProfesorSchema = z.object({
  profesor_id: z.number(),
  docente_id: z.number(),
})

export const ProfesorContactoEmergenciaSchema = z.object({
  contacto_emergencia_id: z.number(),
  profesor_id: z.number().optional(),
  nombre: z.string(),
  parentesco: z.string(),
  telefono: z.string(),
  celular: z.string().optional().nullable(),
  activo: z.boolean().optional(),
})

export const ProfesorWithPersonaDocumentoSchema = z.object({
  persona: PersonaWithTipoDocumentoSchema,
  docente: DocenteSchema,
  profesor: ProfesorSchema,
})

export const ProfesorDetallesSchema = ProfesorWithPersonaDocumentoSchema.extend({
  contactos_emergencia: z.array(ProfesorContactoEmergenciaSchema),
})
