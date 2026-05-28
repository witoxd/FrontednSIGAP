import { api, validateWith } from "../client"
import type { ApiResponse, Curso, CreateCursoInput } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  CursoSchema,
  CursoDetallesSchema,
} from "@/lib/schemas"

export const cursosApi = {
  getAll: (limit = 50, offset = 0, soloActivos = false) => {
    const params: Record<string, string | number> = { limit, offset }
    if (soloActivos) params.activos = "true"
    return validateWith(
      PaginatedApiResponseSchema(CursoSchema),
      api.get("/cursos/getAll", params)
    )
  },

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(CursoSchema),
      api.get(`/cursos/getById/${id}`)
    ),

  getDetalles: (id: number) =>
    validateWith(
      ApiResponseSchema(CursoDetallesSchema),
      api.get(`/cursos/getDetalles/${id}`)
    ),

  create: (data: CreateCursoInput) =>
    api.post<ApiResponse>("/cursos/create", data),

  update: (id: number, data: { curso: Partial<Curso> }) =>
    api.put<ApiResponse>(`/cursos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/cursos/delete/${id}`),

  getEstudiantes: (cursoId: number, opts: { periodo_id?: number; estado?: string } = {}) => {
    const params: Record<string, string | number> = {}
    if (opts.periodo_id) params.periodo_id = opts.periodo_id
    if (opts.estado)     params.estado     = opts.estado
    return api.get<ApiResponse>(`/matriculas/byCurso/${cursoId}`, params)
  },

  getDetallesPorPeriodo: (cursoId: number, periodoId: number) =>
    api.get<ApiResponse>(`/cursos/getDetallesPorPeriodo/${cursoId}`, { periodo_id: periodoId }),
}
