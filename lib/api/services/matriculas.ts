import { api, validateWith } from "../client"
import type { ApiResponse, CreateMatriculaInput } from "@/lib/types"
import {
  ApiResponseSchema,
  PaginatedApiResponseSchema,
  MatriculaConRelacionesSchema,
  MatriculaDeEstudianteSchema,
  MatriculaDetallesSchema,
} from "@/lib/schemas"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ArchivoMetadata {
  tipo_archivo_id: number
  descripcion?:    string
}

export interface ProcessMatriculaInput {
  matricula: {
    estudiante_id: number
    curso_id:      number
  }
  archivos:  File[]
  metadata:  ArchivoMetadata[]
}

export interface ProcessMatriculaResponse {
  matricula: {
    matricula_id: number
    estudiante_id: number
    curso_id: number
    periodo_id: number
    fecha_matricula: string
    estado_actual: string
    anio: number
  }
  archivos: Array<{
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

async function processMatricula(
  input: ProcessMatriculaInput,
  onProgress?: (pct: number) => void
): Promise<ApiResponse<ProcessMatriculaResponse>> {
  if (input.archivos.length !== input.metadata.length) {
    throw new Error(
      `Archivos (${input.archivos.length}) y metadata (${input.metadata.length}) deben tener la misma longitud`
    )
  }

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
    xhr.withCredentials = true
    xhr.send(formData)
  })
}

// ── API object ────────────────────────────────────────────────────────────────

export const matriculasApi = {
  getAll: (limit = 50, offset = 0) =>
    validateWith(
      PaginatedApiResponseSchema(MatriculaConRelacionesSchema),
      api.get("/matriculas/getAll", { limit, offset })
    ),

  findMatriculaAndPeriodo: (estudianteId: number, matriculaId: number) =>
    validateWith(
      ApiResponseSchema(MatriculaConRelacionesSchema),
      api.get(`/matriculas/findMatriculaByEstudiante/estudiante/${estudianteId}/Matricula/${matriculaId}`)
    ),

  getByEstudiante: (estudianteId: number) =>
    validateWith(
      ApiResponseSchema(MatriculaDeEstudianteSchema.array()),
      api.get(`/matriculas/getByEstudiante/${estudianteId}`)
    ),

  getById: (id: number) =>
    validateWith(
      ApiResponseSchema(MatriculaConRelacionesSchema),
      api.get(`/matriculas/getById/${id}`)
    ),

  getDetalles: (id: number) =>
    validateWith(
      ApiResponseSchema(MatriculaDetallesSchema),
      api.get(`/matriculas/getDetalles/${id}`)
    ),

  retirar: (id: number, motivo: string) =>
    api.put<ApiResponse>(`/matriculas/retirar/${id}`, motivo ? { motivo } : {}),

  processMatricula,

  update: (id: number, data: Partial<CreateMatriculaInput>) =>
    api.put<ApiResponse>(`/matriculas/update/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/matriculas/delete/${id}`),
}
