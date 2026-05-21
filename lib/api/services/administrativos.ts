import { api, validateWith } from "../client"
import type { ApiResponse, CreateAdministrativoInput } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  AdministrativoWithPersonaDocumentoSchema,
} from "@/lib/schemas"

export const admisnitrativosApui = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      PaginatedApiResponseSchema(AdministrativoWithPersonaDocumentoSchema),
      api.get("/administrativos/getAll", { limit, offset })
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(AdministrativoWithPersonaDocumentoSchema),
      api.get(`/administrativos/getById/${id}`)
    ),

  create: (data: CreateAdministrativoInput) =>
    api.post<ApiResponse>("/administrativos/create", data),

  update: (id: number, data: Partial<CreateAdministrativoInput>) =>
    api.put<ApiResponse>(`/administrativos/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/administrativos/delete/${id}`),
}
