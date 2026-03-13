import { api } from "../client"
import type { ApiResponse, ExpedienteResponse, UpsertExpedienteDTO } from "@/lib/types"

/**
 * Servicio para el endpoint compuesto /expediente/:estudianteId
 *
 * GET  → trae ficha + colegios + vivienda en 1 sola request (Promise.all en el backend)
 * PUT  → guarda todo en 1 transacción — cada sección es opcional
 */
export const expedienteApi = {

  // GET /ficha/expediente/:estudianteId
  get: (estudianteId: number) =>
    api.get<ApiResponse<ExpedienteResponse>>(`/ficha/expediente/${estudianteId}`),

  // PUT /ficha/expediente/:estudianteId
  upsert: (estudianteId: number, dto: UpsertExpedienteDTO) =>
    api.put<ApiResponse<ExpedienteResponse>>(`/ficha/expediente/${estudianteId}`, dto),
}
