import { api } from "../client"
import type {
  ApiResponse,
  PaginatedApiResponse,
  MatriculaConRelaciones,
  CreateMatriculaInput,
} from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ArchivoMetadata {
  tipo_archivo_id: number
  descripcion?:    string
}

export interface ProcessMatriculaInput {
  matricula: {
    estudiante_id: number
    curso_id:      number
    jornada_id:    number
  }
  archivos:  File[]
  metadata:  ArchivoMetadata[]
}

export interface ProcessMatriculaResponse {
  matricula: MatriculaConRelaciones
  archivos:  Array<{
    archivo_id:  number
    nombre:      string
    url_archivo: string
    file_info: {
      originalName: string
      size:         number
      mimetype:     string
    }
  }>
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("sigap_token")
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

/**
 * Envía la matrícula + archivos en una sola petición multipart/form-data.
 *
 * Shape que espera el backend:
 *   matricula  → JSON string  { estudiante_id, curso_id, jornada_id }
 *   metadata   → JSON string  [{ tipo_archivo_id, descripcion }, ...]
 *   archivos   → File[]  (mismo key repetido, mismo orden que metadata)
 *
 * Usamos XHR en lugar de fetch para trackear el progreso del upload.
 */
async function processMatricula(
  input: ProcessMatriculaInput,
  onProgress?: (pct: number) => void
): Promise<ApiResponse<ProcessMatriculaResponse>> {
  if (input.archivos.length !== input.metadata.length) {
    throw new Error(
      `Archivos (${input.archivos.length}) y metadata (${input.metadata.length}) deben tener la misma longitud`
    )
  }

  const token = getToken()
  if (!token) throw new Error("No se encontró el token de autenticación")

  const formData = new FormData()

  formData.append("matricula", JSON.stringify(input.matricula))
  formData.append("metadata",  JSON.stringify(input.metadata))
  input.archivos.forEach((file) => formData.append("archivos", file))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    })

    xhr.addEventListener("load", () => {
      try {
        const body = JSON.parse(xhr.responseText) as ApiResponse<ProcessMatriculaResponse>
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body)
        } else {
          reject(new Error(body.message ?? `Error ${xhr.status}`))
        }
      } catch {
        reject(new Error(`Error ${xhr.status}: respuesta no válida`))
      }
    })

    xhr.addEventListener("error", () => reject(new Error("Error de red al enviar la matrícula")))
    xhr.addEventListener("abort", () => reject(new Error("Envío cancelado")))

    xhr.open("POST", `${API_BASE}/matriculas/create`)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.send(formData)
  })
}

// ── API object ────────────────────────────────────────────────────────────────

export const matriculasApi = {
  getAll: (limit = 50, offset = 0) =>
    api.get<PaginatedApiResponse<MatriculaConRelaciones>>(
      "/matriculas/getAll",
      { limit, offset }
    ),

    findMatriculaAndPeriodo: (estudianteId: number, matriculaId: number) =>
      api.get<ApiResponse<MatriculaConRelaciones>>(`/matriculas/findMatriculaByEstudiante/estudiante/${estudianteId}/Matricula/${matriculaId}`),

  getById: (id: number) =>
    api.get<ApiResponse<MatriculaConRelaciones>>(`/matriculas/getById/${id}`),

processMatricula,

  update: (id: number, data: Partial<CreateMatriculaInput>) =>
    api.put<ApiResponse>(`/matriculas/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/matriculas/delete/${id}`),
}