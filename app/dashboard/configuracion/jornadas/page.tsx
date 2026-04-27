"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Clock, Plus, Loader2, Pencil, Trash2, X } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { jornadasApi } from "@/lib/api/services/jornadas"
import type { Jornada } from "@/lib/types"
import type { PaginatedApiResponse } from "@/lib/types"

// ── Drawer ────────────────────────────────────────────────────────────────────

interface JornadaDrawerProps {
  open:      boolean
  editando?: Jornada | null
  onClose:   () => void
  onSuccess: () => void
}

function JornadaDrawer({ open, editando, onClose, onSuccess }: JornadaDrawerProps) {
  const [nombre,     setNombre]     = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin,    setHoraFin]    = useState("")
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    if (open) {
      setNombre(editando?.nombre ?? "")
      setHoraInicio(editando?.hora_inicio ?? "")
      setHoraFin(editando?.hora_fin ?? "")
    }
  }, [open, editando])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const data = {
        nombre: nombre.trim(),
        hora_inicio: horaInicio || undefined,
        hora_fin:    horaFin    || undefined,
      }
      if (editando) {
        await jornadasApi.update(editando.jornada_id, data)
        toast.success("Jornada actualizada")
      } else {
        await jornadasApi.create(data)
        toast.success("Jornada creada")
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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            {editando ? "Editar jornada" : "Nueva jornada"}
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
              placeholder="Ej: Mañana, Tarde, Nocturna"
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Hora de inicio</label>
            <input
              type="time"
              value={horaInicio}
              onChange={e => setHoraInicio(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Hora de fin</label>
            <input
              type="time"
              value={horaFin}
              onChange={e => setHoraFin(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              disabled={saving || !nombre.trim()}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editando ? "Guardar cambios" : "Crear jornada"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function JornadasPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando,   setEditando]   = useState<Jornada | null>(null)

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=100&offset=0",
    swrFetcher,
  )

  const jornadas = data?.data ?? []

  function openCreate() {
    setEditando(null)
    setDrawerOpen(true)
  }

  function openEdit(j: Jornada) {
    setEditando(j)
    setDrawerOpen(true)
  }

  async function handleDelete(j: Jornada) {
    if (!confirm(`¿Eliminar la jornada "${j.nombre}"?`)) return
    try {
      await jornadasApi.delete(j.jornada_id)
      toast.success("Jornada eliminada")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  function fmt(time?: string) {
    if (!time) return "—"
    const [h, m] = time.split(":")
    const hour = parseInt(h)
    const ampm = hour >= 12 ? "pm" : "am"
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  return (
    <>
      <div className="flex flex-col gap-0 min-h-full">

        {/* Header */}
        <div className="bg-zinc-950 dark:bg-zinc-900 text-white rounded-xl px-6 py-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20 ring-1 ring-orange-500/30">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Jornadas</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {jornadas.length} jornada{jornadas.length !== 1 ? "s" : ""} registrada{jornadas.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nueva jornada
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando jornadas...</span>
            </div>
          ) : jornadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Clock className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay jornadas registradas</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Hora inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Hora fin</th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jornadas.map(j => (
                  <tr key={j.jornada_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{j.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(j.hora_inicio)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(j.hora_fin)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(j)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(j)}
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

      <JornadaDrawer
        open={drawerOpen}
        editando={editando}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  )
}
