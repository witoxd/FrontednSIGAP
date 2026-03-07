import { api } from "../client"
import type { ApiResponse, UpsertViviendaDTO, ViviendaEstudiante } from "@/lib/types"


const BASE = "/expediente/viviendaEstudiante"

export const viviendaEstudianteApi = {

  // GET /expediente/viviendaEstudiante/:estudianteId
  getByEstudiante: (estudianteId: number) =>
    api.get<ApiResponse<ViviendaEstudiante>>(`${BASE}/${estudianteId}`),

  // PUT /expediente/viviendaEstudiante/:estudianteId
  upsert: (estudianteId: number, dto: UpsertViviendaDTO) =>
    api.put<ApiResponse<ViviendaEstudiante>>(`${BASE}/${estudianteId}`, dto),

  // DELETE /expediente/viviendaEstudiante/:estudianteId
  delete: (estudianteId: number) =>
    api.delete<ApiResponse>(`${BASE}/${estudianteId}`),
}
