"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import {
  Loader2, Upload, X, FileText, Image as ImageIcon,
  File, CheckCircle2, AlertCircle, Paperclip,
} from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TipoArchivo {
  tipo_archivo_id:  number
  nombre:           string
  descripcion?:     string
  extensiones_permitidas?: string[]
  activo?:          boolean
  aplica_a?:         string | string[]   // ej: ["estudiante", "profesor"]
  /**
   * Si viene con valor, el archivo es obligatorio para ese contexto.
   * Ej: "estudiante" | "acudiente" | null
   */
  requerido_en?:    string | string[]
}

/**
 * Un slot representa un tipo de archivo con su archivo adjunto (o vacío).
 * Analogía: es como los casilleros de un expediente físico —
 * cada casillero tiene una etiqueta (tipo) y puede estar vacío o con un documento.
 */
interface Slot {
  tipo:    TipoArchivo
  file:    File | null
  preview: string | null   // solo para imágenes
  error:   string | null
}

interface ArchivoUploaderProps {
  persona_id:  number
  /**
   * Define qué tipos de archivo se consultan al backend.
   * Si no se pasa o la consulta retorna vacío, el componente no se renderiza.
   */
  contexto?:   "estudiante" | "profesor" | "acudiente" | "administrativo" | "matricula"
  onSuccess?:  (archivos: unknown[]) => void
  onError?:    (error: string) => void
  maxFileSize?: number   // MB, default 10
  className?:  string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const MIME_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const EXTENSIONES_LABEL = "PDF, JPG, PNG, DOC"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon
  if (file.type.includes("pdf"))      return FileText
  return File
}

