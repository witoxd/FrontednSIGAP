"use client"

import { useState } from "react"
import {
  FileText, Image as ImageIcon, File,
  Eye, Download, Pencil, Trash2, Loader2,
  CheckCircle2, AlertCircle,
} from "lucide-react"
import { archivosApi, type Archivo } from "@/lib/api/services/archivos"
import { toast } from "sonner"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExtension(nombre: string): string {
  return nombre.split(".").pop()?.toUpperCase() ?? "—"
}

function getIcon(nombre: string) {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return ImageIcon
  if (ext === "pdf") return FileText
  return File
}

function formatFecha(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// Badge de extensión con color semántico
function ExtBadge({ nombre }: { nombre: string }) {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? ""
  const styles: Record<string, string> = {
    pdf:  "bg-destructive/10 text-destructive",
    jpg:  "bg-success/10 text-success",
    jpeg: "bg-success/10 text-success",
    png:  "bg-success/10 text-success",
    doc:  "bg-accent text-accent-foreground",
    docx: "bg-accent text-accent-foreground",
  }
  const cls = styles[ext] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cls}`}>
      {ext.toUpperCase()}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ArchivoCardProps {
  archivo:    Archivo
  /** Si false, oculta los botones de editar y eliminar */
  editable?:  boolean
  onEditar?:  (archivo: Archivo) => void
  onEliminado?:(archivoId: number) => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ArchivoCard({
  archivo,
  editable = true,
  onEditar,
  onEliminado,
}: ArchivoCardProps) {
  const [abriendo,    setAbriendo]    = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const Icon = getIcon(archivo.nombre)

  async function handleVer() {
    setAbriendo(true)
    try {
      await archivosApi.view(archivo.archivo_id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al abrir el archivo")
    } finally {
      setAbriendo(false)
    }
  }

  async function handleDescargar() {
    setDescargando(true)
    try {
      await archivosApi.download(archivo.archivo_id, archivo.nombre)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al descargar")
    } finally {
      setDescargando(false)
    }
  }

  async function handleEliminar() {
    if (!confirmando) { setConfirmando(true); return }
    setEliminando(true)
    setConfirmando(false)
    try {
      await archivosApi.delete(archivo.archivo_id)
      toast.success("Archivo eliminado")
      onEliminado?.(archivo.archivo_id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    } finally {
      setEliminando(false)
    }
  }

  // Estado: eliminando con confirmación de 2 clics
  // Analogía: como el "¿Estás seguro?" antes de borrar un contacto del teléfono —
  // el primer clic pide confirmación, el segundo ejecuta.
  if (eliminando) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 opacity-50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">Eliminando...</p>
      </div>
    )
  }

  return (
    <div className={`group flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 transition-colors ${
      confirmando
        ? "border-destructive/40 bg-destructive/5"
        : "border-border hover:border-border/80 hover:bg-muted/30"
    }`}>

      {/* Ícono del tipo de archivo */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">
            {archivo.nombre}
          </p>
          <ExtBadge nombre={archivo.nombre} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {archivo.descripcion && (
            <p className="text-xs text-muted-foreground truncate">
              {archivo.descripcion}
            </p>
          )}
          {archivo.tipo_archivo && (
            <span className="text-xs text-muted-foreground/60">
              {archivo.descripcion ? "·" : ""} {archivo.tipo_archivo}
            </span>
          )}
          <span className="text-xs text-muted-foreground/50">
            {archivo.descripcion || archivo.tipo_archivo ? "·" : ""} {formatFecha(archivo.created_at)}
          </span>
        </div>
      </div>

      {/* Acciones — visibles siempre en confirmando, hover en reposo */}
      <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
        confirmando ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>

        {confirmando ? (
          // Modo confirmación de eliminación
          <>
            <span className="text-xs text-destructive mr-2 font-medium">¿Eliminar?</span>
            <button
              onClick={handleEliminar}
              className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="ml-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          // Acciones normales
          <>
            {/* Ver en navegador */}
            <button
              onClick={handleVer}
              disabled={abriendo}
              title="Ver archivo"
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {abriendo
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Eye className="h-4 w-4" />
              }
            </button>

            {/* Descargar */}
            <button
              onClick={handleDescargar}
              disabled={descargando}
              title="Descargar"
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {descargando
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />
              }
            </button>

            {/* Editar — solo si editable */}
            {editable && onEditar && (
              <button
                onClick={() => onEditar(archivo)}
                title="Editar"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}

            {/* Eliminar — solo si editable */}
            {editable && (
              <button
                onClick={handleEliminar}
                title="Eliminar"
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
