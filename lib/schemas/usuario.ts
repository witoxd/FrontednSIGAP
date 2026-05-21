import { z } from "zod"

export const RoleNombreSchema = z.enum(["admin", "profesor", "estudiante", "administrativo"])

export const UsuarioSchema = z.object({
  usuario_id:     z.number(),
  persona_id:     z.number().optional().nullable(),
  username:       z.string(),
  email:          z.string().email(),
  activo:         z.boolean(),
  fecha_creacion: z.string().optional().nullable(),
})

// findById devuelve u.* + nombres/apellidos del LEFT JOIN personas
export const UsuarioDetalleSchema = UsuarioSchema.extend({
  nombres:          z.string().optional().nullable(),
  apellido_paterno: z.string().optional().nullable(),
  apellido_materno: z.string().optional().nullable(),
  // Los siguientes campos NO vienen del backend actualmente
  numero_documento: z.string().optional().nullable(),
  tipo_documento:   z.string().optional().nullable(),
  fecha_nacimiento: z.string().optional().nullable(),
  genero:           z.string().optional().nullable(),
  roles:            z.array(RoleNombreSchema).optional().nullable(),
})

export type UsuarioDetalle = z.infer<typeof UsuarioDetalleSchema>
