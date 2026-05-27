"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { X, Upload, Loader2, File, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { archivosApi, type Archivo } from "@/lib/api/services/archivos"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse } from "@/lib/types"

// ── Tipo TipoArchivo local ────────────────────────────────────────────────────

interface TipoArchivo {
  tipo_archivo_id:         number
  nombre:                  string
  activo?:                 boolean
  extensiones_permitidas?: string[]
}

const EXT_TO_MIME: Record<string, string[]> = {
  pdf:  ["application/pdf"],
  jpg:  ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png:  ["image/png"],
  webp: ["image/webp"],
  gif:  ["image/gif"],
  doc:  ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
}

function normalizeExt(ext: string): string {
  return ext.toLowerCase().replace(/^\./, "")
}

function buildAccept(extensiones?: string[]): string {
  if (!extensiones || extensiones.length === 0) return "image/*,.pdf,.doc,.docx"
  return extensiones.map((e) => `.${normalizeExt(e)}`).join(",")
}

function getMimesPermitidos(extensiones?: string[]): string[] | null {
  if (!extensiones || extensiones.length === 0) return null
  return extensiones.flatMap((ext) => EXT_TO_MIME[normalizeExt(ext)] ?? [])
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ArchivoEditModalProps {
  archivo:    Archivo
  onGuardado: (archivoActualizado: Archivo) => void
  onCerrar:   () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ArchivoEditModal({
  archivo,
  onGuardado,
  onCerrar,
}: ArchivoEditModalProps) {
  const [descripcion,  setDescripcion]  = useState(archivo.descripcion ?? "")
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null)
  const [archivoError, setArchivoError] = useState<string | null>(null)
  const [guardando,    setGuardando]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar tipos solo para obtener las extensiones permitidas del tipo actual
  const { data: tiposData } = useSWR<PaginatedApiResponse<TipoArchivo>>(
    "/tipos-archivos/getAll",
    swrFetcher
  )
  const tipoActual = tiposData?.data?.find((t) => t.tipo_archivo_id === archivo.tipo_archivo_id)

  function handleNuevoArchivo(file: File | null) {
    setArchivoError(null)
    if (!file) { setNuevoArchivo(null); return }
    const mimes = getMimesPermitidos(tipoActual?.extensiones_permitidas)
    if (mimes && !mimes.includes(file.type)) {
      const exts = (tipoActual?.extensiones_permitidas ?? []).join(", ").toUpperCase()
      setArchivoError(`Tipo no permitido. Formatos aceptados: ${exts}`)
      return
    }
    setNuevoArchivo(file)
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const res = await archivosApi.update(archivo.archivo_id, {
        descripcion: descripcion.trim() || undefined,
        archivo:     nuevoArchivo ?? undefined,
      })

      toast.success("Archivo actualizado correctamente")
      onGuardado(res.data as Archivo)
      onCerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !guardando) onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md bg-background border border-border rounded-xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Editar archivo</h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="flex flex-col gap-4 p-5">

          {/* Info del archivo actual (solo lectura) */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border px-3 py-2.5">
            <File className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Archivo actual</p>
              <p className="text-sm font-medium text-foreground truncate">{archivo.nombre}</p>
              {tipoActual && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{tipoActual.nombre}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Descripción</label>
            <input
              disabled={guardando}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional"
              className={inputCls}
            />
          </div>

          {/* Reemplazar archivo físico (opcional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Reemplazar archivo
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
            </label>

            {nuevoArchivo ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <p className="text-sm text-foreground truncate flex-1">{nuevoArchivo.name}</p>
                <button
                  type="button"
                  onClick={() => setNuevoArchivo(null)}
                  disabled={guardando}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={guardando}
                className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4 shrink-0" />
                Seleccionar archivo nuevo...
              </button>
            )}

            {archivoError && (
              <p className="text-xs text-destructive">{archivoError}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={buildAccept(tipoActual?.extensiones_permitidas)}
              onChange={(e) => {
                handleNuevoArchivo(e.target.files?.[0] ?? null)
                e.target.value = ""
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : "Guardar cambios"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
