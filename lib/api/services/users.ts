import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  Usuario,
  Persona,
  User,
  Role,
} from "@/lib/types"

// ─── DTOs locales ─────────────────────────────────────────────────────────────

export interface UsuarioDetalle extends Usuario {
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  numero_documento: string
  tipo_documento: string
  fecha_nacimiento: string
  genero: string
  roles: Role["nombre"][]
}

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
  // GET /users/search
  search: (params?: SearchUsersParams) =>
    api.get<PaginatedApiResponse<UsuarioDetalle>>("/users/search", params as Record<string, string | number>),

  // GET /users/getById/:id
  getById: (id: number) =>
    api.get<ApiResponse<UsuarioDetalle>>(`/users/getById/${id}`),

  // POST /auth/create-user/:personaId  — crea usuario para una persona ya existente
  createUser: (personaId: number, data: CreateUserInput) =>
    api.post<ApiResponse<{ userId: number; personaId: number; role: string }>>(
      `/auth/create-user/${personaId}`,
      data,
    ),

  // POST /auth/users/with-persona  — crea persona y usuario en una sola transacción
  createUserWithPersona: (data: CreateUserWithPersonaInput) =>
    api.post<ApiResponse<{ userId: number; personaId: number; role: string }>>(
      "/auth/users/with-persona",
      data,
    ),

  // POST /auth/resetPassword/:id  — resetea la contraseña al número de documento
  resetPassword: (personaId: number) =>
    api.post<ApiResponse>(`/auth/resetPassword/${personaId}`),

  // POST /users/transfer-admin/toUser/:id  — transfiere el rol admin a otro usuario
  transferAdmin: (toUserId: number) =>
    api.post<ApiResponse>(`/users/transfer-admin/toUser/${toUserId}`),

  // PATCH /users/:id/status/:activo  — activa o desactiva un usuario
  toggleStatus: (id: number, activo: boolean) =>
    api.patch<ApiResponse>(`/users/${id}/status/${activo}`),
}
