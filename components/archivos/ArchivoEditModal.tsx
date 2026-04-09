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
  tipo_archivo_id: number
  nombre:          string
  activo?:         boolean
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ArchivoEditModalProps {
  archivo:       Archivo
  onGuardado:    (archivoActualizado: Archivo) => void
  onCerrar:      () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ArchivoEditModal({
  archivo,
  onGuardado,
  onCerrar,
}: ArchivoEditModalProps) {
  const [nombre,        setNombre]        = useState(archivo.nombre)
  const [descripcion,   setDescripcion]   = useState(archivo.descripcion ?? "")
  const [tipoArchivoId, setTipoArchivoId] = useState<number>(archivo.tipo_archivo_id)
  const [nuevoArchivo,  setNuevoArchivo]  = useState<File | null>(null)
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar tipos de archivo para el select
  const { data: tiposData } = useSWR<PaginatedApiResponse<TipoArchivo>>(
    "/tipos-archivos/getAll",
    swrFetcher
  )
  const tipos = tiposData?.data?.filter((t) => t.activo !== false) ?? []

  const inputCls =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre no puede estar vacío"); return }

    setGuardando(true)
    setError(null)
    try {
      const res = await archivosApi.update(archivo.archivo_id, {
        nombre:          nombre.trim(),
        descripcion:     descripcion.trim() || undefined,
        tipo_archivo_id: tipoArchivoId,
        archivo:         nuevoArchivo ?? undefined,
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

  // Cerrar con Escape
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

          {/* Archivo actual */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border px-3 py-2.5">
            <File className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Archivo actual</p>
              <p className="text-sm font-medium text-foreground truncate">{archivo.nombre}</p>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              required
              disabled={guardando}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del archivo"
              className={inputCls}
            />
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

          {/* Tipo de archivo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tipo de archivo</label>
            <select
              disabled={guardando}
              value={tipoArchivoId}
              onChange={(e) => setTipoArchivoId(Number(e.target.value))}
              className={inputCls}
            >
              <option value={0} disabled>Seleccionar tipo...</option>
              {tipos.map((t) => (
                <option key={t.tipo_archivo_id} value={t.tipo_archivo_id}>
                  {t.nombre}
                </option>
              ))}
            </select>
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

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                setNuevoArchivo(e.target.files?.[0] ?? null)
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
