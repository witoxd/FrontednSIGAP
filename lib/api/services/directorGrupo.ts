import { api } from "../client"
import type { ApiResponse, CreateDirectorGrupoInput, DirectorGrupoProfesor } from "@/lib/types"

export const directorGrupoApi = {
  getByProfesor: (profesorId: number) =>
    api.get<ApiResponse<DirectorGrupoProfesor[]>>(`/director-grupo/profesor/${profesorId}`),

  create: (data: CreateDirectorGrupoInput) =>
    api.post<ApiResponse<DirectorGrupoProfesor>>("/director-grupo/create", data),

  update: (id: number, profesorId: number) =>
    api.put<ApiResponse<DirectorGrupoProfesor>>(`/director-grupo/update/${id}`, { profesor_id: profesorId }),

  delete: (id: number) =>
    api.delete<ApiResponse<DirectorGrupoProfesor>>(`/director-grupo/delete/${id}`),
}
