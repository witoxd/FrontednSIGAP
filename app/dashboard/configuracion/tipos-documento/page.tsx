"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { IdCard, Plus, Loader2, Pencil, Trash2, X } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { tiposDocumentoApi } from "@/lib/api/services/tipos-documento"
import type { TipoDocumento, PaginatedApiResponse } from "@/lib/types"

// ── Drawer ────────────────────────────────────────────────────────────────────

interface TipoDocDrawerProps {
  open:      boolean
  editando?: TipoDocumento | null
  onClose:   () => void
  onSuccess: () => void
}

function TipoDocDrawer({ open, editando, onClose, onSuccess }: TipoDocDrawerProps) {
  const [codigo,  setCodigo]  = useState("")
  const [nombre,  setNombre]  = useState("")
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (open) {
      setCodigo(editando?.tipo_documento   ?? "")
      setNombre(editando?.nombre_documento ?? "")
    }
  }, [open, editando])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo.trim() || !nombre.trim()) return
    setSaving(true)
    try {
      const data = { tipo_documento:
         {tipo_documento: codigo.trim(),
           nombre_documento: nombre.trim()
         }
          }
      if (editando) {
        await tiposDocumentoApi.update(editando.tipo_documento_id, data)
        toast.success("Tipo de documento actualizado")
      } else {
        await tiposDocumentoApi.create(data)
        toast.success("Tipo de documento creado")
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
            {editando ? "Editar tipo de documento" : "Nuevo tipo de documento"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Código *</label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="Ej: CC, TI, CE, PA"
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Abreviatura del tipo de documento</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nombre completo *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Cédula de Ciudadanía"
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
              disabled={saving || !codigo.trim() || !nombre.trim()}
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

export default function TiposDocumentoPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando,   setEditando]   = useState<TipoDocumento | null>(null)

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<TipoDocumento>>(
    "/tipos-documento/getAll?limit=100&offset=0",
    swrFetcher,
  )

  const tipos = data?.data ?? []

  function openCreate() {
    setEditando(null)
    setDrawerOpen(true)
  }

  function openEdit(t: TipoDocumento) {
    setEditando(t)
    setDrawerOpen(true)
  }

  async function handleDelete(t: TipoDocumento) {
    if (!confirm(`¿Eliminar el tipo de documento "${t.nombre_documento}"?`)) return
    try {
      await tiposDocumentoApi.delete(t.tipo_documento_id)
      toast.success("Tipo de documento eliminado")
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/30">
                <IdCard className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Tipos de Documento</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {tipos.length} tipo{tipos.length !== 1 ? "s" : ""} registrado{tipos.length !== 1 ? "s" : ""}
                </p>
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
              <IdCard className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay tipos de documento registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre</th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tipos.map(t => (
                  <tr key={t.tipo_documento_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                        {t.tipo_documento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{t.nombre_documento}</td>
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

      <TipoDocDrawer
        open={drawerOpen}
        editando={editando}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  )
}
