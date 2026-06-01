import { api } from "../client"
import type { Role } from "@/lib/types"

interface RolesResponse { success: boolean; data: Role[] }
interface RoleResponse  { success: boolean; data: Role }

export const rolesApi = {
  getAll: () =>
    api.get<RolesResponse>("/roles"),

  getById: (id: number) =>
    api.get<RoleResponse>(`/roles/${id}`),

  create: (data: { nombre: string; descripcion?: string }) =>
    api.post<RoleResponse>("/roles", data),

  update: (id: number, data: Partial<{ nombre: string; descripcion: string }>) =>
    api.put<RoleResponse>(`/roles/${id}`, data),

  delete: (id: number) =>
    api.delete<RoleResponse>(`/roles/${id}`),
}
