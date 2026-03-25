import { api } from "../client"
import type { ApiResponse, LoginResponse, CreateUsuarioInput, Usuario } from "@/lib/types"

export const authApi = {
  login: (email: string, contraseña: string) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", { email, contraseña }),

  me: () => api.get<ApiResponse<{ userId: number; personaId: number; email: string; roles: string[] }>>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),

  // register: (data: {
  //   email: string
  //   username: string
  //   contraseña: string
  //   nombres: string
  //   apellido_paterno?: string
  //   apellido_materno?: string
  //   tipo_documento_id: number
  //   numero_documento: string
  //   fecha_nacimiento: string
  //   genero?: string
  //   role: string
  // }) => api.post<ApiResponse>('/auth/register', data),

  resetPassword: (personaId: number) =>
    api.post<ApiResponse>('auth/resetPassword', { personaId }),

  createUser: (data: Usuario, personaId: number) =>
  api.post<ApiResponse>(`/auth/create-user/${personaId}`, data),

  createUserPersona: (data: CreateUsuarioInput) =>
    api.post<ApiResponse>('/auth/users/with-persona', data),

}


