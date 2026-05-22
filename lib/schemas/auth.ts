import { z } from "zod"

export const AuthUserSchema = z.object({
  id: z.number(),
  personaId: z.number(),
  username: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
})

export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
})

export const MeResponseSchema = z.object({
  userId: z.number(),
  personaId: z.number(),
  username: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
})
