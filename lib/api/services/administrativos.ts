import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  AdministrativoWithPersonaDocumento,
  CreateAdministrativoInput,
} from "@/lib/types"

export const admisnitrativosApui = {
    getAll : (limit = 50, offset = 0) =>
        api.get<PaginatedApiResponse<AdministrativoWithPersonaDocumento>>("/administrativos/getAll", {
            limit,
            offset,
        }),
    
    getById: (id: number) =>
        api.get<ApiResponse<AdministrativoWithPersonaDocumento>>(`/administrativos/getById/${id}`),

    create: (data: CreateAdministrativoInput) =>
        api.post<ApiResponse>("/administrativos/create", data),

    update: (id: number, data: Partial<CreateAdministrativoInput>) =>
        api.put<ApiResponse>(`/administrativos/update/${id}`, data),

    delete: (id: number) =>
        api.delete<ApiResponse>(`/administrativos/delete/${id}`),
}