function normalizarContextos(valor?: string | string[]): string[] {
  if (!valor) return []
  if (Array.isArray(valor)) return valor

  return valor
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function esObligatorioEnContexto(tipo: TipoArchivo, contexto?: ArchivoUploaderProps["contexto"]): boolean {
  if (!contexto) return false
  return normalizarContextos(tipo.requerido_en).includes(contexto)
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ArchivoUploader({
  persona_id,
  contexto,
  onSuccess,
  onError,
  maxFileSize = 10,
  className = "",
}: ArchivoUploaderProps) {

  // ── Carga de tipos ──────────────────────────────────────────────────────────
  /**
   * Bug corregido: el servicio usa query param `?rol=`, no path param.
   * Si no hay contexto, pasamos null como key para que SWR no haga el fetch.
   */
  const swrKey = contexto
    ? `/tipos-archivos/getByRol/${contexto}`
    : null

  const { data: tiposRes, isLoading: loadingTipos } =
    useSWR<PaginatedApiResponse<TipoArchivo>>(swrKey, swrFetcher)

  const tipos = tiposRes?.data?.filter((t) => t.activo !== false) ?? []

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [slots, setSlots]           = useState<Slot[]>([])
  const [isSubmitting, setSubmitting] = useState(false)
  const [uploadProgress, setProgress] = useState(0)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [submitted, setSubmitted]   = useState(false)

  // Inicializar slots cuando llegan los tipos (una sola vez)
  const slotsInitialized = useRef(false)
  if (tipos.length > 0 && !slotsInitialized.current) {
    setSlots(tipos.map((t) => ({ tipo: t, file: null, preview: null, error: null })))
    slotsInitialized.current = true
  }

  // ── Validación por slot ────────────────────────────────────────────────────

  function validarArchivo(file: File, maxMB: number): string | null {
    if (!MIME_PERMITIDOS.includes(file.type))
      return `Tipo no permitido. Usa: ${EXTENSIONES_LABEL}`
    if (file.size > maxMB * 1024 * 1024)
      return `Excede el tamaño máximo de ${maxMB} MB`
    return null
  }

  function handleFileChange(tipoId: number, file: File | null) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.tipo.tipo_archivo_id !== tipoId) return s

        if (!file) {
          if (s.preview) URL.revokeObjectURL(s.preview)
          return { ...s, file: null, preview: null, error: null }
        }

        const error = validarArchivo(file, maxFileSize)
        const preview = !error && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null

        return { ...s, file, preview, error }
      })
    )
    setGlobalError(null)
  }

  // ── Validación global antes de enviar ──────────────────────────────────────

  function validarFormulario(): string | null {
    // ¿Algún slot tiene error de archivo?
    const conError = slots.find((s) => s.error)
    if (conError) return `Corrige el archivo en "${conError.tipo.nombre}"`

    // ¿Falta algún obligatorio?
    const faltante = slots.find(
      (s) => esObligatorioEnContexto(s.tipo, contexto) && !s.file
    )
    if (faltante) return `El archivo "${faltante.tipo.nombre}" es obligatorio`

    // ¿Al menos un archivo seleccionado?
    const alguno = slots.some((s) => s.file)
    if (!alguno) return "Selecciona al menos un archivo para continuar"

    return null
  }

  // ── Envío ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const validationError = validarFormulario()
    if (validationError) { setGlobalError(validationError); return }

    setSubmitting(true)
    setProgress(0)
    setGlobalError(null)

    try {
      const slotsConArchivo = slots.filter((s) => s.file !== null)

      const formData = new FormData()
      formData.append("persona_id", String(persona_id))

      // metadata: mismo orden que los archivos que se adjuntan abajo
      const metadata = slotsConArchivo.map((s) => ({
        tipo_archivo_id: s.tipo.tipo_archivo_id,
        descripcion:     s.tipo.nombre,
      }))
      formData.append("metadata", JSON.stringify(metadata))

      // archivos en el mismo orden que metadata
      slotsConArchivo.forEach((s) => {
        formData.append("archivos", s.file!)
      })

      const token = typeof window !== "undefined"
        ? localStorage.getItem("sigap_token")
        : null
      if (!token) throw new Error("No se encontró el token de autenticación")

      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded * 100) / e.total))
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const body = JSON.parse(xhr.responseText)
              reject(new Error(body.message ?? `Error ${xhr.status}`))
            } catch {
              reject(new Error(`Error ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener("error", () => reject(new Error("Error de red")))

        xhr.open("POST", `${API_BASE}/archivos/bulkCreate`)
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.send(formData)
      })

      setSubmitted(true)
      onSuccess?.(slotsConArchivo.map((s) => s.file))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setGlobalError(msg)
      onError?.(msg)
    } finally {
      setSubmitting(false)
      setProgress(0)
    }
  }

  // ── Render: estados de carga / sin tipos ───────────────────────────────────

  // Sin contexto o cargando tipos: no renderizar nada todavía
  if (!contexto || loadingTipos) {
    return loadingTipos ? (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando tipos de documento...
      </div>
    ) : null
  }

  // Sin tipos retornados: no renderizar el componente
  if (tipos.length === 0) return null

  // Éxito tras envío
  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        Archivos subidos correctamente
      </div>
    )
  }

  // ── Calcular estado de completitud ─────────────────────────────────────────
  const obligatorios   = slots.filter((s) => esObligatorioEnContexto(s.tipo, contexto))
  const opcionales     = slots.filter((s) => !esObligatorioEnContexto(s.tipo, contexto))
  const obligCubiertos = obligatorios.filter((s) => s.file).length
  const totalConArchivo = slots.filter((s) => s.file).length

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-5 ${className}`}>

      {/* ── Cabecera informativa ── */}
      {obligatorios.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            Documentos obligatorios:
            <span className={`ml-1 font-medium ${
              obligCubiertos === obligatorios.length
                ? "text-success"
                : "text-destructive"
            }`}>
              {obligCubiertos}/{obligatorios.length}
            </span>
          </span>
          {totalConArchivo > 0 && (
            <span className="text-muted-foreground text-xs">
              {totalConArchivo} archivo{totalConArchivo !== 1 ? "s" : ""} seleccionado{totalConArchivo !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* ── Slots dinámicos — uno por tipo retornado ── */}
      <div className="flex flex-col gap-3">

        {/* Obligatorios primero */}
        {obligatorios.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Obligatorios
            </p>
            {obligatorios.map((s) => (
              <SlotUpload
                key={s.tipo.tipo_archivo_id}
                slot={s}
                contexto={contexto}
                maxFileSize={maxFileSize}
                disabled={isSubmitting}
                onChange={(file) => handleFileChange(s.tipo.tipo_archivo_id, file)}
              />
            ))}
          </div>
        )}

        {/* Opcionales */}
        {opcionales.length > 0 && (
          <div className="flex flex-col gap-2">
            {obligatorios.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Opcionales
              </p>
            )}
            {opcionales.map((s) => (
              <SlotUpload
                key={s.tipo.tipo_archivo_id}
                slot={s}
                contexto={contexto}
                maxFileSize={maxFileSize}
                disabled={isSubmitting}
                onChange={(file) => handleFileChange(s.tipo.tipo_archivo_id, file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Error global ── */}
      {globalError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{globalError}</p>
        </div>
      )}

      {/* ── Progreso de upload ── */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subiendo archivos...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Botón enviar ── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || totalConArchivo === 0}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
        ) : (
          <><Upload className="h-4 w-4" /> Subir {totalConArchivo > 0 ? `${totalConArchivo} archivo${totalConArchivo !== 1 ? "s" : ""}` : "archivos"}</>
        )}
      </button>
    </div>
  )
}

// ── Sub-componente: un slot por tipo de archivo ───────────────────────────────

interface SlotUploadProps {
  slot:        Slot
  contexto?:   ArchivoUploaderProps["contexto"]
  maxFileSize: number
  disabled:    boolean
  onChange:    (file: File | null) => void
}

function SlotUpload({ slot, contexto, maxFileSize, disabled, onChange }: SlotUploadProps) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const obligatorio = esObligatorioEnContexto(slot.tipo, contexto)
  const Icon        = slot.file ? getFileIcon(slot.file) : Paperclip

  return (
    <div className={`rounded-lg border transition-colors ${
      slot.error
        ? "border-destructive/50 bg-destructive/5"
        : slot.file
          ? "border-success/40 bg-success/5"
          : obligatorio
            ? "border-border border-dashed"
            : "border-border border-dashed"
    }`}>
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Ícono de estado */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          slot.file && !slot.error
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }`}>
          {slot.file && !slot.error
            ? <CheckCircle2 className="h-4 w-4" />
            : <Icon className="h-4 w-4" />
          }
        </div>

        {/* Nombre del tipo + badge obligatorio */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">
              {slot.tipo.nombre}
            </span>
            {obligatorio && (
              <span className="shrink-0 text-xs font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                Obligatorio
              </span>
            )}
          </div>

          {/* Archivo seleccionado o descripción */}
          {slot.file ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {slot.file.name} · {formatSize(slot.file.size)}
            </p>
          ) : slot.tipo.descripcion ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {slot.tipo.descripcion}
            </p>
          ) : null}

          {/* Error de validación */}
          {slot.error && (
            <p className="text-xs text-destructive mt-0.5">{slot.error}</p>
          )}
        </div>

        {/* Preview imagen */}
        {slot.preview && (
          <img
            src={slot.preview}
            alt="preview"
            className="h-10 w-10 rounded object-cover shrink-0 border border-border"
          />
        )}

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          {slot.file ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              title="Quitar archivo"
              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Seleccionar
            </button>
          )}
        </div>

        {/* Input oculto */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            onChange(f)
            // reset para poder seleccionar el mismo archivo de nuevo
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
