import { api } from "../client"
import type { AuditoriaLog, PaginatedApiResponse } from "@/lib/types"

interface AuditoriaParams {
  page?:  number
  limit?: number
}

export const auditoriaApi = {
  getAll: (params?: AuditoriaParams) =>
    api.get<PaginatedApiResponse<AuditoriaLog>>("/auditoria", params as Record<string, number>),

  getByAccion: (accion: string) =>
    api.get<{ success: boolean; data: AuditoriaLog[] }>(`/auditoria/accion/${accion}`),

  getByUsuario: (usuarioId: number, params?: AuditoriaParams) =>
    api.get<PaginatedApiResponse<AuditoriaLog>>(`/auditoria/usuario/${usuarioId}`, params as Record<string, number>),
}
