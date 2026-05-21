import { api, validateWith } from "../client"
import type { ApiResponse, Persona, User, Role } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  UsuarioDetalleSchema,
} from "@/lib/schemas"
import { z } from "zod"

// ─── Re-export del tipo inferido por Zod (compatibilidad con componentes) ─────
export type UsuarioDetalle = z.infer<typeof UsuarioDetalleSchema>

// ─── DTOs locales ─────────────────────────────────────────────────────────────

export interface SearchUsersParams {
  query?: string
  nombres?: string
  numero_documento?: string
  role?: Role["nombre"]
  page?: number
  limit?: number
}

export interface CreateUserInput {
  user: User
  role: Role["nombre"]
}

export interface CreateUserWithPersonaInput {
  persona: Omit<Persona, "persona_id">
  user: User
  role: Role["nombre"]
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const usersApi = {
  search: (params?: SearchUsersParams) =>
    validateWith(
      PaginatedApiResponseSchema(UsuarioDetalleSchema),
      api.get("/users/search", params as Record<string, string | number>)
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(UsuarioDetalleSchema),
      api.get(`/users/getById/${id}`)
    ),

  createUser: (personaId: number, data: CreateUserInput) =>
    api.post<ApiResponse<{ userId: number; personaId: number; role: string }>>(
      `/auth/create-user/${personaId}`,
      data,
    ),

  createUserWithPersona: (data: CreateUserWithPersonaInput) =>
    api.post<ApiResponse<{ userId: number; personaId: number; role: string }>>(
      "/auth/users/with-persona",
      data,
    ),

  resetPassword: (personaId: number) =>
    api.post<ApiResponse>(`/auth/resetPassword/${personaId}`),

  transferAdmin: (toUserId: number) =>
    api.post<ApiResponse>(`/users/transfer-admin/toUser/${toUserId}`),

  toggleStatus: (id: number, activo: boolean) =>
    api.patch<ApiResponse>(`/users/${id}/status/${activo}`),
}
