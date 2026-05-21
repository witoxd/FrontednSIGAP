import { api, validateWith } from "../client"
import type { ApiResponse, CreateUsuarioInput, Usuario } from "@/lib/types"
import {
  ApiResponseSchema,
  LoginResponseSchema,
  MeResponseSchema,
} from "@/lib/schemas"

export const authApi = {
  login: (email: string, contraseña: string) =>
    validateWith(
      ApiResponseSchema(LoginResponseSchema),
      api.post("/auth/login", { email, contraseña })
    ),

  me: () =>
    validateWith(
      ApiResponseSchema(MeResponseSchema),
      api.get("/auth/me")
    ),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse>("/auth/change-password", { currentPassword, newPassword }),

  resetPassword: (personaId: number) =>
    api.post<ApiResponse>("auth/resetPassword", { personaId }),

  createUser: (data: Usuario, personaId: number) =>
    api.post<ApiResponse>(`/auth/create-user/${personaId}`, data),

  createUserPersona: (data: CreateUsuarioInput) =>
    api.post<ApiResponse>("/auth/users/with-persona", data),

  logout: () => api.post<ApiResponse>("/auth/logout"),
}
