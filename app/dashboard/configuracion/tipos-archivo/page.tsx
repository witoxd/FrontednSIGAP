"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { FolderArchive, Plus, Loader2, Pencil, Trash2, X, CheckCircle2, XCircle, ChevronDown } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { tiposArchivosApi } from "@/lib/api/services/tipos-archivos"
import type { TipoArchivo, PaginatedApiResponse, ContextoArchivo } from "@/lib/types"

const CONTEXTO_OPTIONS: ContextoArchivo[] = ["estudiante", "profesor", "administrativo", "acudiente", "matricula"]

const EXT_GRUPOS = [
  {
    label: "Documentos",
    exts:  ["pdf", "doc", "docx", "txt"],
  },
  // {
  //   label: "Hojas de cálculo",
  //   exts:  ["xls", "xlsx", "ods", "csv"],
  // },
  {
    label: "Imágenes",
    exts:  ["jpg", "jpeg", "png", "webp", "gif"],
  },
  // {
  //   label: "Comprimidos",
  //   exts:  ["zip", "rar", "7z", "tar", "gz"],
  // },
  // {
  //   label: "Otros",
  //   exts:  ["xml", "json", "mp4", "mp3"],
  // },
] as const

// ── Drawer ────────────────────────────────────────────────────────────────────

interface TipoArchivoDrawerProps {
  open:      boolean
  editando?: TipoArchivo | null
  onClose:   () => void
  onSuccess: () => void
}

