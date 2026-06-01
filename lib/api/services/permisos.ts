import { api } from "../client"
import type { Permiso } from "@/lib/types"

interface PermisosResponse { success: boolean; data: Permiso[] }
interface PermisoResponse  { success: boolean; data: Permiso }

export const permisosApi = {
  getAll: () =>
    api.get<PermisosResponse>("/permisos"),

  getByRole: (roleId: number) =>
    api.get<PermisosResponse>(`/permisos/role/${roleId}`),

  assignToRole: (roleId: number, permisoId: number) =>
    api.post<{ success: boolean; message: string }>(`/permisos/${roleId}/assign/${permisoId}`),

  removeFromRole: (roleId: number, permisoId: number) =>
    api.delete<{ success: boolean; message: string }>(`/permisos/${roleId}/remove/${permisoId}`),
}
