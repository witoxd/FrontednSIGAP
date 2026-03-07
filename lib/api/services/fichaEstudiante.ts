import { api } from "../client"
import type { ApiResponse, UpsertFichaDTO, FichaEstudiante } from "@/lib/types"

const BASE = "/expediente/fichaEstudiante"

export const fichaEstudianteApi = {

  // GET /expediente/fichaEstudiante/:estudianteId
  getByEstudiante: (estudianteId: number) =>
    api.get<ApiResponse<FichaEstudiante>>(`${BASE}/${estudianteId}`),

  // PUT /expediente/fichaEstudiante/:estudianteId
  upsert: (estudianteId: number, dto: UpsertFichaDTO) =>
    api.put<ApiResponse<FichaEstudiante>>(`${BASE}/${estudianteId}`, dto),

  // DELETE /expediente/fichaEstudiante/:estudianteId
  delete: (estudianteId: number) =>
    api.delete<ApiResponse>(`${BASE}/${estudianteId}`),
}
