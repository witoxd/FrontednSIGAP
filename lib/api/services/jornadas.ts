import { api, validateWith } from "../client"
import type { ApiResponse, CreateJornadaInput, Jornada } from "@/lib/types"
import {
  ApiResponseSchema,
  JornadaSchema,
} from "@/lib/schemas"

export const jornadasApi = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      ApiResponseSchema(JornadaSchema.array()),
      api.get("/jornadas/getAll", { limit, offset })
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(JornadaSchema),
      api.get(`/jornadas/getById/${id}`)
    ),

  create: (data: CreateJornadaInput) =>
    api.post<ApiResponse>("/jornadas/create", data),

  update: (id: number, data: Partial<CreateJornadaInput>) =>
    validateWith(
      ApiResponseSchema(JornadaSchema),
      api.put(`/jornadas/update/${id}`, data)
    ),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/jornadas/delete/${id}`),
}
