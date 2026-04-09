"use client"

import { useRef } from "react"
import useSWR from "swr"
import {
  Upload, X, FileText, Image as ImageIcon,
  File, CheckCircle2, Paperclip, AlertCircle, Loader2,
} from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse } from "@/lib/types"
import type { ArchivoMetadata } from "@/lib/api/services/matriculas"

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TipoArchivo {
  tipo_archivo_id: number
  nombre:          string
  descripcion?:    string
  activo?:         boolean
  requerido_en?:   string | null
}

export interface SlotState {
  tipo:    TipoArchivo
  file:    File | null
  preview: string | null
  error:   string | null
}

interface MatriculaArchivoSlotsProps {
  /** Slots controlados desde el padre */
  slots:     SlotState[]
  onChange:  (slots: SlotState[]) => void
  disabled?: boolean
  maxFileSize?: number   // MB
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon
  if (file.type.includes("pdf"))      return FileText
  return File
}

/**
 * Hook que carga los tipos de archivo para el contexto "matricula"
 * y construye los slots iniciales.
 *
 * Retorna null mientras carga, array vacío si no hay tipos.
 * El padre decide si renderizar o no basándose en esto.
 */
export function useMatriculaSlots() {
  const { data, isLoading, error } = useSWR<PaginatedApiResponse<TipoArchivo>>(
    "/tipos-archivos/getByRol/matricula",
    swrFetcher
  )

  const tipos = data?.data?.filter((t) => t.activo !== false) ?? []

  const initialSlots: SlotState[] = tipos.map((t) => ({
    tipo:    t,
    file:    null,
    preview: null,
    error:   null,
  }))

  return { initialSlots, isLoading, hasError: !!error, isEmpty: !isLoading && tipos.length === 0 }
}

/**
 * Convierte los slots en el input que espera matriculasApi.processMatricula.
 * Solo incluye los slots que tienen archivo — los vacíos opcionales se ignoran.
 */
export function slotsToApiInput(slots: SlotState[]): {
  archivos: File[]
  metadata: ArchivoMetadata[]
} {
  const conArchivo = slots.filter((s) => s.file !== null)
  return {
    archivos: conArchivo.map((s) => s.file!),
    metadata: conArchivo.map((s) => ({
      tipo_archivo_id: s.tipo.tipo_archivo_id,
      descripcion:     s.tipo.nombre,
    })),
  }
}

/**
 * Valida que todos los obligatorios tengan archivo y que no haya errores.
 * Retorna el primer mensaje de error encontrado, o null si todo está bien.
 */
export function validateSlots(slots: SlotState[]): string | null {
  const conError = slots.find((s) => s.error)
  if (conError) return `Corrige el archivo en "${conError.tipo.nombre}"`

  const faltante = slots.find((s) => s.tipo.requerido_en && !s.file)
  if (faltante) return `"${faltante.tipo.nombre}" es obligatorio`

  const alguno = slots.some((s) => s.file)
  if (!alguno) return "Adjunta al menos un documento para continuar"

  return null
}

// ── Componente principal ──────────────────────────────────────────────────────

export function MatriculaArchivoSlots({
  slots,
  onChange,
  disabled = false,
  maxFileSize = 10,
}: MatriculaArchivoSlotsProps) {
  if (slots.length === 0) return null

  function updateSlot(tipoId: number, file: File | null) {
    onChange(
      slots.map((s) => {
        if (s.tipo.tipo_archivo_id !== tipoId) return s

        // Limpiar preview anterior
        if (s.preview) URL.revokeObjectURL(s.preview)

        if (!file) return { ...s, file: null, preview: null, error: null }

        // Validar MIME
        if (!MIME_PERMITIDOS.includes(file.type)) {
          return { ...s, file: null, preview: null, error: "Tipo no permitido (PDF, JPG, PNG, DOC)" }
        }
        // Validar tamaño
        if (file.size > maxFileSize * 1024 * 1024) {
          return { ...s, file: null, preview: null, error: `Máximo ${maxFileSize} MB` }
        }

        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null

        return { ...s, file, preview, error: null }
      })
    )
  }

  const obligatorios = slots.filter((s) => s.tipo.requerido_en)
  const opcionales   = slots.filter((s) => !s.tipo.requerido_en)
  const obligCubiertos = obligatorios.filter((s) => s.file && !s.error).length

  return (
    <div className="space-y-4">

      {/* Resumen de progreso */}
      {obligatorios.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Obligatorios:
            <span className={`ml-1 font-medium tabular-nums ${
              obligCubiertos === obligatorios.length
                ? "text-success"
                : "text-destructive"
            }`}>
              {obligCubiertos}/{obligatorios.length}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {slots.filter((s) => s.file).length} archivo{slots.filter((s) => s.file).length !== 1 ? "s" : ""} seleccionado{slots.filter((s) => s.file).length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Obligatorios */}
      {obligatorios.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Requeridos
          </p>
          {obligatorios.map((s) => (
            <ArchivoSlot
              key={s.tipo.tipo_archivo_id}
              slot={s}
              disabled={disabled}
              onFileChange={(f) => updateSlot(s.tipo.tipo_archivo_id, f)}
            />
          ))}
        </div>
      )}

      {/* Opcionales */}
      {opcionales.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {obligatorios.length > 0 ? "Opcionales" : "Documentos"}
          </p>
          {opcionales.map((s) => (
            <ArchivoSlot
              key={s.tipo.tipo_archivo_id}
              slot={s}
              disabled={disabled}
              onFileChange={(f) => updateSlot(s.tipo.tipo_archivo_id, f)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Slot individual ───────────────────────────────────────────────────────────

function ArchivoSlot({
  slot,
  disabled,
  onFileChange,
}: {
  slot:         SlotState
  disabled:     boolean
  onFileChange: (file: File | null) => void
}) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const obligatorio = !!slot.tipo.requerido_en
  const Icon        = slot.file ? getIcon(slot.file) : Paperclip

  const borderClass = slot.error
    ? "border-destructive/50 bg-destructive/5"
    : slot.file
      ? "border-success/40 bg-success/5"
      : "border-border border-dashed"

  return (
    <div className={`rounded-lg border transition-colors ${borderClass}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Ícono de estado */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          slot.file && !slot.error
            ? "bg-success/10 text-success"
            : slot.error
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
        }`}>
          {slot.file && !slot.error
            ? <CheckCircle2 className="h-4 w-4" />
            : slot.error
              ? <AlertCircle className="h-4 w-4" />
              : <Icon className="h-4 w-4" />
          }
        </div>

        {/* Info */}
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

          {slot.file && !slot.error ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {slot.file.name} · {formatSize(slot.file.size)}
            </p>
          ) : slot.error ? (
            <p className="text-xs text-destructive mt-0.5">{slot.error}</p>
          ) : slot.tipo.descripcion ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {slot.tipo.descripcion}
            </p>
          ) : null}
        </div>

        {/* Preview imagen */}
        {slot.preview && (
          <img
            src={slot.preview}
            alt="preview"
            className="h-10 w-10 rounded object-cover shrink-0 border border-border"
          />
        )}

        {/* Acción */}
        {slot.file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onFileChange(null)}
            title="Quitar"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Adjuntar
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          disabled={disabled}
          onChange={(e) => {
            onFileChange(e.target.files?.[0] ?? null)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
