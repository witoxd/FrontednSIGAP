"use client"

import { useState, useEffect } from "react"
import { Loader2, FileX, Upload } from "lucide-react"
import { archivosApi, type Archivo } from "@/lib/api/services/archivos"
import { ArchivoCard }      from "./ArchivoCard"
import { ArchivoEditModal } from "./ArchivoEditModal"

// ── Props ─────────────────────────────────────────────────────────────────────

interface SeccionArchivosProps {
  personaId: number
  editable?: boolean
  /** Si se pasa, muestra un botón para ir a subir más documentos */
  onSubirMas?: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SeccionArchivos({
  personaId,
  editable = true,
  onSubirMas,
}: SeccionArchivosProps) {
  const [archivos,  setArchivos]  = useState<Archivo[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [editando,  setEditando]  = useState<Archivo | null>(null)

  useEffect(() => {
    archivosApi.getByPersonaId(personaId)
      .then((res) => setArchivos((res.data ?? []) as Archivo[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar archivos"))
      .finally(() => setCargando(false))
  }, [personaId])

  function handleEliminado(archivoId: number) {
    // Soft-delete: el backend marca activo=false, nosotros lo quitamos de la lista
    setArchivos((prev) => prev.filter((a) => a.archivo_id !== archivoId))
  }

  function handleGuardado(actualizado: Archivo) {
    setArchivos((prev) =>
      prev.map((a) => a.archivo_id === actualizado.archivo_id ? actualizado : a)
    )
  }

  // ── Render: cargando ───────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando documentos...
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-2">{error}</p>
  }

  // ── Render: sin archivos ───────────────────────────────────────────────────

  if (archivos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <FileX className="h-8 w-8" />
        <p className="text-sm">Sin documentos registrados</p>
        {editable && onSubirMas && (
          <button
            onClick={onSubirMas}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir documentos
          </button>
        )}
      </div>
    )
  }

  // ── Render principal ───────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">
          {archivos.length} documento{archivos.length !== 1 ? "s" : ""}
        </span>
        {editable && onSubirMas && (
          <button
            onClick={onSubirMas}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Subir más
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {archivos.map((archivo) => (
          <ArchivoCard
            key={archivo.archivo_id}
            archivo={archivo}
            editable={editable}
            onEditar={setEditando}
            onEliminado={handleEliminado}
          />
        ))}
      </div>

      {/* Modal de edición */}
      {editando && (
        <ArchivoEditModal
          archivo={editando}
          onGuardado={handleGuardado}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  )
}