function TipoArchivoDrawer({ open, editando, onClose, onSuccess }: TipoArchivoDrawerProps) {
  const [nombre,       setNombre]       = useState("")
  const [descripcion,  setDescripcion]  = useState("")
  const [extensiones,  setExtensiones]  = useState<string[]>([])
  const [extOpen,      setExtOpen]      = useState(false)
  const [activo,       setActivo]       = useState(true)
  const [aplicaA,      setAplicaA]      = useState<ContextoArchivo[]>([])
  const [requeridoEn,  setRequeridoEn]  = useState<ContextoArchivo[]>([])
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    if (open) {
      setNombre(editando?.nombre ?? "")
      setDescripcion(editando?.descripcion ?? "")
      // Normalizar: quitar punto inicial para el estado interno
      setExtensiones(
        (editando?.extensiones_permitidas ?? []).map(e => e.replace(/^\./, ""))
      )
      setExtOpen(false)
      setActivo(editando?.activo ?? true)
      setAplicaA(editando?.aplica_a ?? [])
      setRequeridoEn(editando?.requerido_en ?? [])
    }
  }, [open, editando])

  // ext viene del botón con punto (.pdf) — el estado guarda sin punto
  function toggleExt(ext: string) {
    const key = ext.replace(/^\./, "")
    setExtensiones(prev =>
      prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
    )
  }

  function extActiva(ext: string) {
    return extensiones.includes(ext.replace(/^\./, ""))
  }

  function toggleAplicaA(val: ContextoArchivo) {
    setAplicaA(prev => {
      const next = prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
      // Si se desactiva de aplica_a, también se saca de requerido_en
      if (!next.includes(val)) {
        setRequeridoEn(r => r.filter(v => v !== val))
      }
      return next
    })
  }

  function toggleRequeridoEn(val: ContextoArchivo) {
    setRequeridoEn(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      // El backend y la BD almacenan extensiones con punto (.pdf)
      const extsConPunto = extensiones.map(e => `.${e}`)

      if (editando) {
        await tiposArchivosApi.update(editando.tipo_archivo_id, {
          tipo_archivo: {
            nombre:                 nombre.trim(),
            descripcion:            descripcion.trim() || undefined,
            extensiones_permitidas: extsConPunto.length ? extsConPunto : undefined,
            activo,
            aplica_a:               aplicaA.length ? aplicaA : undefined,
            requerido_en:           requeridoEn.length ? requeridoEn : undefined,
          }
        })
        toast.success("Tipo de archivo actualizado")
      } else {
        await tiposArchivosApi.create({
          tipo_archivo: {
            nombre:                 nombre.trim(),
            descripcion:            descripcion.trim() || undefined,
            extensiones_permitidas: extsConPunto.length ? extsConPunto : undefined,
            activo,
            aplica_a:               aplicaA.length ? aplicaA : undefined,
            requerido_en:           requeridoEn.length ? requeridoEn : undefined,
          }
        })
        toast.success("Tipo de archivo creado")
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            {editando ? "Editar tipo de archivo" : "Nuevo tipo de archivo"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Foto carnet, Acta de nacimiento"
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Descripción opcional"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Extensiones permitidas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Extensiones permitidas</label>
              {extensiones.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {extensiones.length} seleccionada{extensiones.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Chips de extensiones seleccionadas  */}
            {extensiones.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {extensiones.map(ext => (
                  <span
                    key={ext}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-mono font-medium text-primary"
                  >
                    .{ext}
                    <button
                      type="button"
                      onClick={() => setExtensiones(prev => prev.filter(e => e !== ext))}
                      className="hover:text-destructive transition-colors"
                      aria-label={`Quitar .${ext}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Acordeón de categorías */}
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExtOpen(v => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="text-muted-foreground text-xs">
                  {extOpen ? "Cerrar selector" : "Seleccionar extensiones"}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${extOpen ? "rotate-180" : ""}`} />
              </button>

              {extOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {EXT_GRUPOS.map(grupo => (
                    <div key={grupo.label} className="px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                        {grupo.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {grupo.exts.map(ext => (
                          <button
                            key={ext}
                            type="button"
                            onClick={() => toggleExt(ext)}
                            className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium border transition-colors ${
                              extActiva(ext)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            {ext}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {extensiones.length === 0 && !extOpen && (
              <p className="text-xs text-muted-foreground">
                Sin restricción — se aceptan todos los tipos de archivo
              </p>
            )}
          </div>

          {/* Aplica a */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Aplica a</label>
            <p className="text-xs text-muted-foreground -mt-1">Contextos donde este tipo de archivo es relevante</p>
            <div className="flex flex-wrap gap-2">
              {CONTEXTO_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleAplicaA(opt)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${
                    aplicaA.includes(opt)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Obligatorio en — solo muestra los que ya están en aplica_a */}
          {aplicaA.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <label className="text-sm font-medium text-foreground">Obligatorio en</label>
              <p className="text-xs text-muted-foreground -mt-1">
                Marcar los contextos donde el documento es <strong>requerido</strong> (sin él no se puede completar el proceso)
              </p>
              <div className="flex flex-wrap gap-2">
                {aplicaA.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRequeridoEn(opt)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${
                      requeridoEn.includes(opt)
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-background text-muted-foreground border-border hover:border-amber-400/60"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActivo(v => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${activo ? "bg-emerald-500" : "bg-muted"}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${activo ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <span className="text-sm text-foreground">{activo ? "Activo" : "Inactivo"}</span>
          </div>

          <div className="mt-auto flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nombre.trim()}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editando ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function TiposArchivoPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando,   setEditando]   = useState<TipoArchivo | null>(null)

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<TipoArchivo>>(
    "/tipos-archivos/getAll",
    swrFetcher,
  )

  const tipos = data?.data ?? []
  const activos   = tipos.filter(t => t.activo).length
  const inactivos = tipos.filter(t => !t.activo).length

  function openCreate() {
    setEditando(null)
    setDrawerOpen(true)
  }

  function openEdit(t: TipoArchivo) {
    setEditando(t)
    setDrawerOpen(true)
  }

  async function handleDelete(t: TipoArchivo) {
    if (!confirm(`¿Eliminar el tipo de archivo "${t.nombre}"?`)) return
    try {
      await tiposArchivosApi.delete(t.tipo_archivo_id)
      toast.success("Tipo de archivo eliminado")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  return (
    <>
      <div className="flex flex-col gap-0 min-h-full">

        {/* Header */}
        <div className="bg-zinc-950 dark:bg-zinc-900 text-white rounded-xl px-6 py-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30">
                <FolderArchive className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Tipos de Archivo</h1>
                <p className="text-xs text-zinc-400 mt-0.5">Configuración de documentos requeridos</p>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo tipo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",     value: tipos.length,  color: "border-zinc-600" },
              { label: "Activos",   value: activos,       color: "border-emerald-500" },
              { label: "Inactivos", value: inactivos,     color: "border-zinc-500" },
            ].map(s => (
              <div key={s.label} className={`border-l-4 ${s.color} pl-4 py-1`}>
                <span className="text-xs uppercase tracking-wide text-zinc-400">{s.label}</span>
                <p className="font-mono text-2xl font-bold text-white leading-none mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : tipos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <FolderArchive className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay tipos de archivo registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Extensiones</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Aplica a / Obligatorio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tipos.map(t => (
                  <tr key={t.tipo_archivo_id} className={`hover:bg-muted/30 transition-colors ${!t.activo ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{t.nombre}</p>
                      {t.descripcion && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.extensiones_permitidas ?? []).map(ext => (
                          <span key={ext} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-foreground">
                            {ext}
                          </span>
                        ))}
                        {!t.extensiones_permitidas?.length && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.aplica_a ?? []).map(ctx => (
                          <span
                            key={ctx}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                              t.requerido_en?.includes(ctx)
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ctx}
                            {t.requerido_en?.includes(ctx) && <span className="ml-0.5">*</span>}
                          </span>
                        ))}
                        {!t.aplica_a?.length && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.activo
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <XCircle      className="w-4 h-4 text-zinc-400" />
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TipoArchivoDrawer
        open={drawerOpen}
        editando={editando}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  )
}
