import { z } from "zod"

const ContextoArchivoSchema = z.enum([
  "estudiante", "profesor", "administrativo", "acudiente", "matricula",
])

// El backend devuelve: archivo_id, persona_id, tipo_archivo_id, nombre, url_archivo,
// descripcion, asignado_por, fecha_carga, activo
export const ArchivoSchema = z.object({
  archivo_id:      z.number(),
  persona_id:      z.number(),
  tipo_archivo_id: z.number().optional().nullable(),
  nombre:          z.string(),
  url_archivo:     z.string(),
  descripcion:     z.string().optional().nullable(),
  asignado_por:    z.number().optional().nullable(),
  fecha_carga:     z.string().optional().nullable(),
  activo:          z.boolean().optional(),
})

export const TipoArchivoSchema = z.object({
  tipo_archivo_id:         z.number(),
  nombre:                  z.string(),
  descripcion:             z.string().optional().nullable(),
  extensiones_permitidas:  z.array(z.string()).optional().nullable(),
  activo:                  z.boolean().optional(),
  aplica_a:                z.array(ContextoArchivoSchema).optional().nullable(),
  requerido_en:            z.array(ContextoArchivoSchema).optional().nullable(),
})
