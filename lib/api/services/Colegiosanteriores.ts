import { api } from "../client"
import type {
  ApiResponse,
  CreateColegioDTO,
  UpdateColegioDTO,
  ReplaceColegiosDTO,
  ColegioAnterior
} from "@/lib/types"


const BASE = "/expediente/colegiosAnteriores"

export const colegiosAnterioresApi = {

  // GET /expediente/colegiosAnteriores/:estudianteId
  getByEstudiante: (estudianteId: number) =>
    api.get<ApiResponse<ColegioAnterior[]>>(`${BASE}/${estudianteId}`),

  // POST /expediente/colegiosAnteriores/:estudianteId
  create: (estudianteId: number, dto: CreateColegioDTO) =>
    api.post<ApiResponse<ColegioAnterior>>(`${BASE}/${estudianteId}`, dto),

  // PUT /expediente/colegiosAnteriores/:estudianteId/replaceAll
  replaceAll: (estudianteId: number, dto: ReplaceColegiosDTO) =>
    api.put<ApiResponse<ColegioAnterior[]>>(`${BASE}/${estudianteId}/replaceAll`, dto),

  // PATCH /expediente/colegiosAnteriores/:estudianteId/:colegioId
  update: (estudianteId: number, colegioId: number, dto: UpdateColegioDTO) =>
    api.patch<ApiResponse<ColegioAnterior>>(`${BASE}/${estudianteId}/${colegioId}`, dto),
}