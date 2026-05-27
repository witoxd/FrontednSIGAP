import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse } from "@/lib/types"

// ── Tipos actualizados ────────────────────────────────────────────────────────
// Reconcilia el tipo legacy de lib/types.ts con lo que devuelve el backend nuevo

export interface Archivo {
  archivo_id:      number
  persona_id:      number
  tipo_archivo_id: number
  tipo_archivo?:   string        // nombre del tipo, puede venir en el join
  nombre:          string        // nombre original del archivo
  descripcion?:    string
  url_archivo:     string        // ruta relativa en el servidor
  asignado_por?:   number
  activo:          boolean       // soft-delete: false = eliminado
  es_de_matricula?: boolean      // true si está vinculado a una matrícula
  created_at?:     string
  updated_at?:     string
}

export interface UpdateArchivoInput {
  descripcion?: string
  /** Si se pasa un File, reemplaza el archivo físico (debe respetar extensiones del tipo original) */
  archivo?:     File
}

// ── Helpers internos ──────────────────────────────────────────────────────────

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api").replace(/\/$/, "")

/**
 * Fetch autenticado que retorna un Blob.
 * Usado para view y download — no se puede usar api.get porque ese
 * método parsea JSON y un Blob/stream no es JSON.
 */
async function fetchBlob(endpoint: string): Promise<Blob> {
  const res   = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).message ?? `Error ${res.status}`)
  }
  return res.blob()
}

/**
 * Abre el archivo en una nueva pestaña del navegador.
 * Crea una URL temporal de objeto, la abre y luego la revoca
 * para no dejar memoria colgada.
 */
async function abrirEnPestana(endpoint: string): Promise<void> {
  const blob = await fetchBlob(endpoint)
  const url  = URL.createObjectURL(blob)
  window.open(url, "_blank")
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Descarga el archivo al disco del usuario.
 * Usa un <a> temporal con `download` para forzar la descarga.
 */
async function descargar(archivoId: number, nombreSugerido?: string): Promise<void> {
  const blob = await fetchBlob(`/archivos/download/${archivoId}`)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = nombreSugerido ?? `archivo-${archivoId}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Actualiza metadatos o reemplaza el archivo físico.
 * Si se pasa input.archivo, envía multipart/form-data.
 * Si no, envía JSON normal.
 */
async function update(
  archivoId: number,
  input: UpdateArchivoInput
): Promise<ApiResponse<Archivo>> {
  // Si hay archivo físico nuevo → multipart
  if (input.archivo) {
    const formData = new FormData()
    formData.append("archivo", input.archivo)
    if (input.descripcion) formData.append("descripcion", input.descripcion)

    const res = await fetch(`${API_BASE}/archivos/update/${archivoId}`, {
      method:      "PUT",
      credentials: "include",
      body:        formData,
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`)
    return body
  }

  // Solo metadatos → JSON
  return api.put<ApiResponse<Archivo>>(`/archivos/update/${archivoId}`, {
    descripcion: input.descripcion,
  })
}

// ── API object ────────────────────────────────────────────────────────────────

export const archivosApi = {
  /** Lista todos los archivos de una persona (solo metadatos, sin el binario) */
  getByPersonaId: (personaId: number) =>
    api.get<ApiResponse<Archivo[]>>(`/archivos/getByPersonaId/${personaId}`),

  /** Obtiene la foto de perfil como Blob (para crear un ObjectURL) */
  getPhotoBlob: (personaId: number) =>
    fetchBlob(`/archivos/viewPhoto/${personaId}`),

  /** Abre el archivo en una nueva pestaña (para PDFs e imágenes) */
  view: (archivoId: number) =>
    abrirEnPestana(`/archivos/view/${archivoId}`),

  /** Descarga el archivo al disco */
  download: (archivoId: number, nombre?: string) =>
    descargar(archivoId, nombre),

  /** Actualiza metadatos o reemplaza el archivo físico */
  update,

  /** Soft-delete: activo = false en el backend */
  delete: (archivoId: number) =>
    api.delete<ApiResponse<void>>(`/archivos/delete/${archivoId}`),
}