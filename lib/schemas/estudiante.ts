import { z } from "zod"
import { PersonaWithTipoDocumentoSchema } from "./persona"

export const EstudianteSchema = z.object({
  estudiante_id: z.number().optional(),
  persona_id: z.number().optional(),
  estado: z.enum(["activo", "inactivo", "graduado", "suspendido", "expulsado"]),
  estado_efectivo: z.enum(["activo", "inactivo", "egresado", "suspendido", "expulsado"]).optional(),
  fecha_ingreso: z.string(),
})

export const SuspensionSchema = z.object({
  suspension_id: z.number(),
  estudiante_id: z.number(),
  matricula_id: z.number().optional().nullable(),
  motivo: z.string(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  created_at: z.string().optional().nullable(),
  creado_por_nombre: z.string().optional().nullable(),
  vigente: z.boolean().optional(),
})

export const EstudianteWithPersonaDocumentoSchema = z.object({
  persona: PersonaWithTipoDocumentoSchema,
  estudiante: EstudianteSchema,
})

export const EstudianteResumenSchema = z.object({
  persona_id: z.number(),
  nombres: z.string(),
  apellido_paterno: z.string().optional().nullable(),
  apellido_materno: z.string().optional().nullable(),
  numero_documento: z.string(),
  estudiante_id: z.number(),
})
